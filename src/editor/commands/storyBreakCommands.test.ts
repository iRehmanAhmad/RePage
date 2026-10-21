import { describe, expect, it } from 'vitest';
import { createStarterDocument, PRIMARY_STORY_ID } from '../../domain/document/createDocument';
import type { RePageDocument } from '../../domain/document/types';
import type { ParagraphNode } from '../../domain/rich-text/types';
import {
  insertStoryBreakCommand,
  setParagraphPageBreakBeforeCommand,
} from './storyBreakCommands';

function docWithParagraph(paragraph: ParagraphNode): RePageDocument {
  const doc = createStarterDocument();
  const story = doc.stories[PRIMARY_STORY_ID]!;
  return {
    ...doc,
    stories: {
      ...doc.stories,
      [PRIMARY_STORY_ID]: {
        ...story,
        content: { type: 'doc' as const, content: [paragraph] },
      },
    },
  } as RePageDocument;
}

function firstParagraph(doc: RePageDocument): ParagraphNode {
  return doc.stories[PRIMARY_STORY_ID]!.content.content[0]!;
}

describe('insertStoryBreakCommand', () => {
  it('splits a text run at the offset and preserves marks on both halves', () => {
    const doc = docWithParagraph({
      type: 'paragraph',
      direction: 'rtl',
      content: [{ type: 'text', text: 'abcdef', marks: [{ type: 'bold' }] }],
    });

    const next = insertStoryBreakCommand(doc, PRIMARY_STORY_ID, 0, 3, 'page');
    const content = firstParagraph(next).content;

    expect(content).toHaveLength(3);
    expect(content[0]).toEqual({ type: 'text', text: 'abc', marks: [{ type: 'bold' }] });
    expect(content[1]).toEqual({ type: 'break', breakType: 'page' });
    expect(content[2]).toEqual({ type: 'text', text: 'def', marks: [{ type: 'bold' }] });
    // Original document untouched (commands are pure).
    expect(firstParagraph(doc).content).toHaveLength(1);
  });

  it('inserts at the very start and very end of a paragraph', () => {
    const doc = docWithParagraph({
      type: 'paragraph',
      content: [{ type: 'text', text: 'متن' }],
    });

    const atStart = insertStoryBreakCommand(doc, PRIMARY_STORY_ID, 0, 0, 'column');
    expect(firstParagraph(atStart).content[0]).toEqual({ type: 'break', breakType: 'column' });
    expect(firstParagraph(atStart).content).toHaveLength(2);

    const atEnd = insertStoryBreakCommand(doc, PRIMARY_STORY_ID, 0, 3, 'page');
    const content = firstParagraph(atEnd).content;
    expect(content[content.length - 1]).toEqual({ type: 'break', breakType: 'page' });
  });

  it('clamps an out-of-range offset and no-ops for unknown story/paragraph', () => {
    const doc = docWithParagraph({
      type: 'paragraph',
      content: [{ type: 'text', text: 'ab' }],
    });

    const clamped = insertStoryBreakCommand(doc, PRIMARY_STORY_ID, 0, 99, 'page');
    const content = firstParagraph(clamped).content;
    expect(content[content.length - 1]).toEqual({ type: 'break', breakType: 'page' });

    expect(insertStoryBreakCommand(doc, 'no-such-story', 0, 0, 'page')).toBe(doc);
    expect(insertStoryBreakCommand(doc, PRIMARY_STORY_ID, 5, 0, 'page')).toBe(doc);
  });
});

describe('setParagraphPageBreakBeforeCommand', () => {
  it('sets and clears the flag (clearing removes the key)', () => {
    const doc = docWithParagraph({ type: 'paragraph', content: [{ type: 'text', text: 'x' }] });

    const set = setParagraphPageBreakBeforeCommand(doc, PRIMARY_STORY_ID, 0, true);
    expect(firstParagraph(set).pageBreakBefore).toBe(true);

    const cleared = setParagraphPageBreakBeforeCommand(set, PRIMARY_STORY_ID, 0, false);
    expect(firstParagraph(cleared).pageBreakBefore).toBeUndefined();
    expect('pageBreakBefore' in firstParagraph(cleared)).toBe(false);
  });

  it('no-ops when the value already matches or the target is unknown', () => {
    const doc = docWithParagraph({ type: 'paragraph', content: [] });
    expect(setParagraphPageBreakBeforeCommand(doc, PRIMARY_STORY_ID, 0, false)).toBe(doc);
    expect(setParagraphPageBreakBeforeCommand(doc, 'nope', 0, true)).toBe(doc);
    expect(setParagraphPageBreakBeforeCommand(doc, PRIMARY_STORY_ID, 3, true)).toBe(doc);
  });
});
