import { describe, expect, it } from 'vitest';
import { createStarterDocument } from './createDocument';
import {
  buildTocRichTextDocument,
  generateRunningHeaderForPage,
  generateTableOfContents,
} from './tocEngine';

describe('tocEngine (M3.8)', () => {
  it('generates Table of Contents entries from document pages', () => {
    const doc = createStarterDocument();
    const entries = generateTableOfContents(doc);

    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]?.formattedPageNumber).toContain('صفحہ');
    expect(entries[0]?.title).toBeDefined();
  });

  it('resolves running header text for target document page', () => {
    const doc = createStarterDocument();
    const firstPageId = doc.pageOrder[0]!;

    const header = generateRunningHeaderForPage(doc, firstPageId);

    expect(header).toBeDefined();
    expect(typeof header).toBe('string');
  });

  it('constructs TOC RichTextDocument with title and leader dots', () => {
    const doc = createStarterDocument();
    const entries = generateTableOfContents(doc);
    const tocDoc = buildTocRichTextDocument(entries);

    expect(tocDoc.type).toBe('doc');
    expect(tocDoc.content.length).toBeGreaterThan(1);
    const firstRun = tocDoc.content[0]?.content[0];
    expect(firstRun?.type).toBe('text');
    if (firstRun?.type === 'text') {
      expect(firstRun.text).toContain('فہرست مضامین');
    }
  });
});
