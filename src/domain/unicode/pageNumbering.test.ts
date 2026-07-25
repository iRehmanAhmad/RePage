import { describe, expect, it } from 'vitest';
import {
  formatPageNumber,
  resolvePageNumberTokens,
  toAbjadNumerals,
  toUrduNumerals,
} from './pageNumbering';

describe('pageNumbering (M3.4)', () => {
  it('converts ASCII digits to Urdu numerals correctly', () => {
    expect(toUrduNumerals(0)).toBe('۰');
    expect(toUrduNumerals(1234567890)).toBe('۱۲۳۴۵۶۷۸۹۰');
    expect(toUrduNumerals('Page 42')).toBe('Page ۴۲');
  });

  it('formats Abjad numerals correctly', () => {
    expect(toAbjadNumerals(1)).toBe('ا');
    expect(toAbjadNumerals(2)).toBe('ب');
    expect(toAbjadNumerals(3)).toBe('ج');
  });

  it('formats page numbers with Urdu style, start numbers, and section offsets', () => {
    // 0-indexed page 0 with startNumber=1 -> Page 1 ("۱")
    expect(formatPageNumber(0, { style: 'urdu' })).toBe('۱');

    // Page 9 (0-indexed index 9) -> Page 10 ("۱۰")
    expect(formatPageNumber(9, { style: 'urdu' })).toBe('۱۰');

    // With prefix and suffix
    expect(
      formatPageNumber(4, {
        style: 'urdu',
        prefix: 'صفحہ ',
        suffix: ' (باب ۱)',
      }),
    ).toBe('صفحہ ۵ (باب ۱)');

    // Western style
    expect(formatPageNumber(4, { style: 'western', prefix: 'Page ' })).toBe('Page 5');
  });

  it('resolves {{pageNumber}} and {{totalPages}} tokens in text templates', () => {
    const template = 'صفحہ {{pageNumber}} از {{totalPages}}';
    const result = resolvePageNumberTokens(template, 2, 10, { style: 'urdu' });

    expect(result).toBe('صفحہ ۳ از ۱۰');
  });
});
