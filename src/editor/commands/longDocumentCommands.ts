import { PRIMARY_STORY_ID } from '../../domain/document/createDocument';
import { buildTocRichTextDocument, generateTableOfContents } from '../../domain/document/tocEngine';
import type { Bookmark, FootnoteEntry, RePageDocument } from '../../domain/document/types';

/**
 * Adds a bookmark to a specific paragraph in a document story.
 */
export function addBookmarkCommand(
  doc: RePageDocument,
  name: string,
  paragraphIndex: number,
  storyId = PRIMARY_STORY_ID,
): RePageDocument {
  const bookmarkId = `bm_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const newBookmark: Bookmark = {
    id: bookmarkId,
    name: name.trim() || `Bookmark ${Object.keys(doc.bookmarks || {}).length + 1}`,
    storyId,
    paragraphIndex,
    pageId: doc.pageOrder[0],
  };

  return {
    ...doc,
    bookmarks: {
      ...doc.bookmarks,
      [newBookmark.id]: newBookmark,
    },
  };
}

/**
 * Removes a bookmark by ID.
 */
export function removeBookmarkCommand(doc: RePageDocument, bookmarkId: string): RePageDocument {
  if (!doc.bookmarks || !doc.bookmarks[bookmarkId]) return doc;

  const updatedBookmarks = { ...doc.bookmarks };
  delete updatedBookmarks[bookmarkId];

  return {
    ...doc,
    bookmarks: updatedBookmarks,
  };
}

/**
 * Adds a footnote entry linked to a page.
 */
export function addFootnoteCommand(
  doc: RePageDocument,
  pageId: string,
  text: string,
): RePageDocument {
  const footnotes = doc.footnotes ? { ...doc.footnotes } : {};
  const number = Object.keys(footnotes).length + 1;
  const footnoteId = `fn_${number}`;

  const newFootnote: FootnoteEntry = {
    id: footnoteId,
    number,
    text,
    pageId,
  };

  return {
    ...doc,
    footnotes: {
      ...footnotes,
      [footnoteId]: newFootnote,
    },
  };
}

/**
 * Inserts or updates auto-generated Table of Contents into a story.
 */
export function insertTocCommand(doc: RePageDocument, storyId = 'toc-story'): RePageDocument {
  const tocEntries = generateTableOfContents(doc);
  const tocRichText = buildTocRichTextDocument(tocEntries);

  return {
    ...doc,
    stories: {
      ...doc.stories,
      [storyId]: {
        id: storyId,
        name: 'Table of Contents',
        content: tocRichText,
      },
    },
  };
}
