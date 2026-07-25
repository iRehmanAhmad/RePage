import { describe, expect, it } from 'vitest';
import {
  convertEndnotesToFootnotes,
  convertFootnotesToEndnotes,
  getDocumentNotes,
  getFootnoteSeparatorStyle,
  insertEndnote,
  insertFootnote,
  updateFootnoteSeparatorStyle,
} from './notesEngine';

describe('notesEngine', () => {
  it('inserts footnotes and endnotes with numbering and symbols', () => {
    const docId = 'doc-notes-test-1';
    const fn1 = insertFootnote(docId, 'story-1', 'یہ پہلی ذیلی تحریر (Footnote) ہے');
    const en1 = insertEndnote(docId, 'story-1', 'یہ پہلا حاشیہ (Endnote) ہے', '*');

    const notes = getDocumentNotes(docId);
    expect(notes.length).toBe(2);
    expect(fn1.type).toBe('footnote');
    expect(fn1.number).toBe(1);
    expect(en1.type).toBe('endnote');
    expect(en1.symbol).toBe('*');
  });

  it('updates footnote separator line width, length, and alignment', () => {
    const docId = 'doc-notes-test-2';
    const updated = updateFootnoteSeparatorStyle(docId, {
      lineWidthPt: 2,
      lineLengthPercent: 50,
      alignment: 'center',
    });

    expect(updated.lineWidthPt).toBe(2);
    expect(updated.lineLengthPercent).toBe(50);
    expect(updated.alignment).toBe('center');

    const retrieved = getFootnoteSeparatorStyle(docId);
    expect(retrieved.lineWidthPt).toBe(2);
  });

  it('converts footnotes to endnotes and vice versa bi-directionally', () => {
    const docId = 'doc-notes-test-3';
    insertFootnote(docId, 'story-1', 'ذیل 1');
    insertFootnote(docId, 'story-1', 'ذیل 2');

    // Convert Footnotes -> Endnotes
    const fnToEn = convertFootnotesToEndnotes(docId);
    expect(fnToEn.convertedCount).toBe(2);
    expect(getDocumentNotes(docId).every((n) => n.type === 'endnote')).toBe(true);

    // Convert Endnotes -> Footnotes
    const enToFn = convertEndnotesToFootnotes(docId);
    expect(enToFn.convertedCount).toBe(2);
    expect(getDocumentNotes(docId).every((n) => n.type === 'footnote')).toBe(true);
  });
});
