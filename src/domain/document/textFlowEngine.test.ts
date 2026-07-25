import { describe, expect, it } from 'vitest';
import { addTextFrame } from '../../editor/commands/documentCommands';
import { createStarterDocument } from './createDocument';
import {
  deleteTextFramePreservingStory,
  linkTextFramesEngine,
  preventCircularLinks,
  reflowStoryContentEngine,
} from './textFlowEngine';
import type { TextFrameObject } from './types';

describe('textFlowEngine (M3.1)', () => {
  it('prevents circular frame links cleanly', () => {
    const raw = createStarterDocument();
    const doc = addTextFrame(raw, raw.pageOrder[0]!);
    const frame1Id = Object.keys(doc.objects)[0]!;

    expect(preventCircularLinks(doc, frame1Id, frame1Id)).toBe(true);
  });

  it('rejects circular link attempts during linking', () => {
    const raw = createStarterDocument();
    const doc = addTextFrame(raw, raw.pageOrder[0]!);
    const frame1Id = Object.keys(doc.objects)[0]!;

    expect(() => linkTextFramesEngine(doc, frame1Id, frame1Id)).toThrow(
      'Circular link reference detected',
    );
  });

  it('deletes a text frame while retaining canonical story in doc.stories', () => {
    const raw = createStarterDocument();
    const doc = addTextFrame(raw, raw.pageOrder[0]!);
    const frame1Id = Object.keys(doc.objects)[0]!;
    const story1Id = (doc.objects[frame1Id] as TextFrameObject).storyId;

    const docAfterDelete = deleteTextFramePreservingStory(doc, frame1Id);

    expect(docAfterDelete.objects[frame1Id]).toBeUndefined();
    expect(docAfterDelete.stories[story1Id]).toBeDefined();
  });

  it('reflows story content and sets sequence numbers across frame chains', () => {
    const raw = createStarterDocument();
    const doc = addTextFrame(raw, raw.pageOrder[0]!);
    const frame1Id = Object.keys(doc.objects)[0]!;
    const story1Id = (doc.objects[frame1Id] as TextFrameObject).storyId;

    const frame2Id = 'frame-page2-body';
    const frame2: TextFrameObject = {
      id: frame2Id,
      pageId: 'page-1',
      name: 'Body Frame Page 2',
      type: 'text-frame',
      storyId: story1Id,
      frame: { x: 36, y: 300, width: 500, height: 200, rotation: 0 },
      locked: false,
      hidden: false,
      opacity: 1,
      fontFamily: 'Noto Nastaliq Urdu',
      fontSize: 18,
      color: '#0f172a',
      lineHeight: 1.8,
      padding: { top: 6, right: 6, bottom: 6, left: 6 },
    };

    const doc2 = {
      ...doc,
      objects: { ...doc.objects, [frame2Id]: frame2 },
    };

    const linkedDoc = linkTextFramesEngine(doc2, frame1Id, frame2Id);
    const reflowed = reflowStoryContentEngine(linkedDoc, story1Id);

    const f1 = reflowed.objects[frame1Id] as TextFrameObject;
    const f2 = reflowed.objects[frame2Id] as TextFrameObject;

    expect(f1.sequenceIndex).toBe(0);
    expect(f2.sequenceIndex).toBe(1);
  });
});
