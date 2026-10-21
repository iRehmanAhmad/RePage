import { describe, expect, it } from 'vitest';
import {
  formatPageNumber,
  getSectionPageNumberString,
  resolvePageNumberTokens,
  toAbjadNumerals,
  toRomanNumerals,
  toUrduLetterSequence,
  toUrduNumerals,
} from './pageNumbering';
import { createStarterDocument } from '../document/createDocument';

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

  it('formats Abjad numerals with the additive system at boundaries', () => {
    expect(toAbjadNumerals(9)).toBe('ط');
    expect(toAbjadNumerals(10)).toBe('ی');
    expect(toAbjadNumerals(11)).toBe('یا');
    expect(toAbjadNumerals(19)).toBe('یط');
    expect(toAbjadNumerals(20)).toBe('ک');
    expect(toAbjadNumerals(25)).toBe('کہ');
    expect(toAbjadNumerals(99)).toBe('صط');
    expect(toAbjadNumerals(100)).toBe('ق');
    expect(toAbjadNumerals(365)).toBe('شسہ');
    expect(toAbjadNumerals(1000)).toBe('غ');
    expect(toAbjadNumerals(2024)).toBe('بغکد');
    // Not cyclic: the old placeholder wrapped every 10 (11 -> ا).
    expect(toAbjadNumerals(12)).toBe('یب');
    expect(toAbjadNumerals(21)).toBe('کا');
  });

  it('formats Roman numerals (lower and upper) at boundaries', () => {
    expect(toRomanNumerals(4)).toBe('iv');
    expect(toRomanNumerals(9)).toBe('ix');
    expect(toRomanNumerals(40)).toBe('xl');
    expect(toRomanNumerals(90)).toBe('xc');
    expect(toRomanNumerals(400)).toBe('cd');
    expect(toRomanNumerals(900)).toBe('cm');
    expect(toRomanNumerals(2024)).toBe('mmxxiv');
    expect(toRomanNumerals(14, true)).toBe('XIV');
    expect(formatPageNumber(0, { style: 'roman' })).toBe('i');
    expect(formatPageNumber(3, { style: 'roman-upper' })).toBe('IV');
  });

  it('formats the Urdu letter sequence with spreadsheet-style composition', () => {
    expect(toUrduLetterSequence(1)).toBe('ا');
    expect(toUrduLetterSequence(2)).toBe('ب');
    expect(toUrduLetterSequence(3)).toBe('پ');
    expect(toUrduLetterSequence(38)).toBe('ے');
    expect(toUrduLetterSequence(39)).toBe('اا');
    expect(toUrduLetterSequence(40)).toBe('اب');
    expect(formatPageNumber(0, { style: 'urdu-letters' })).toBe('ا');
  });

  it('renders the chosen format through section numbering (footer path)', () => {
    const doc = createStarterDocument();
    const section = doc.sections?.[0];
    expect(section).toBeDefined();
    const pageId = doc.pageOrder[0]!;

    const romanDoc = {
      ...doc,
      sections: [
        {
          ...section!,
          pageNumbering: { style: 'roman' as const, startAt: 1, restartAtSection: true, prefix: '', suffix: '' },
        },
      ],
    };
    expect(getSectionPageNumberString(romanDoc, pageId)).toBe('i');

    const abjadDoc = {
      ...doc,
      sections: [
        {
          ...section!,
          pageNumbering: { style: 'abjad' as const, startAt: 11, restartAtSection: true, prefix: '', suffix: '' },
        },
      ],
    };
    expect(getSectionPageNumberString(abjadDoc, pageId)).toBe('یا');
  });

  it('formats totalPages in the same style as the page number', () => {
    const result = resolvePageNumberTokens('{{pageNumber}} / {{totalPages}}', 1, 14, {
      style: 'roman',
    });
    expect(result).toBe('ii / xiv');
  });
});
