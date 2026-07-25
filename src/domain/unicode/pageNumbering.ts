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
