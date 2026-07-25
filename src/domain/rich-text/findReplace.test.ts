import { describe, expect, it } from 'vitest';
import { findInUrduText, replaceInUrduText, stripAerab } from './findReplace';

describe('Urdu Find & Replace Engine', () => {
  it('strips Aerab diacritics correctly', () => {
    const textWithAerab = 'اُردُو صَفَحَہ — إِعْرَاب';
    expect(stripAerab(textWithAerab)).toBe('اردو صفحہ — إعراب');
  });

  it('finds Urdu phrase occurrences', () => {
    const text = 'اردو پیج — جدید ڈیسک ٹاپ پبلشنگ اردو سافٹ ویئر';
    const matches = findInUrduText(text, 'اردو');
    expect(matches).toHaveLength(2);
    expect(matches[0]?.index).toBe(0);
  });

  it('replaces Urdu text occurrences', () => {
    const text = 'اردو پیج — ری پیج';
    const replaced = replaceInUrduText(text, 'اردو پیج', 'RePage Urdu');
    expect(replaced).toBe('RePage Urdu — ری پیج');
  });
});
