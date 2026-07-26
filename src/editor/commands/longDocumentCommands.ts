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
 * Adds an endnote entry linked to a document page.
 */
export function addEndnoteCommand(
  doc: RePageDocument,
  pageId: string,
  text: string,
): RePageDocument {
  const endnotes = doc.endnotes ? { ...doc.endnotes } : {};
  const number = Object.keys(endnotes).length + 1;
  const endnoteId = `en_${number}`;

  const newEndnote: FootnoteEntry = {
    id: endnoteId,
    number,
    text,
    pageId,
  };

  return {
    ...doc,
    endnotes: {
      ...endnotes,
      [endnoteId]: newEndnote,
    },
  };
}

/**
 * Inserts or updates auto-generated Table of Contents into a story and places a visible text frame object on the target page layout canvas.
 */
export function insertTocCommand(doc: RePageDocument, targetPageId?: string, storyId = 'toc-story'): RePageDocument {
  const tocEntries = generateTableOfContents(doc);
  const tocRichText = buildTocRichTextDocument(tocEntries);
  const pageId = targetPageId || doc.pageOrder[0] || 'page-1';
  const page = doc.pages[pageId];

  const updatedStories = {
    ...doc.stories,
    [storyId]: {
      id: storyId,
      name: 'Table of Contents',
      content: tocRichText,
    },
  };

  let updatedDoc: RePageDocument = {
    ...doc,
    stories: updatedStories,
  };

  if (page) {
    const existingTocObjId = page.objectOrder.find((objId) => {
      const obj = doc.objects[objId];
      return obj && obj.type === 'text-frame' && obj.storyId === storyId;
    });

    if (!existingTocObjId) {
      const tocObjId = `toc_frame_${Date.now()}`;
      const tocFrame: import('../../domain/document/types').TextFrameObject = {
        id: tocObjId,
        pageId,
        name: 'فہرست عنوانات (Table of Contents)',
        type: 'text-frame',
        storyId,
        fontFamily: 'Noto Nastaliq Urdu',
        fontSize: 14,
        color: '#0f172a',
        lineHeight: 1.8,
        padding: { top: 8, right: 8, bottom: 8, left: 8 },
        locked: false,
        hidden: false,
        opacity: 1,
        frame: {
          x: page.margins.left,
          y: page.margins.top + 20,
          width: page.width - page.margins.left - page.margins.right,
          height: 180,
          rotation: 0,
        },
      };

      updatedDoc = {
        ...updatedDoc,
        objects: {
          ...updatedDoc.objects,
          [tocObjId]: tocFrame,
        },
        pages: {
          ...updatedDoc.pages,
          [pageId]: {
            ...page,
            objectOrder: [...page.objectOrder, tocObjId],
          },
        },
      };
    }
  }

  return updatedDoc;
}
