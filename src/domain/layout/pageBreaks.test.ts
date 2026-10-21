import { describe, expect, it } from 'vitest';
import { createStarterDocument, PRIMARY_STORY_ID } from '../document/createDocument';
import type { RePageDocument } from '../document/types';
import type { ParagraphNode } from '../rich-text/types';
import { addPage } from '../../editor/commands/documentCommands';
import { insertSectionBreakCommand } from '../../editor/commands/pageLayoutCommands';
import { repaginateDocument } from './paginationEngine';
import {
  computeParityBlanks,
  getPhysicalPageIndex,
} from './sectionEngine';
import {
  getParityBlankPageNumberString,
  getSectionPageNumberString,
} from '../unicode/pageNumbering';

function docWithParagraphs(paragraphs: ParagraphNode[]): RePageDocument {
  const doc = createStarterDocument();
  const story = doc.stories[PRIMARY_STORY_ID]!;
  return {
    ...doc,
    stories: {
      ...doc.stories,
      [PRIMARY_STORY_ID]: { ...story, content: { type: 'doc', content: paragraphs } },
    },
  };
}

function paraWithBreak(
  before: string,
  breakType: 'page' | 'column',
  after: string,
): ParagraphNode {
  return {
    type: 'paragraph',
    direction: 'rtl',
    content: [
      { type: 'text', text: before },
      { type: 'break', breakType },
      { type: 'text', text: after },
    ],
  };
}

function shortPara(text: string, extra?: Partial<ParagraphNode>): ParagraphNode {
  return { type: 'paragraph', direction: 'rtl', content: [{ type: 'text', text }], ...extra };
}

function fragmentTexts(doc: RePageDocument): string[] {
  return doc.stories[PRIMARY_STORY_ID]!.content.content.map((p) =>
    p.content.map((n) => (n.type === 'text' ? n.text : '')).join(''),
  );
}

describe('repaginateDocument — explicit breaks', () => {
  it('starts text after a page break on the next page', () => {
    const doc = docWithParagraphs([paraWithBreak('آغاز', 'page', 'اختتام')]);
    const result = repaginateDocument(doc, PRIMARY_STORY_ID);

    expect(fragmentTexts(result.repaginatedDoc)).toEqual(['آغاز', 'اختتام']);
    expect(result.paragraphPageMap).toEqual([0, 1]);
    expect(result.requiredPages).toBe(2);
  });

  it('keeps the same text on one page without the break (control)', () => {
    const doc = docWithParagraphs([
      {
        type: 'paragraph',
        direction: 'rtl',
        content: [
          { type: 'text', text: 'آغاز' },
          { type: 'text', text: 'اختتام' },
        ],
      },
    ]);
    const result = repaginateDocument(doc, PRIMARY_STORY_ID);
    expect(result.paragraphPageMap).toEqual([0]);
    expect(result.requiredPages).toBe(1);
  });

  it('treats a column break as a page advance in the single-column model', () => {
    const doc = docWithParagraphs([paraWithBreak('کالم اول', 'column', 'کالم دوم')]);
    const result = repaginateDocument(doc, PRIMARY_STORY_ID);
    expect(result.paragraphPageMap).toEqual([0, 1]);
    expect(result.requiredPages).toBe(2);
  });

  it('a trailing page break opens a fresh (empty) page, losing nothing', () => {
    const doc = docWithParagraphs([
      {
        type: 'paragraph',
        direction: 'rtl',
        content: [{ type: 'text', text: 'آخر' }, { type: 'break', breakType: 'page' }],
      },
    ]);
    const result = repaginateDocument(doc, PRIMARY_STORY_ID);
    expect(result.requiredPages).toBe(2);
    expect(result.paragraphPageMap).toEqual([0, 1]);
  });
});

describe('repaginateDocument — pageBreakBefore', () => {
  it('moves a flagged paragraph to the next page', () => {
    const doc = docWithParagraphs([
      shortPara('پہلا'),
      shortPara('دوسرا', { pageBreakBefore: true }),
    ]);
    const result = repaginateDocument(doc, PRIMARY_STORY_ID);
    expect(result.paragraphPageMap).toEqual([0, 1]);
  });

  it('is a no-op on the first paragraph (never manufactures a blank page)', () => {
    const doc = docWithParagraphs([
      shortPara('پہلا', { pageBreakBefore: true }),
      shortPara('دوسرا'),
    ]);
    const result = repaginateDocument(doc, PRIMARY_STORY_ID);
    expect(result.paragraphPageMap).toEqual([0, 0]);
    expect(result.requiredPages).toBe(1);
  });
});

describe('odd/even section breaks — parity blanks', () => {
  it('inserts a section with the requested break type', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const next = insertSectionBreakCommand(doc, p1, 'odd-page');
    expect(next.sections).toHaveLength(2);
    expect(next.sections![1]!.breakType).toBe('odd-page');
    expect(next.pageOrder).toHaveLength(2);
  });

  it('odd-page break after page 1 needs a blank (page 2 would be even)', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const next = insertSectionBreakCommand(doc, p1, 'odd-page');
    const p2 = next.pageOrder[1]!;

    const blanks = computeParityBlanks(next);
    expect(blanks).toHaveLength(1);
    expect(blanks[0]!.beforePageId).toBe(p2);
    expect(blanks[0]!.physicalIndex).toBe(1);
    // The section now starts on physical page 3 (odd), 0-based index 2.
    expect(getPhysicalPageIndex(next, p2)).toBe(2);
    // The blank is a layout artifact only — the model still has 2 pages.
    expect(next.pageOrder).toHaveLength(2);
  });

  it('even-page break after page 1 needs no blank (page 2 is even)', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const next = insertSectionBreakCommand(doc, p1, 'even-page');
    const p2 = next.pageOrder[1]!;

    expect(computeParityBlanks(next)).toHaveLength(0);
    expect(getPhysicalPageIndex(next, p2)).toBe(1);
  });

  it('even-page break after page 2 needs a blank (page 3 would be odd)', () => {
    let doc = createStarterDocument();
    doc = addPage(doc);
    const p2 = doc.pageOrder[1]!;
    const next = insertSectionBreakCommand(doc, p2, 'even-page');
    const p3 = next.pageOrder[2]!;

    const blanks = computeParityBlanks(next);
    expect(blanks).toHaveLength(1);
    expect(blanks[0]!.beforePageId).toBe(p3);
    expect(getPhysicalPageIndex(next, p3)).toBe(3);
  });

  it('odd-page break after page 2 needs no blank (page 3 is odd)', () => {
    let doc = createStarterDocument();
    doc = addPage(doc);
    const p2 = doc.pageOrder[1]!;
    const next = insertSectionBreakCommand(doc, p2, 'odd-page');
    expect(computeParityBlanks(next)).toHaveLength(0);
  });

  it('consecutive odd-page breaks each claim their own blank', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const step1 = insertSectionBreakCommand(doc, p1, 'odd-page');
    const p2 = step1.pageOrder[1]!;
    const step2 = insertSectionBreakCommand(step1, p2, 'odd-page');
    const p3 = step2.pageOrder[2]!;

    const blanks = computeParityBlanks(step2);
    expect(blanks.map((b) => b.beforePageId)).toEqual([p2, p3]);
    expect(getPhysicalPageIndex(step2, p3)).toBe(4); // physical page 5
  });

  it('page numbering counts the blank: section page shows ۳, blank shows ۲', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const next = insertSectionBreakCommand(doc, p1, 'odd-page');
    const p2 = next.pageOrder[1]!;

    // Continuous numbering (restartAtSection defaults to false).
    expect(getSectionPageNumberString(next, p2)).toBe('۳');
    expect(getParityBlankPageNumberString(next, p2)).toBe('۲');
    // No blank precedes page 1.
    expect(getParityBlankPageNumberString(next, p1)).toBe('');
  });
});
