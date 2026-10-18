import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import { paragraph, type ParagraphNode } from '../rich-text/types';
import {
  getPrintableHeight,
  getPrintableWidth,
  renderPageNumberToken,
  repaginateDocument,
} from './paginationEngine';

describe('paginationEngine (Phase UX-3)', () => {
  it('calculates printable height and width taking margins into account', () => {
    const doc = createStarterDocument();
    const page = doc.pages[doc.pageOrder[0]!]!;
    const printableH = getPrintableHeight(page);
    const printableW = getPrintableWidth(page);

    expect(printableH).toBeGreaterThan(0);
    expect(printableW).toBeGreaterThan(0);
    expect(printableH).toBeLessThan(page.height);
  });

  it('repaginates document and creates additional pages when story text expands', () => {
    const doc = createStarterDocument();
    const primaryStory = doc.stories['primary-body-story']!;

    // Create 40 long paragraphs to force multiple pages
    const longParagraphs = Array.from({ length: 40 }, (_, i) =>
      paragraph(`یہ ایک طویل اردو پیراگراف نمبر ${i + 1} ہے جس سے صفحہ کی حد سے آگے متن بڑھ جائے گا۔ `.repeat(4), 'rtl'),
    );

    const longDoc = {
      ...doc,
      stories: {
        ...doc.stories,
        'primary-body-story': {
          ...primaryStory,
          content: { type: 'doc', content: longParagraphs },
        },
      },
    };

    const result = repaginateDocument(longDoc as any);
    expect(result.requiredPages).toBeGreaterThan(1);
    expect(result.repaginatedDoc.pageOrder.length).toBe(result.requiredPages);
  });

  it('flows one very long pasted paragraph across every needed page without losing marks or Urdu controls', () => {
    const doc = createStarterDocument();
    const primaryStory = doc.stories['primary-body-story']!;
    const pastedText = `${'لفظ\u200cبہ\n'.repeat(420)}اختتام`;
    const pastedParagraph: ParagraphNode = {
      ...paragraph('', 'rtl'),
      content: [
        { type: 'text', text: pastedText, marks: [{ type: 'bold' }] },
      ],
    };
    const longDoc = {
      ...doc,
      stories: {
        ...doc.stories,
        'primary-body-story': {
          ...primaryStory,
          content: { type: 'doc' as const, content: [pastedParagraph] },
        },
      },
    };

    const result = repaginateDocument(longDoc);
    const pageFragments = result.repaginatedDoc.stories['primary-body-story']!.content.content;
    const reassembledText = pageFragments
      .flatMap((item) => item.content)
      .map((item) => (item.type === 'text' ? item.text : '\n'))
      .join('');

    expect(result.requiredPages).toBeGreaterThan(2);
    expect(reassembledText).toBe(pastedText);
    expect(pageFragments.every((item) => item.content.every(
      (inline) => inline.type !== 'text' || inline.marks?.some((mark) => mark.type === 'bold'),
    ))).toBe(true);
  });

  it('formats page numbers in Urdu and Western numerals', () => {
    const urduToken = renderPageNumberToken(0, 5, 'ur-PK');
    expect(urduToken).toContain('صفحہ');
    expect(urduToken).toContain('از');

    const enToken = renderPageNumberToken(0, 5, 'en');
    expect(enToken).toBe('Page 1 of 5');
  });
});
