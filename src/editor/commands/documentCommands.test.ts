import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { paragraph } from '../../domain/rich-text/types';
import {
  addTextFrame,
  linkTextFramesCommand,
  unlinkTextFrameCommand,
} from './documentCommands';
import { applyStyleToStory } from './styleCommands';
import { computeChainTextSlices, getStoryPlainText } from '../../domain/document/textFlow';
import type { RePageDocument, TextFrameObject, TextStory } from '../../domain/document/types';

function twoFrameDoc(text: string): { doc: RePageDocument; frame1: string; frame2: string; storyId: string } {
  const rawDoc = createStarterDocument();
  const pageId = rawDoc.pageOrder[0]!;
  const afterFirst = addTextFrame(rawDoc, pageId);
  const frame1 = afterFirst.pages[pageId]!.objectOrder[afterFirst.pages[pageId]!.objectOrder.length - 1]!;
  const afterSecond = addTextFrame(afterFirst, pageId);
  const frame2 = afterSecond.pages[pageId]!.objectOrder[afterSecond.pages[pageId]!.objectOrder.length - 1]!;
  const storyId = (afterSecond.objects[frame1] as TextFrameObject).storyId;

  const story = afterSecond.stories[storyId]!;
  const updatedStory: TextStory = {
    ...story,
    content: { type: 'doc', content: [paragraph(text)] },
  };
  const doc: RePageDocument = {
    ...afterSecond,
    stories: { ...afterSecond.stories, [storyId]: updatedStory },
  };
  return { doc, frame1, frame2, storyId };
}


/** Builds a doc with three small linked text frames (A→B→C) sharing one story. */
function threeFrameDoc(text: string): {
  doc: RePageDocument; frameA: string; frameB: string; frameC: string; storyId: string;
} {
  const { doc: twoDoc, frame1, frame2, storyId } = twoFrameDoc(text);
  const pageId = twoDoc.pageOrder[0]!;

  // Shrink frames so capacities are small and deterministic (mirrors the
  // textFlow slicing tests: 100x60, fontSize 10 -> 132-char capacity).
  const shrink = (id: string, src: RePageDocument): TextFrameObject => {
    const f = src.objects[id] as TextFrameObject;
    return {
      ...f,
      frame: { ...f.frame, width: 100, height: 60 },
      fontSize: 10,
      lineHeight: 1,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    };
  };
  // twoFrameDoc leaves A and B unlinked: link A→B first.
  const linkedAB = linkTextFramesCommand(twoDoc, frame1, frame2);
  const frame3: TextFrameObject = {
    ...shrink(frame1, linkedAB),
    id: 'frame-3',
    name: 'Frame 3',
    storyId: 'other-story',
    nextFrameId: null,
    previousFrameId: null,
  };
  const docWith3: RePageDocument = {
    ...linkedAB,
    objects: {
      ...linkedAB.objects,
      [frame1]: shrink(frame1, linkedAB),
      [frame2]: shrink(frame2, linkedAB),
      'frame-3': frame3,
    },
    pages: {
      ...linkedAB.pages,
      [pageId]: {
        ...linkedAB.pages[pageId]!,
        objectOrder: [...linkedAB.pages[pageId]!.objectOrder, 'frame-3'],
      },
    },
  };
  const linked = linkTextFramesCommand(docWith3, frame2, 'frame-3');
  return { doc: linked, frameA: frame1, frameB: frame2, frameC: 'frame-3', storyId };
}

describe('linkTextFramesCommand', () => {
  it('links two frames and recomputes the chain', () => {
    const { doc, frame1, frame2, storyId } = twoFrameDoc('linked story text');
    const linked = linkTextFramesCommand(doc, frame1, frame2);

    const f1 = linked.objects[frame1] as TextFrameObject;
    const f2 = linked.objects[frame2] as TextFrameObject;
    expect(f1.nextFrameId).toBe(frame2);
    expect(f2.previousFrameId).toBe(frame1);
    expect(f2.storyId).toBe(storyId);
    expect(f2.sequenceIndex).toBe(1);
    // Short text fits: no overflow badges.
    expect(f1.overflow).toBe(false);
    expect(f2.overflow).toBe(false);
    // Document is touched.
    expect(linked.metadata.modifiedAt).toBeTruthy();
  });

  it('throws on circular links', () => {
    const { doc, frame1, frame2 } = twoFrameDoc('x');
    const linked = linkTextFramesCommand(doc, frame1, frame2);
    expect(() => linkTextFramesCommand(linked, frame2, frame1)).toThrow();
  });

  it('throws when the target is not a text frame', () => {
    const { doc, frame1 } = twoFrameDoc('x');
    expect(() => linkTextFramesCommand(doc, frame1, 'missing-id')).toThrow();
  });
});

describe('unlinkTextFrameCommand', () => {
  it('breaks the chain and clears overflow flags', () => {
    const longText = Array.from({ length: 300 }, (_, i) => `لفظ${i}`).join(' ');
    const { doc, frame1, frame2 } = twoFrameDoc(longText);
    const linked = linkTextFramesCommand(doc, frame1, frame2);
    expect((linked.objects[frame2] as TextFrameObject).previousFrameId).toBe(frame1);

    const unlinked = unlinkTextFrameCommand(linked, frame2);
    const f1 = unlinked.objects[frame1] as TextFrameObject;
    const f2 = unlinked.objects[frame2] as TextFrameObject;
    expect(f2.nextFrameId ?? null).toBeNull();
    expect(f2.previousFrameId ?? null).toBeNull();
    expect(f1.nextFrameId ?? null).toBeNull();
    // frame1 is a single-frame chain again: overflow reflects its own fit.
    expect(typeof f1.overflow).toBe('boolean');
  });

  it('is a no-op for frames that were never linked', () => {
    const { doc, frame1 } = twoFrameDoc('x');
    const result = unlinkTextFrameCommand(doc, frame1);
    const f1 = result.objects[frame1] as TextFrameObject;
    expect(f1.nextFrameId ?? null).toBeNull();
    expect(f1.previousFrameId ?? null).toBeNull();
  });
});

describe('unlinkTextFrameCommand story fork', () => {
  const longText = Array.from({ length: 300 }, (_, i) => `لفظ${i}`).join(' ');

  it('detaches the middle frame keeping its downstream chain (A→B→C becomes A and B→C)', () => {
    const { doc, frameA, frameB, frameC } = threeFrameDoc(longText);
    const unlinked = unlinkTextFrameCommand(doc, frameB);
    const a = unlinked.objects[frameA] as TextFrameObject;
    const b = unlinked.objects[frameB] as TextFrameObject;
    const c = unlinked.objects[frameC] as TextFrameObject;
    expect(a.nextFrameId ?? null).toBeNull();
    expect(b.previousFrameId ?? null).toBeNull();
    expect(b.nextFrameId).toBe(frameC);
    expect(c.previousFrameId).toBe(frameB);
    expect(b.sequenceIndex).toBe(0);
    expect(c.sequenceIndex).toBe(1);
  });

  it('forks an independent story for the detached subchain with its displayed text', () => {
    const { doc, frameA, frameB, frameC, storyId } = threeFrameDoc(longText);
    const chain = [frameA, frameB, frameC].map((id) => doc.objects[id] as TextFrameObject);
    const flow = computeChainTextSlices(doc, chain)!;
    const expectedUpstream = flow.slices[frameA] ?? '';
    const expectedForked = (flow.slices[frameB] ?? '') + (flow.slices[frameC] ?? '') + flow.overflowText;

    const unlinked = unlinkTextFrameCommand(doc, frameB);
    const a = unlinked.objects[frameA] as TextFrameObject;
    const b = unlinked.objects[frameB] as TextFrameObject;
    const c = unlinked.objects[frameC] as TextFrameObject;

    // Story identity: A keeps the original, B+C share a new fork.
    expect(a.storyId).toBe(storyId);
    expect(b.storyId).not.toBe(storyId);
    expect(c.storyId).toBe(b.storyId);
    expect(unlinked.stories[b.storyId]?.name).toContain('(fork)');

    // Text split: upstream keeps its slices, fork keeps its slices + overflow.
    expect(getStoryPlainText(unlinked.stories[a.storyId])).toBe(expectedUpstream);
    expect(getStoryPlainText(unlinked.stories[b.storyId])).toBe(expectedForked);
  });

  it('makes the fork independent: editing one side does not affect the other', () => {
    const { doc, frameA, frameB, storyId } = threeFrameDoc(longText);
    const unlinked = unlinkTextFrameCommand(doc, frameB);
    const b = unlinked.objects[frameB] as TextFrameObject;
    const forkedBefore = getStoryPlainText(unlinked.stories[b.storyId]);
    const edited = applyStyleToStory(unlinked, b.storyId, 'poetry');
    // Original story untouched by the fork's restyle.
    expect(getStoryPlainText(edited.stories[storyId])).toBe(
      getStoryPlainText(unlinked.stories[storyId]),
    );
    expect(edited.stories[storyId]!.content.content[0]!.styleId).toBeUndefined();
    expect(getStoryPlainText(edited.stories[b.storyId])).toBe(forkedBefore);
    void frameA;
  });

  it('forks the head frame out, leaving the downstream chain on the original story', () => {
    const { doc, frameA, frameB, frameC, storyId } = threeFrameDoc(longText);
    const chain = [frameA, frameB, frameC].map((id) => doc.objects[id] as TextFrameObject);
    const flow = computeChainTextSlices(doc, chain)!;
    const expectedHead = flow.slices[frameA] ?? '';
    const expectedDownstream =
      (flow.slices[frameB] ?? '') + (flow.slices[frameC] ?? '') + flow.overflowText;

    const unlinked = unlinkTextFrameCommand(doc, frameA);
    const a = unlinked.objects[frameA] as TextFrameObject;
    const b = unlinked.objects[frameB] as TextFrameObject;
    const c = unlinked.objects[frameC] as TextFrameObject;

    // Links: head detached, downstream stays chained.
    expect(a.nextFrameId ?? null).toBeNull();
    expect(a.previousFrameId ?? null).toBeNull();
    expect(b.previousFrameId ?? null).toBeNull();
    expect(b.nextFrameId).toBe(frameC);
    expect(c.previousFrameId).toBe(frameB);
    // Stories: head forked, downstream keeps the original.
    expect(a.storyId).not.toBe(storyId);
    expect(b.storyId).toBe(storyId);
    expect(c.storyId).toBe(storyId);
    expect(getStoryPlainText(unlinked.stories[a.storyId])).toBe(expectedHead);
    expect(getStoryPlainText(unlinked.stories[storyId])).toBe(expectedDownstream);
    // Overflow badges recomputed on both resulting chains.
    expect(typeof a.overflow).toBe('boolean');
    expect(typeof b.overflow).toBe('boolean');
    expect(typeof c.overflow).toBe('boolean');
  });

  it('touches the document (dirty semantics)', () => {
    const { doc, frameB } = threeFrameDoc(longText);
    const unlinked = unlinkTextFrameCommand(doc, frameB);
    expect(unlinked.metadata.modifiedAt).toBeTruthy();
  });
});

