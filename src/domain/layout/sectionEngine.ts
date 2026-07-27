import { createBlankPage } from '../document/createDocument';
import type { DocumentSection, Page, PageId, RePageDocument, SectionBreakType } from '../document/types';
import { createId } from '../document/ids';

/**
 * Creates a new DocumentSection anchored at startPageId.
 */
export function createDefaultSection(
  startPageId: PageId,
  options?: Partial<DocumentSection>,
): DocumentSection {
  return {
    id: createId('sec'),
    startPageId,
    breakType: options?.breakType ?? 'next-page',
    columns: options?.columns ?? 1,
    columnGap: options?.columnGap ?? 18,
    rtlColumnOrder: options?.rtlColumnOrder ?? true,
    headerStoryId: options?.headerStoryId,
    footerStoryId: options?.footerStoryId,
    pageNumbering: options?.pageNumbering ?? {
      style: 'urdu',
      startAt: 1,
      restartAtSection: false,
      prefix: '',
      suffix: '',
    },
  };
}

/** Legacy factory helper for backward compatibility */
export function createDefaultSectionBreak(type: SectionBreakType = 'next-page'): DocumentSection {
  return createDefaultSection('temp_start', { breakType: type });
}

/**
 * Ensures that the document has a valid, non-empty list of sections.
 * The first section must be anchored at the first page of pageOrder.
 * If sections are missing or dangling, cleans them up or creates a default section.
 */
export function ensureDocumentSections(doc: RePageDocument): RePageDocument {
  if (doc.pageOrder.length === 0) return doc;
  const firstPageId = doc.pageOrder[0]!;

  const existingSections = doc.sections || [];
  const validSections: DocumentSection[] = [];
  const seenPages = new Set<string>();

  for (const sec of existingSections) {
    const startId = sec.startPageId || firstPageId;
    if (doc.pages[startId] && !seenPages.has(startId)) {
      seenPages.add(startId);
      validSections.push({
        ...createDefaultSection(startId),
        ...sec,
        startPageId: startId,
      });
    }
  }

  // Sort sections according to pageOrder
  validSections.sort((a, b) => {
    return doc.pageOrder.indexOf(a.startPageId) - doc.pageOrder.indexOf(b.startPageId);
  });

  // Ensure there is a section for the first page
  if (validSections.length === 0 || validSections[0]!.startPageId !== firstPageId) {
    if (validSections.length > 0 && validSections[0]!.startPageId !== firstPageId) {
      // Re-anchor first section to firstPageId
      validSections[0] = { ...validSections[0]!, startPageId: firstPageId };
    } else {
      validSections.unshift(createDefaultSection(firstPageId));
    }
  }

  return {
    ...doc,
    sections: validSections,
  };
}

/**
 * Cleans up dangling section references if pages were deleted.
 * Ensures the first page remains anchored to a section.
 */
export function cleanupDanglingSections(doc: RePageDocument): RePageDocument {
  return ensureDocumentSections(doc);
}

/**
 * Finds the section governing a specific page ID.
 * Pages inherit section properties from the section whose startPageId is <= page's position in pageOrder.
 */
export function getSectionForPage(doc: RePageDocument, pageId: PageId): DocumentSection {
  const docWithSections = ensureDocumentSections(doc);
  const sections = docWithSections.sections || [];
  const pageIndex = docWithSections.pageOrder.indexOf(pageId);

  if (pageIndex === -1 || sections.length === 0) {
    return createDefaultSection(docWithSections.pageOrder[0] || pageId);
  }

  let matchedSection = sections[0]!;
  for (const sec of sections) {
    const secPageIndex = docWithSections.pageOrder.indexOf(sec.startPageId);
    if (secPageIndex !== -1 && secPageIndex <= pageIndex) {
      matchedSection = sec;
    } else if (secPageIndex > pageIndex) {
      break;
    }
  }

  return matchedSection;
}

/**
 * Gets all page IDs belonging to a given section ID.
 */
export function getPagesForSection(doc: RePageDocument, sectionId: string): PageId[] {
  const docWithSections = ensureDocumentSections(doc);
  const sections = docWithSections.sections || [];
  const secIndex = sections.findIndex((s) => s.id === sectionId);
  if (secIndex === -1) return [];

  const currentSec = sections[secIndex]!;
  const nextSec = sections[secIndex + 1];

  const startIdx = docWithSections.pageOrder.indexOf(currentSec.startPageId);
  const endIdx = nextSec ? docWithSections.pageOrder.indexOf(nextSec.startPageId) : docWithSections.pageOrder.length;

  if (startIdx === -1) return [];

  return docWithSections.pageOrder.slice(startIdx, endIdx);
}

/**
 * Adds a section break to the document, creating a new page and a new DocumentSection anchored at that page.
 */
export function insertSectionBreak(
  doc: RePageDocument,
  type: SectionBreakType = 'next-page',
  targetPageId?: PageId,
): RePageDocument {
  const docWithSections = ensureDocumentSections(doc);
  const sections = docWithSections.sections || [];

  if (type === 'next-page') {
    const newPage = createBlankPage(`Section ${sections.length + 1}`);
    const currentPageIndex = targetPageId ? docWithSections.pageOrder.indexOf(targetPageId) : docWithSections.pageOrder.length - 1;
    const insertIndex = currentPageIndex >= 0 ? currentPageIndex + 1 : docWithSections.pageOrder.length;

    const newPageOrder = [...docWithSections.pageOrder];
    newPageOrder.splice(insertIndex, 0, newPage.id);

    // Inherit section properties from current section
    const currentSection = targetPageId ? getSectionForPage(docWithSections, targetPageId) : sections[sections.length - 1];
    const sectionOptions: Partial<DocumentSection> = {
      breakType: 'next-page',
      columns: currentSection?.columns ?? 1,
      columnGap: currentSection?.columnGap ?? 18,
      rtlColumnOrder: currentSection?.rtlColumnOrder ?? true,
    };
    if (currentSection?.pageNumbering) {
      sectionOptions.pageNumbering = { ...currentSection.pageNumbering };
    }
    const newSection = createDefaultSection(newPage.id, sectionOptions);

    const updatedSections = [...sections, newSection];
    updatedSections.sort((a, b) => newPageOrder.indexOf(a.startPageId) - newPageOrder.indexOf(b.startPageId));

    return {
      ...docWithSections,
      pageOrder: newPageOrder,
      pages: {
        ...docWithSections.pages,
        [newPage.id]: newPage,
      },
      sections: updatedSections,
    };
  }

  // Continuous section break
  const anchorPageId = targetPageId || docWithSections.pageOrder[docWithSections.pageOrder.length - 1]!;
  const currentSec = getSectionForPage(docWithSections, anchorPageId);
  const newSection = createDefaultSection(anchorPageId, {
    breakType: 'continuous',
    columns: currentSec.columns,
    columnGap: currentSec.columnGap,
    rtlColumnOrder: currentSec.rtlColumnOrder,
    pageNumbering: { ...currentSec.pageNumbering },
  });

  return {
    ...docWithSections,
    sections: [...sections, newSection],
  };
}

/**
 * Updates page dimensions and margins on a single page or across a section.
 */
export function applyPageSetup(
  doc: RePageDocument,
  pageId: PageId,
  setup: {
    width?: number;
    height?: number;
    orientation?: 'portrait' | 'landscape';
    margins?: { top: number; right: number; bottom: number; left: number };
    gutter?: number;
    gutterPosition?: 'right' | 'left' | 'top';
    mirrorMargins?: boolean;
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
    gutter: setup.gutter ?? page.gutter,
    gutterPosition: setup.gutterPosition ?? page.gutterPosition,
    mirrorMargins: setup.mirrorMargins ?? page.mirrorMargins,
  };

  return {
    ...doc,
    pages: {
      ...doc.pages,
      [pageId]: updatedPage,
    },
  };
}

