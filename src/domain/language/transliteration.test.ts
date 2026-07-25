import { describe, expect, it } from 'vitest';
import { romanToUrdu, urduToRoman } from './transliteration';

describe('transliteration', () => {
  it('converts Roman Urdu into standard Urdu Nastaliq text', () => {
    expect(romanToUrdu('shukriya')).toBe('شکریہ');
    expect(romanToUrdu('khush amdeed')).toBe('خوش آمدید');
  });

  it('converts Urdu Nastaliq text into Roman Urdu ASCII', () => {
    const roman = urduToRoman('پاکستان');
    expect(roman.toLowerCase()).toContain('pakistan');
  });
});
