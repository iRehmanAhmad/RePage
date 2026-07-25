import { describe, expect, it } from 'vitest';
import { createStarterDocument } from './createDocument';
import { buildIndexRichTextDocument, generateSubjectIndex } from './indexEngine';

describe('indexEngine (Phase UX-5)', () => {
  it('compiles subject index from document index entries', () => {
    let doc = createStarterDocument();
    doc.indexEntries = [
      { id: 'idx_1', term: 'اردو', pageId: doc.pageOrder[0]!, formattedPageNumber: 'صفحہ ۱' },
      { id: 'idx_2', term: 'ادب', pageId: doc.pageOrder[0]!, formattedPageNumber: 'صفحہ ۱' },
    ];

    const groups = generateSubjectIndex(doc, 'ur');
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]?.entries.length).toBeGreaterThan(0);

    const richText = buildIndexRichTextDocument(groups);
    expect(richText.content.length).toBeGreaterThan(1);
  });
});
