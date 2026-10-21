import {
  computeParityBlanks,
  getPagesForSection,
  getPhysicalPageIndex,
  getSectionForPage,
} from '../layout/sectionEngine';

export type PageNumberStyle =
  | 'urdu'
  | 'western'
  | 'abjad'
  | 'roman'
  | 'roman-upper'
  | 'urdu-letters';

export interface PageNumberingOptions {
  style?: PageNumberStyle | undefined;
  startNumber?: number | undefined;
  sectionOffset?: number | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;
}

const URDU_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts ASCII digits (0-9) to Urdu / Eastern Arabic digits (۰-۹).
 */
export function toUrduNumerals(num: number | string): string {
  const str = String(num);
  return str.replace(/[0-9]/g, (digit) => URDU_DIGITS[parseInt(digit, 10)] ?? digit);
}

// ---------------------------------------------------------------------------
// Abjad numerals (حساب الجمل): the traditional additive system used for
// preface pagination in Urdu/Arabic books. Each letter carries a fixed
// value; a number is written largest-first (in logical order) as the sum
// of its letters: 11 = یا (10+1), 25 = کہ (20+5), 365 = شسہ (300+60+5),
// 2024 = بغکد (2000 + 20 + 4, thousands written as coefficient + غ).
// ---------------------------------------------------------------------------
const ABJAD_ONES = ['', 'ا', 'ب', 'ج', 'د', 'ہ', 'و', 'ز', 'ح', 'ط'];
const ABJAD_TENS = ['', 'ی', 'ک', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص'];
const ABJAD_HUNDREDS = ['', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ'];
const ABJAD_THOUSAND = 'غ';

/**
 * Converts a positive integer to an Abjad numeral string using the
 * standard additive system (NOT a positional/cyclic letter list).
 * Values below 1 yield 'ا' (page numbers never go there; this preserves
 * the historic guard). Values ≥ 1,000,000 fall back to western digits —
 * the classical system has no agreed million sign and no real book's
 * pagination reaches it.
 */
export function toAbjadNumerals(num: number): string {
  if (num <= 0) return 'ا';
  if (!Number.isFinite(num) || num >= 1_000_000) return String(Math.floor(num));

  let n = Math.floor(num);
  let out = '';

  const thousands = Math.floor(n / 1000);
  if (thousands > 0) {
    // Coefficient letters for 2..9 thousands reuse the ones table
    // (بغ = 2000); 1000 itself is a bare غ.
    out += (thousands > 1 ? (ABJAD_ONES[thousands] ?? '') : '') + ABJAD_THOUSAND;
    n %= 1000;
  }
  out += ABJAD_HUNDREDS[Math.floor(n / 100)] ?? '';
  out += ABJAD_TENS[Math.floor((n % 100) / 10)] ?? '';
  out += ABJAD_ONES[n % 10] ?? '';
  return out;
}

const ROMAN_TABLE: Array<[number, string]> = [
  [1000, 'm'],
  [900, 'cm'],
  [500, 'd'],
  [400, 'cd'],
  [100, 'c'],
  [90, 'xc'],
  [50, 'l'],
  [40, 'xl'],
  [10, 'x'],
  [9, 'ix'],
  [5, 'v'],
  [4, 'iv'],
  [1, 'i'],
];

/**
 * Converts a positive integer (1–3999) to a Roman numeral, lowercase by
 * default (book-preface convention), uppercase when `upper` is set.
 * Out-of-range values fall back to western digits.
 */
export function toRomanNumerals(num: number, upper = false): string {
  if (!Number.isFinite(num) || num < 1 || num > 3999) return String(Math.floor(num));
  let n = Math.floor(num);
  let out = '';
  for (const [value, glyph] of ROMAN_TABLE) {
    while (n >= value) {
      out += glyph;
      n -= value;
    }
  }
  return upper ? out.toUpperCase() : out;
}

/**
 * The Urdu alphabetical sequence (حروفِ تہجی) used for letter-numbered
 * front matter: ا ب پ ت ٹ ث … ے (38 letters). Composition past the end
 * of the list is spreadsheet-style (bijective base-38): 38 = ے (the last
 * single letter), 39 = اا, 40 = اب — the same convention word
 * processors use for lettered series, applied to the Urdu alphabet.
 */
export const URDU_LETTER_SEQUENCE = [
  'ا', 'ب', 'پ', 'ت', 'ٹ', 'ث', 'ج', 'چ', 'ح', 'خ',
  'د', 'ڈ', 'ذ', 'ر', 'ڑ', 'ز', 'ژ', 'س', 'ش', 'ص',
  'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل',
  'م', 'ن', 'و', 'ہ', 'ھ', 'ء', 'ی', 'ے',
];

/**
 * Converts a positive integer to the Urdu letter sequence:
 * 1=ا, 2=ب, …, 38=ے, 39=اا, 40=اب (bijective composition, see above).
 */
export function toUrduLetterSequence(num: number): string {
  if (!Number.isFinite(num) || num < 1) return 'ا';
  let n = Math.floor(num);
  const base = URDU_LETTER_SEQUENCE.length;
  let out = '';
  while (n > 0) {
    n -= 1;
    out = (URDU_LETTER_SEQUENCE[n % base] ?? 'ا') + out;
    n = Math.floor(n / base);
  }
  return out;
}

/** Formats an already-resolved (1-based) number in the given style. */
export function formatRawPageNumber(style: PageNumberStyle, rawNumber: number): string {
  switch (style) {
    case 'urdu':
      return toUrduNumerals(rawNumber);
    case 'abjad':
      return toAbjadNumerals(rawNumber);
    case 'roman':
      return toRomanNumerals(rawNumber, false);
    case 'roman-upper':
      return toRomanNumerals(rawNumber, true);
    case 'urdu-letters':
      return toUrduLetterSequence(rawNumber);
    case 'western':
    default:
      return String(rawNumber);
  }
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

  return `${prefix}${formatRawPageNumber(style, rawNumber)}${suffix}`;
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
  const totalPagesStr = formatRawPageNumber(options.style ?? 'urdu', totalPages);

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
