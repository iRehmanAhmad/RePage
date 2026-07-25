import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { addBookmarkCommand, addFootnoteCommand, insertTocCommand, removeBookmarkCommand } from './longDocumentCommands';

describe('longDocumentCommands (Phase UX-5)', () => {
  it('adds and removes bookmarks', () => {
    let doc = createStarterDocument();
    doc = addBookmarkCommand(doc, 'فصل اول', 0);
    expect(doc.bookmarks).toBeDefined();

    const bmId = Object.keys(doc.bookmarks!)[0]!;
    expect(doc.bookmarks![bmId]?.name).toBe('فصل اول');

    doc = removeBookmarkCommand(doc, bmId);
    expect(doc.bookmarks![bmId]).toBeUndefined();
  });

  it('adds footnote command to document', () => {
    let doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;

    doc = addFootnoteCommand(doc, pageId, 'حاشیہ: وضاحت متن');
    expect(doc.footnotes).toBeDefined();

    const fnId = Object.keys(doc.footnotes!)[0]!;
    expect(doc.footnotes![fnId]?.text).toBe('حاشیہ: وضاحت متن');
  });

  it('inserts table of contents story command', () => {
    let doc = createStarterDocument();
    doc = insertTocCommand(doc, 'toc-story');

    expect(doc.stories['toc-story']).toBeDefined();
    expect(doc.stories['toc-story']?.content.content.length).toBeGreaterThan(0);
  });
});
