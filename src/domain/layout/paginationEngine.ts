import { createBlankPage } from '../document/createDocument';
import type { Page, RePageDocument } from '../document/types';
import type { InlineNode, ParagraphNode } from '../rich-text/types';
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

function findWordBoundaryIndex(text: string, targetIdx: number): number {
  if (targetIdx >= text.length) return text.length;
  let idx = Math.min(targetIdx, text.length - 1);
  while (idx > 0 && text[idx] !== ' ' && text[idx] !== '\n' && text[idx] !== '\t') {
    idx--;
  }
  return idx > 0 ? idx : targetIdx;
}

function getParagraphText(paragraph: ParagraphNode): string {
  return paragraph.content
    .map((node) => (node.type === 'text' ? node.text : '\n'))
    .join('');
}

/**
 * Splits a paragraph without flattening its inline nodes. In particular, marks,
 * hard breaks, joiners, and bidi controls stay byte-for-byte in their original
 * runs. Pagination is a layout concern and must not "clean" Urdu text.
 */
function splitParagraphAtOffset(
  paragraph: ParagraphNode,
  offset: number,
): [ParagraphNode, ParagraphNode] {
  const before: InlineNode[] = [];
  const after: InlineNode[] = [];
  let remainingBefore = offset;

  for (const node of paragraph.content) {
    const nodeLength = node.type === 'text' ? node.text.length : 1;

    if (remainingBefore <= 0) {
      after.push(node);
    } else if (remainingBefore >= nodeLength) {
      before.push(node);
      remainingBefore -= nodeLength;
    } else if (node.type === 'text') {
      before.push({ ...node, text: node.text.slice(0, remainingBefore) });
      after.push({ ...node, text: node.text.slice(remainingBefore) });
      remainingBefore = 0;
    } else {
      // A hard break has a visual width of one character. If it fits in the
      // requested range, retain it on the preceding page.
      before.push(node);
      remainingBefore -= 1;
    }
  }

  return [
    { ...paragraph, content: before },
    { ...paragraph, content: after },
  ];
}

function getSafeSplitOffset(text: string, targetOffset: number): number {
  if (text.length < 2) return 0;

  const boundedTarget = Math.max(1, Math.min(targetOffset, text.length - 1));
  const wordBoundary = findWordBoundaryIndex(text, boundedTarget);

  // A very long Urdu/URL token may not contain a break opportunity. In that
  // case, split at the measured position rather than overflowing the page.
  return wordBoundary > 0 && wordBoundary < text.length ? wordBoundary : boundedTarget;
}

/**
 * Calculates required pages and repaginates document by adding or removing pages as necessary.
 * Dynamically splits paragraphs at line/word boundaries to prevent text overflowing or sliced lines across pages.
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

  // Estimate line height and chars per line (approx 42 chars per line at 18pt font)
  const charsPerLine = Math.max(15, Math.floor(printableWidth / 11.5));
  const lineHeightPx = 34; // Approx line height for Urdu Nastaliq

  let currentY = 0;
  let pageIndex = 0;
  const paragraphPageMap: number[] = [];
  const repaginatedParagraphs: any[] = [];

  for (const sourceParagraph of story.content.content) {
    let remainingParagraph = sourceParagraph;

    // A pasted paragraph can be far larger than a page. Keep splitting until
    // its remainder fits; the previous implementation split it only once,
    // which made text overflow from the second page onward.
    while (true) {
      const text = getParagraphText(remainingParagraph);
      const totalLines = Math.max(1, Math.ceil(text.length / charsPerLine));
      const paraHeight = totalLines * lineHeightPx + 14;
      const remainingHeight = printableHeight - currentY;
      const fitsOnCurrentPage = currentY === 0 || currentY + paraHeight <= printableHeight;

      if (fitsOnCurrentPage && paraHeight <= printableHeight) {
        currentY += paraHeight;
        paragraphPageMap.push(pageIndex);
        repaginatedParagraphs.push(remainingParagraph);
        break;
      }

      const availableHeight = currentY === 0 ? printableHeight : remainingHeight;
      const fitLines = Math.floor((availableHeight - 14) / lineHeightPx);
      const splitOffset = getSafeSplitOffset(text, fitLines * charsPerLine);

      if (fitLines >= 1 && splitOffset > 0) {
        const [pagePart, nextPart] = splitParagraphAtOffset(remainingParagraph, splitOffset);
        paragraphPageMap.push(pageIndex);
        repaginatedParagraphs.push(pagePart);
        pageIndex++;
        currentY = 0;
        remainingParagraph = nextPart;
        continue;
      }

      // There is not even one full line left on this page. Start the same
      // paragraph at the top of the next page instead of forcing it to spill.
      pageIndex++;
      currentY = 0;
    }
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
    stories: {
      ...doc.stories,
      [primaryStoryId]: {
        ...story,
        content: {
          ...story.content,
          content: repaginatedParagraphs,
        },
      },
    },
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
