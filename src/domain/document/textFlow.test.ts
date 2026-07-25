import { describe, expect, it } from 'vitest';
import { createStarterDocument } from './createDocument';
import {
  checkFrameOverflow,
  getStoryFramesInSequence,
  linkTextFrames,
  unlinkTextFrame,
} from './textFlow';
import type { TextFrameObject } from './types';

describe('textFlow foundations', () => {
  it('links two text frames into a multi-frame story chain', () => {
    const doc = createStarterDocument();
    const frame1Id = Object.keys(doc.objects)[0]!;
    const story1Id = (doc.objects[frame1Id] as TextFrameObject).storyId;

    // Add a second text frame to page-1
    const frame2Id = 'frame-body-2';
    const frame2: TextFrameObject = {
      id: frame2Id,
      pageId: 'page-1',
      name: 'Linked Body Frame 2',
      type: 'text-frame',
      storyId: 'story-headline',
      frame: { x: 36, y: 300, width: 523, height: 200, rotation: 0 },
      locked: false,
      hidden: false,
      opacity: 1,
      fontFamily: 'Noto Nastaliq Urdu',
      fontSize: 18,
      color: '#0f172a',
      lineHeight: 1.8,
      padding: { top: 12, right: 12, bottom: 12, left: 12 },
    };

    const docWith2Frames = {
      ...doc,
      objects: { ...doc.objects, [frame2Id]: frame2 },
    };

    const linkedDoc = linkTextFrames(docWith2Frames, frame1Id, frame2Id);
    const f1 = linkedDoc.objects[frame1Id] as TextFrameObject;
    const f2 = linkedDoc.objects[frame2Id] as TextFrameObject;

    expect(f1.nextFrameId).toBe(frame2Id);
    expect(f2.previousFrameId).toBe(frame1Id);
    expect(f2.sequenceIndex).toBe(1);

    const sequence = getStoryFramesInSequence(linkedDoc, story1Id);
    expect(sequence).toHaveLength(2);
    expect(sequence[0]?.id).toBe(frame1Id);
    expect(sequence[1]?.id).toBe(frame2Id);
  });

  it('unlinks a text frame cleanly', () => {
    const doc = createStarterDocument();
    const frame1Id = Object.keys(doc.objects)[0]!;

    const frame2Id = 'frame-body-2';
    const frame2: TextFrameObject = {
      id: frame2Id,
      pageId: 'page-1',
      name: 'Linked Body Frame 2',
      type: 'text-frame',
      storyId: 'story-headline',
      frame: { x: 36, y: 300, width: 523, height: 200, rotation: 0 },
      locked: false,
      hidden: false,
      opacity: 1,
      fontFamily: 'Noto Nastaliq Urdu',
      fontSize: 18,
      color: '#0f172a',
      lineHeight: 1.8,
      padding: { top: 12, right: 12, bottom: 12, left: 12 },
    };

    const docWith2Frames = {
      ...doc,
      objects: { ...doc.objects, [frame2Id]: frame2 },
    };

    const linkedDoc = linkTextFrames(docWith2Frames, frame1Id, frame2Id);
    const unlinkedDoc = unlinkTextFrame(linkedDoc, frame2Id);

    const f1 = unlinkedDoc.objects[frame1Id] as TextFrameObject;
    const f2 = unlinkedDoc.objects[frame2Id] as TextFrameObject;

    expect(f1.nextFrameId).toBeNull();
    expect(f2.previousFrameId).toBeNull();
  });

  it('detects text frame overflow correctly', () => {
    const shortText = 'مختصر متن';
    expect(checkFrameOverflow(shortText, 24, 1.8, 500, 200)).toBe(false);

    const longText = 'اردو پیج '.repeat(100);
    expect(checkFrameOverflow(longText, 24, 1.8, 200, 50)).toBe(true);
  });
});
