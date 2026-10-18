import { describe, expect, it } from 'vitest';
import { addTextFrame } from '../../editor/commands/documentCommands';
import { createStarterDocument } from './createDocument';
import { paragraph } from '../../domain/rich-text/types';
import {
  applyChainOverflowFlags,
  computeChainTextSlices,
  estimateFrameCharCapacity,
  getStoryPlainText,
  getTextFrameChain,
  linkTextFrames,
} from './textFlow';
import type { ObjectId, RePageDocument, TextFrameObject, TextStory } from './types';

function storyWithText(doc: RePageDocument, storyId: string, text: string): RePageDocument {
  const story = doc.stories[storyId];
  if (!story) throw new Error(`story ${storyId} missing`);
  const updatedStory: TextStory = {
    ...story,
    content: { type: 'doc', content: [paragraph(text)] },
  };
  return { ...doc, stories: { ...doc.stories, [storyId]: updatedStory } };
}

/** Builds a doc with two small linked text frames sharing one story. */
function twoFrameDoc(text: string): { doc: RePageDocument; frame1: ObjectId; frame2: ObjectId; storyId: string } {
  const rawDoc = createStarterDocument();
  const pageId = rawDoc.pageOrder[0]!;
  const docAfterAdd = addTextFrame(rawDoc, pageId);
  const frame1 = Object.keys(docAfterAdd.objects)[0]!;
  const storyId = (docAfterAdd.objects[frame1] as TextFrameObject).storyId;

  // Shrink frame 1 so capacities are small and deterministic.
  const f1 = docAfterAdd.objects[frame1] as TextFrameObject;
  const smallF1: TextFrameObject = {
    ...f1,
    frame: { ...f1.frame, width: 100, height: 60 },
    fontSize: 10,
    lineHeight: 1,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  };
  const frame2: TextFrameObject = {
    ...smallF1,
    id: 'frame-2',
    name: 'Frame 2',
    storyId: 'other-story',
  };
  const docWith2 = {
    ...docAfterAdd,
    objects: { ...docAfterAdd.objects, [frame1]: smallF1, 'frame-2': frame2 },
    pages: {
      ...docAfterAdd.pages,
      [pageId]: {
        ...docAfterAdd.pages[pageId]!,
        objectOrder: [...docAfterAdd.pages[pageId]!.objectOrder, 'frame-2'],
      },
    },
  };
  const linked = linkTextFrames(docWith2, frame1, 'frame-2');
  return { doc: storyWithText(linked, storyId, text), frame1, frame2: 'frame-2', storyId };
}

describe('text-flow chain walking', () => {
  it('returns the full chain in flow order starting from any member', () => {
    const { doc, frame1, frame2 } = twoFrameDoc('hello world');
    expect(getTextFrameChain(doc, frame1).map((f) => f.id)).toEqual([frame1, frame2]);
    expect(getTextFrameChain(doc, frame2).map((f) => f.id)).toEqual([frame1, frame2]);
  });

  it('returns a single-frame chain for unlinked frames', () => {
    const rawDoc = createStarterDocument();
    const pageId = rawDoc.pageOrder[0]!;
    const document = addTextFrame(rawDoc, pageId);
    const objectId = Object.keys(document.objects)[0]!;
    expect(getTextFrameChain(document, objectId)).toHaveLength(1);
  });

  it('terminates on malformed cycles instead of looping forever', () => {
    const { doc, frame1, frame2 } = twoFrameDoc('x');
    const cyclic = {
      ...doc,
      objects: {
        ...doc.objects,
        [frame1]: { ...(doc.objects[frame1] as TextFrameObject), previousFrameId: frame2 },
      },
    };
    const chain = getTextFrameChain(cyclic, frame1);
    expect(chain.length).toBeLessThanOrEqual(2);
  });

  it('returns [] for unknown or non-text-frame ids', () => {
    const rawDoc = createStarterDocument();
    expect(getTextFrameChain(rawDoc, 'nope')).toEqual([]);
  });
});

describe('estimateFrameCharCapacity', () => {
  it('is deterministic and positive', () => {
    const { doc, frame1 } = twoFrameDoc('x');
    const frame = doc.objects[frame1] as TextFrameObject;
    // width 100 / (10 * 0.45) = 22 chars per line; height 60 / 10 = 6 lines
    expect(estimateFrameCharCapacity(frame)).toBe(132);
    expect(estimateFrameCharCapacity(frame)).toBe(estimateFrameCharCapacity(frame));
  });
});

describe('computeChainTextSlices', () => {
  it('returns null for single-frame chains', () => {
    const rawDoc = createStarterDocument();
    const pageId = rawDoc.pageOrder[0]!;
    const document = addTextFrame(rawDoc, pageId);
    const objectId = Object.keys(document.objects)[0]!;
    const chain = getTextFrameChain(document, objectId);
    expect(computeChainTextSlices(document, chain)).toBeNull();
  });

  it('keeps short text entirely in the first frame', () => {
    const { doc, frame1, frame2 } = twoFrameDoc('مختصر متن');
    const chain = getTextFrameChain(doc, frame1);
    const flow = computeChainTextSlices(doc, chain);
    expect(flow).not.toBeNull();
    expect(flow!.slices[frame1]).toBe('مختصر متن');
    expect(flow!.slices[frame2]).toBe('');
    expect(flow!.overflowBeyondLast).toBe(false);
  });

  it('splits long text across frames without losing or duplicating text', () => {
    // ~199 chars: more than frame 1's capacity (132), less than both frames (264).
    const words = Array.from({ length: 30 }, (_, i) => `لفظ${i}`);
    const text = words.join(' ');
    const { doc, frame1, frame2, storyId } = twoFrameDoc(text);
    const chain = getTextFrameChain(doc, frame1);
    const flow = computeChainTextSlices(doc, chain);
    expect(flow).not.toBeNull();
    expect(flow!.overflowBeyondLast).toBe(false);
    // Frame 1 (capacity 132) must be filled, frame 2 gets the rest.
    expect(flow!.slices[frame1]!.length).toBeGreaterThan(0);
    expect(flow!.slices[frame2]!.length).toBeGreaterThan(0);
    // No loss, no duplication: concatenation equals the story text.
    expect(flow!.slices[frame1]! + flow!.slices[frame2]!).toBe(getStoryPlainText(doc.stories[storyId]));
    // Split happened at a word boundary: the seam touches whitespace on at least one side.
    const tail1 = flow!.slices[frame1]!.slice(-1);
    const head2 = flow!.slices[frame2]!.slice(0, 1);
    expect(/\s/.test(tail1) || /\s/.test(head2)).toBe(true);
  });

  it('flags overflow when text exceeds total chain capacity', () => {
    const text = Array.from({ length: 200 }, (_, i) => `لفظ${i}`).join(' ');
    const { doc, frame1, frame2 } = twoFrameDoc(text);
    const chain = getTextFrameChain(doc, frame1);
    const flow = computeChainTextSlices(doc, chain);
    expect(flow).not.toBeNull();
    expect(flow!.overflowBeyondLast).toBe(true);
    expect(flow!.slices[frame1]!.length).toBeGreaterThan(0);
    expect(flow!.slices[frame2]!.length).toBeGreaterThan(0);
  });

  it('handles empty stories', () => {
    const { doc, frame1, frame2 } = twoFrameDoc('');
    const chain = getTextFrameChain(doc, frame1);
    const flow = computeChainTextSlices(doc, chain);
    expect(flow!.slices[frame1]).toBe('');
    expect(flow!.slices[frame2]).toBe('');
    expect(flow!.overflowBeyondLast).toBe(false);
  });
});

describe('applyChainOverflowFlags', () => {
  it('sets overflow only on the last frame when text overflows the chain', () => {
    const text = Array.from({ length: 200 }, (_, i) => `لفظ${i}`).join(' ');
    const { doc, frame1, frame2 } = twoFrameDoc(text);
    const flagged = applyChainOverflowFlags(doc, frame1);
    expect((flagged.objects[frame1] as TextFrameObject).overflow).toBe(false);
    expect((flagged.objects[frame2] as TextFrameObject).overflow).toBe(true);
  });

  it('clears overflow flags when everything fits', () => {
    const { doc, frame1, frame2 } = twoFrameDoc('short');
    const flagged = applyChainOverflowFlags(doc, frame1);
    expect((flagged.objects[frame1] as TextFrameObject).overflow).toBe(false);
    expect((flagged.objects[frame2] as TextFrameObject).overflow).toBe(false);
  });
});
