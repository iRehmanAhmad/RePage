import { createBlankPage } from '../document/createDocument';
import type { Page, RePageDocument } from '../document/types';
import { extractPlainText } from '../rich-text/types';
import { formatPageNumber } from '../unicode/pageNumbering';

export interface PaginationResult {
  requiredPages: number;
  paragraphPageMap: number[];
  repaginatedDoc: RePageDocument;
}

/**
 * Calculates printable height for a given page taking margins into account.
 */
export function getPrintableHeight(page: Page): number {
  return Math.max(100, page.height - page.margins.top - page.margins.bottom);
}

/**
 * Calculates printable width for a given page taking margins into account.
 */
export function getPrintableWidth(page: Page): number {
  return Math.max(100, page.width - page.margins.left - page.margins.right);
}

/**
 * Calculates required pages and repaginates document by adding or removing pages as necessary.
 */
export function repaginateDocument(
  doc: RePageDocument,
  primaryStoryId = 'primary-body-story',
): PaginationResult {
  const story = doc.stories[primaryStoryId];
  if (!story || !story.content || !story.content.content) {
    return {
      requiredPages: doc.pageOrder.length,
      paragraphPageMap: [],
      repaginatedDoc: doc,
    };
  }

  const firstPage = doc.pages[doc.pageOrder[0]!] || createBlankPage();
  const printableHeight = getPrintableHeight(firstPage);
  const printableWidth = getPrintableWidth(firstPage);

  // Estimate line height and chars per line (approx 40 chars per line at 20px font)
  const charsPerLine = Math.max(15, Math.floor(printableWidth / 12));
  const lineHeightPx = 36; // Approx line height for Urdu Nastaliq

  let currentY = 0;
  let pageIndex = 0;
  const paragraphPageMap: number[] = [];

  for (const para of story.content.content) {
    const text = extractPlainText({ type: 'doc', content: [para] });
    const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
    const paraHeight = lines * lineHeightPx + 16; // 16px paragraph spacing

    if (currentY + paraHeight > printableHeight && currentY > 0) {
      pageIndex++;
      currentY = paraHeight;
    } else {
      currentY += paraHeight;
    }
    paragraphPageMap.push(pageIndex);
  }

  const requiredPages = Math.max(1, pageIndex + 1);
  let updatedPageOrder = [...doc.pageOrder];
  const updatedPages = { ...doc.pages };

  // Add pages if required > existing
  while (updatedPageOrder.length < requiredPages) {
    const newPage = createBlankPage(`Page ${updatedPageOrder.length + 1}`);
    updatedPageOrder.push(newPage.id);
    updatedPages[newPage.id] = newPage;
  }

  // Remove trailing pages if required < existing (never remove first page)
  while (updatedPageOrder.length > requiredPages && updatedPageOrder.length > 1) {
    const removedPageId = updatedPageOrder.pop()!;
    delete updatedPages[removedPageId];
  }

  const repaginatedDoc: RePageDocument = {
    ...doc,
    pageOrder: updatedPageOrder,
    pages: updatedPages,
  };

  return {
    requiredPages,
    paragraphPageMap,
    repaginatedDoc,
  };
}

/**
 * Resolves page number string for headers/footers in Urdu or Western format.
 */
export function renderPageNumberToken(
  pageIndex: number,
  totalPages: number,
  locale: 'ur-PK' | 'en' = 'ur-PK',
): string {
  if (locale === 'ur-PK') {
    const pageNumUrdu = formatPageNumber(pageIndex + 1, { style: 'urdu' });
    const totalUrdu = formatPageNumber(totalPages, { style: 'urdu' });
    return `صفحہ ${pageNumUrdu} از ${totalUrdu}`;
  }
  return `Page ${pageIndex + 1} of ${totalPages}`;
}
