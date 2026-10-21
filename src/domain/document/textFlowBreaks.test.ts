import { describe, expect, it } from 'vitest';
import { addPage, addTextFrame } from '../../editor/commands/documentCommands';
import { createStarterDocument } from './createDocument';
import type { ParagraphNode } from '../rich-text/types';
import {
  computeChainTextSlices,
  getStoryBreaks,
  getStoryPlainText,
  getTextFrameChain,
  linkTextFrames,
  type ChainTextMeasurer,
} from './textFlow';
import type { RePageDocument, TextFrameObject } from './types';

/**
 * Builds a doc whose primary frame (on page 1) is linked to the given
 * extra frames (each on page 1 or page 2), all sharing one story with the
 * given paragraphs. Frames are large: capacity never drives placement,
 * only the explicit breaks do.
 */
function buildChainDoc(
  paragraphs: ParagraphNode[],
  extras: Array<{ id: string; page: 1 | 2 }>,
): { doc: RePageDocument; frameAId: string; storyId: string } {
  let doc = createStarterDocument();
  doc = addPage(doc);
  const page1 = doc.pageOrder[0]!;
  const page2 = doc.pageOrder[1]!;

  const withFrame = addTextFrame(doc, page1);
  const frameAId = Object.keys(withFrame.objects).find((id) => !doc.objects[id])!;
  const frameA = withFrame.objects[frameAId] as TextFrameObject;
  const storyId = frameA.storyId;

  const bigA: TextFrameObject = {
    ...frameA,
    frame: { ...frameA.frame, width: 400, height: 300 },
    fontSize: 10,
    lineHeight: 1,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  };

  const objects: RePageDocument['objects'] = { ...withFrame.objects, [frameAId]: bigA };
  const pages: RePageDocument['pages'] = { ...withFrame.pages };
  for (const extra of extras) {
    const pageId = extra.page === 1 ? page1 : page2;
    objects[extra.id] = { ...bigA, id: extra.id, name: extra.id, pageId };
    pages[pageId] = {
      ...pages[pageId]!,
      objectOrder: [...pages[pageId]!.objectOrder, extra.id],
    };
  }

  let out: RePageDocument = { ...withFrame, objects, pages };
  let prev = frameAId;
  for (const extra of extras) {
    out = linkTextFrames(out, prev, extra.id);
    prev = extra.id;
  }

  const story = out.stories[storyId]!;
  out = {
    ...out,
    stories: {
      ...out.stories,
      [storyId]: { ...story, content: { type: 'doc', content: paragraphs } },
    },
  };
  return { doc: out, frameAId, storyId };
}

function para(content: ParagraphNode['content']): ParagraphNode {
  return { type: 'paragraph', direction: 'rtl', content };
}

const PAGE_BREAK_STORY = [
  para([
    { type: 'text', text: 'پہلا حصہ ' },
    { type: 'break', breakType: 'page' },
    { type: 'text', text: 'دوسرا حصہ' },
  ]),
];

describe('getStoryBreaks', () => {
  it('reports break offsets in plain-text coordinates across paragraphs', () => {
    const story = {
      id: 's',
      name: 'S',
      content: {
        type: 'doc' as const,
        content: [
          para([{ type: 'text', text: 'اب' }, { type: 'break', breakType: 'page' }]),
          para([{ type: 'break', breakType: 'column' }, { type: 'text', text: 'جد' }]),
        ],
      },
    };
    expect(getStoryBreaks(story)).toEqual([
      { offset: 2, breakType: 'page' },
      { offset: 3, breakType: 'column' },
    ]);
    expect(getStoryBreaks(undefined)).toEqual([]);
  });
});

describe('computeChainTextSlices — page breaks', () => {
  it('pushes following text to the next frame on a LATER page, skipping same-page frames', () => {
    const { doc, frameAId } = buildChainDoc(PAGE_BREAK_STORY, [
      { id: 'frame-b', page: 1 },
      { id: 'frame-c', page: 2 },
    ]);
    const chain = getTextFrameChain(doc, frameAId);
    const flow = computeChainTextSlices(doc, chain)!;

    expect(flow.slices[frameAId]).toBe('پہلا حصہ ');
    expect(flow.slices['frame-b']).toBe('');
    expect(flow.slices['frame-c']).toBe('دوسرا حصہ');
    expect(flow.overflowBeyondLast).toBe(false);
  });

  it('overflows (never drops) when no frame sits on a later page', () => {
    const { doc, frameAId, storyId } = buildChainDoc(PAGE_BREAK_STORY, [
      { id: 'frame-b', page: 1 },
    ]);
    const chain = getTextFrameChain(doc, frameAId);
    const flow = computeChainTextSlices(doc, chain)!;

    expect(flow.slices[frameAId]).toBe('پہلا حصہ ');
    expect(flow.slices['frame-b']).toBe('');
    expect(flow.overflowBeyondLast).toBe(true);
    expect(flow.overflowText).toBe('دوسرا حصہ');
    // Nothing lost: placed slices + overflow reconstruct the story text.
    expect(
      flow.slices[frameAId]! + flow.slices['frame-b']! + flow.overflowText,
    ).toBe(getStoryPlainText(doc.stories[storyId]));
  });

  it('honors the page break under the measured layout too', () => {
    const { doc, frameAId } = buildChainDoc(PAGE_BREAK_STORY, [
      { id: 'frame-b', page: 1 },
      { id: 'frame-c', page: 2 },
    ]);
    const measurer: ChainTextMeasurer = {
      measureTokenPx: (token) => token.length * 5,
      lineHeightPx: () => 10,
    };
    const chain = getTextFrameChain(doc, frameAId);
    const flow = computeChainTextSlices(doc, chain, measurer)!;

    expect(flow.slices[frameAId]).toBe('پہلا حصہ ');
    expect(flow.slices['frame-b']).toBe('');
    expect(flow.slices['frame-c']).toBe('دوسرا حصہ');
    expect(flow.overflowBeyondLast).toBe(false);
  });
});

describe('computeChainTextSlices — column breaks', () => {
  it('moves following text to the next frame in the chain', () => {
    const story = [
      para([
        { type: 'text', text: 'ایک ' },
        { type: 'break', breakType: 'column' },
        { type: 'text', text: 'دو' },
      ]),
    ];
    const { doc, frameAId } = buildChainDoc(story, [{ id: 'frame-b', page: 1 }]);
    const chain = getTextFrameChain(doc, frameAId);
    const flow = computeChainTextSlices(doc, chain)!;

    expect(flow.slices[frameAId]).toBe('ایک ');
    expect(flow.slices['frame-b']).toBe('دو');
    expect(flow.overflowBeyondLast).toBe(false);
  });

  it('a column break in the last frame overflows with the remaining text', () => {
    const story = [
      para([
        { type: 'text', text: 'ایک' },
        { type: 'break', breakType: 'column' },
        { type: 'text', text: 'دو' },
        { type: 'break', breakType: 'column' },
        { type: 'text', text: 'تین' },
      ]),
    ];
    const { doc, frameAId } = buildChainDoc(story, [{ id: 'frame-b', page: 1 }]);
    const chain = getTextFrameChain(doc, frameAId);
    const flow = computeChainTextSlices(doc, chain)!;

    expect(flow.slices[frameAId]).toBe('ایک');
    expect(flow.slices['frame-b']).toBe('دو');
    expect(flow.overflowBeyondLast).toBe(true);
    expect(flow.overflowText).toBe('تین');
  });
});
