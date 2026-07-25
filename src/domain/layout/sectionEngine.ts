import { createBlankPage } from '../document/createDocument';
import type { Page, PageId, RePageDocument, SectionBreak, SectionBreakType } from '../document/types';

export function createDefaultSectionBreak(type: SectionBreakType = 'next-page'): SectionBreak {
  return {
    id: `section_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    orientation: 'portrait',
    columns: 1,
    columnGap: 18,
  };
}

/**
 * Adds a section break to the document, optionally creating a new page if type is 'next-page'.
 */
export function insertSectionBreak(
  doc: RePageDocument,
  type: SectionBreakType = 'next-page',
  targetPageId?: PageId,
): RePageDocument {
  const sections = doc.sections || [];
  const newSection = createDefaultSectionBreak(type);

  if (type === 'next-page') {
    const newPage = createBlankPage(`Section ${sections.length + 2}`);
    const currentPageIndex = targetPageId ? doc.pageOrder.indexOf(targetPageId) : doc.pageOrder.length - 1;
    const insertIndex = currentPageIndex >= 0 ? currentPageIndex + 1 : doc.pageOrder.length;

    const newPageOrder = [...doc.pageOrder];
    newPageOrder.splice(insertIndex, 0, newPage.id);

    return {
      ...doc,
      pageOrder: newPageOrder,
      pages: {
        ...doc.pages,
        [newPage.id]: newPage,
      },
      sections: [...sections, newSection],
    };
  }

  return {
    ...doc,
    sections: [...sections, newSection],
  };
}

/**
 * Updates page dimensions and margins based on section setup or global ribbon page setup commands.
 */
export function applyPageSetup(
  doc: RePageDocument,
  pageId: PageId,
  setup: {
    width?: number;
    height?: number;
    orientation?: 'portrait' | 'landscape';
    margins?: { top: number; right: number; bottom: number; left: number };
  },
): RePageDocument {
  const page = doc.pages[pageId];
  if (!page) return doc;

  let width = setup.width ?? page.width;
  let height = setup.height ?? page.height;

  if (setup.orientation === 'landscape' && width < height) {
    [width, height] = [height, width];
  } else if (setup.orientation === 'portrait' && width > height) {
    [width, height] = [height, width];
  }

  const updatedPage: Page = {
    ...page,
    width,
    height,
    margins: setup.margins ? { ...setup.margins } : page.margins,
  };

  return {
    ...doc,
    pages: {
      ...doc.pages,
      [pageId]: updatedPage,
    },
  };
}
