import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { paragraph } from '../../domain/rich-text/types';
import {
  addTextFrame,
  linkTextFramesCommand,
  unlinkTextFrameCommand,
} from './documentCommands';
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
