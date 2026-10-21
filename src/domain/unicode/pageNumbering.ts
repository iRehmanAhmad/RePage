import {
  computeParityBlanks,
  getPagesForSection,
  getPhysicalPageIndex,
  getSectionForPage,
} from '../layout/sectionEngine';

export type PageNumberStyle = 'urdu' | 'western' | 'abjad';

export interface PageNumberingOptions {
  style?: PageNumberStyle | undefined;
  startNumber?: number | undefined;
  sectionOffset?: number | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;
}

const URDU_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

const ABJAD_SYMBOLS = ['ا', 'ب', 'ج', 'د', 'ہ', 'و', 'ز', 'ح', 'ط', 'ی'];

/**
 * Converts ASCII digits (0-9) to Urdu / Eastern Arabic digits (۰-۹).
 */
export function toUrduNumerals(num: number | string): string {
  const str = String(num);
  return str.replace(/[0-9]/g, (digit) => URDU_DIGITS[parseInt(digit, 10)] ?? digit);
}

/**
 * Converts integer index to Abjad numeral string (1=ا, 2=ب, etc.).
 */
export function toAbjadNumerals(num: number): string {
  if (num <= 0) return 'ا';
  const index = (num - 1) % ABJAD_SYMBOLS.length;
  return ABJAD_SYMBOLS[index] ?? 'ا';
}

/**
 * Formats a 0-indexed page number into a localized page number string.
 */
export function formatPageNumber(
  pageIndex: number,
  options: PageNumberingOptions = {},
): string {
  const {
    style = 'urdu',
    startNumber = 1,
    sectionOffset = 0,
    prefix = '',
    suffix = '',
  } = options;

  const rawNumber = pageIndex + startNumber + sectionOffset;

  let formattedNumber = '';
  if (style === 'urdu') {
    formattedNumber = toUrduNumerals(rawNumber);
  } else if (style === 'abjad') {
    formattedNumber = toAbjadNumerals(rawNumber);
  } else {
    formattedNumber = String(rawNumber);
  }

  return `${prefix}${formattedNumber}${suffix}`;
}

/**
 * Resolves template tokens in running headers/footers (e.g. "صفحہ {{pageNumber}} از {{totalPages}}").
 */
export function resolvePageNumberTokens(
  template: string,
  pageIndex: number,
  totalPages: number,
  options: PageNumberingOptions = {},
): string {
  const pageNumStr = formatPageNumber(pageIndex, options);
  const totalPagesStr = options.style === 'urdu' ? toUrduNumerals(totalPages) : String(totalPages);

  return template
    .replace(/\{\{\s*pageNumber\s*\}\}/g, pageNumStr)
    .replace(/\{\{\s*totalPages\s*\}\}/g, totalPagesStr);
}

/**
 * Returns localized section-bound page number string for a given page.
 */
export function getSectionPageNumberString(
  doc: import('../document/types').RePageDocument,
  pageId: import('../document/types').PageId,
): string {
  const section = getSectionForPage(doc, pageId);
  const sectionPages = getPagesForSection(doc, section.id);
  const pageIndexInSection = sectionPages.indexOf(pageId);

  const numbering = section.pageNumbering || {
    style: 'urdu',
    startAt: 1,
    restartAtSection: true,
    prefix: '',
    suffix: '',
  };

  const pageIndexToUse = numbering.restartAtSection
    ? Math.max(0, pageIndexInSection)
    : // Continuous numbering counts PHYSICAL pages, so parity blanks
      // inserted by odd/even section breaks consume a number and the
      // pages after them shift accordingly.
      Math.max(0, getPhysicalPageIndex(doc, pageId));

  return formatPageNumber(pageIndexToUse, {
    style: numbering.style,
    startNumber: numbering.startAt,
    prefix: numbering.prefix,
    suffix: numbering.suffix,
  });
}

/**
 * Page-number string for a parity blank page (see
 * sectionEngine.computeParityBlanks), identified by the user page it
 * precedes. The blank carries the PREVIOUS section's headers/footers, so
 * its number is formatted with that section's numbering settings: with
 * restart-at-section it is the number just past the previous section's
 * last page; otherwise it is the blank's physical position. Returns ''
 * when no blank precedes the page.
 */
export function getParityBlankPageNumberString(
  doc: import('../document/types').RePageDocument,
  beforePageId: import('../document/types').PageId,
): string {
  const blank = computeParityBlanks(doc).find((b) => b.beforePageId === beforePageId);
  if (!blank) return '';

  const userIndex = doc.pageOrder.indexOf(beforePageId);
  const prevPageId = userIndex > 0 ? doc.pageOrder[userIndex - 1] : undefined;
  if (!prevPageId) return '';

  const prevSection = getSectionForPage(doc, prevPageId);
  const numbering = prevSection.pageNumbering || {
    style: 'urdu',
    startAt: 1,
    restartAtSection: true,
    prefix: '',
    suffix: '',
  };

  const pageIndexToUse = numbering.restartAtSection
    ? getPagesForSection(doc, prevSection.id).length
    : blank.physicalIndex;

  return formatPageNumber(pageIndexToUse, {
    style: numbering.style,
    startNumber: numbering.startAt,
    prefix: numbering.prefix,
    suffix: numbering.suffix,
  });
}
