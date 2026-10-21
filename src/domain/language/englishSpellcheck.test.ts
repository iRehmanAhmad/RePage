import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkUrduText,
  clearSessionIgnores,
  findMisspelledRanges,
  getSpellingSuggestions,
  ignoreWordForSession,
  isLatinWord,
  isSpellingCorrect,
  isWordInEnglishDictionary,
  notePersonalDictionaryChanged,
} from './urduSpellchecker';
import { ENGLISH_COMMON_WORDS, ENGLISH_WORDLIST, ENGLISH_WORDLIST_SIZE } from './englishWordlist.generated';
import { addPersonalWord } from './personalDictionary';

describe('english wordlist (vendored)', () => {
  it('loads a large, clean, sorted set of lowercase lookup keys', () => {
    expect(ENGLISH_WORDLIST_SIZE).toBeGreaterThan(100000);
    expect(ENGLISH_WORDLIST.length).toBe(ENGLISH_WORDLIST_SIZE);
    expect(ENGLISH_WORDLIST.every((w) => /^[a-z]{2,}$/.test(w))).toBe(true);
    expect(ENGLISH_WORDLIST.every((w, i, a) => i === 0 || a[i - 1]! < w)).toBe(true);
  });

  it('contains common English words (spot check)', () => {
    for (const w of ['the', 'house', 'computer', 'school', 'teacher', 'because', 'people', 'environment']) {
      expect(isWordInEnglishDictionary(w)).toBe(true);
    }
    // Case-insensitive: lookup lowercases a copy of the token.
    expect(isWordInEnglishDictionary('House')).toBe(true);
    expect(isWordInEnglishDictionary('COMPUTER')).toBe(true);
  });

  it('excludes the known typos that leaked into the upstream frequency list', () => {
    // These strings are in tesseract-ocr/langdata eng.wordlist but are
    // misspellings, not words; scripts/build-english-wordlist.mjs drops them.
    for (const typo of ['teh', 'recieve', 'seperate', 'occured', 'goverment']) {
      expect(ENGLISH_WORDLIST.includes(typo)).toBe(false);
      expect(isWordInEnglishDictionary(typo)).toBe(false);
    }
  });

  it('carries a frequency-ordered common head for suggestion ranking', () => {
    expect(ENGLISH_COMMON_WORDS.length).toBe(5000);
    expect(ENGLISH_COMMON_WORDS[0]).toBe('the');
    expect(ENGLISH_COMMON_WORDS.every((w) => ENGLISH_WORDLIST.includes(w))).toBe(true);
  });
});

describe('english tokenizer (spellcheck)', () => {
  beforeEach(() => {
    clearSessionIgnores();
    notePersonalDictionaryChanged();
  });

  it('flags an English typo with correct offsets', () => {
    const text = 'This is teh house';
    const ranges = findMisspelledRanges(text);
    expect(ranges.map((r) => r.word)).toEqual(['teh']);
    expect(text.slice(ranges[0]!.start, ranges[0]!.end)).toBe('teh');
  });

  it('does not flag correct English', () => {
    expect(findMisspelledRanges('The quick brown fox jumps over the lazy dog')).toHaveLength(0);
    expect(findMisspelledRanges('Students are learning English at school today')).toHaveLength(0);
  });

  it('is case-insensitive for Latin tokens', () => {
    expect(isSpellingCorrect('House')).toBe(true);
    expect(isSpellingCorrect('HOUSE')).toBe(true);
    expect(isSpellingCorrect('Teh')).toBe(false);
  });

  it('accepts contractions and possessives', () => {
    expect(findMisspelledRanges("I don't think it's the teacher's fault")).toHaveLength(0);
    expect(isSpellingCorrect("don't")).toBe(true);
    expect(isSpellingCorrect('students’')).toBe(true); // curly apostrophe, plural possessive stem
  });

  it('still skips URLs, emails and single Latin characters', () => {
    expect(findMisspelledRanges('Visit https://example.com or mail user@domain.org')).toHaveLength(0);
    expect(findMisspelledRanges('a I x')).toHaveLength(0);
  });

  it('skips mixed-script tokens conservatively', () => {
    // Latin letters glued to Urdu letters: no dictionary covers the hybrid.
    expect(findMisspelledRanges('یہ testکتاب ہے')).toHaveLength(0);
    expect(isLatinWord('test')).toBe(true);
    expect(isLatinWord('کتاب')).toBe(false);
    expect(isLatinWord('testکتاب')).toBe(false);
  });
});

describe('mixed paragraphs', () => {
  beforeEach(() => {
    clearSessionIgnores();
    notePersonalDictionaryChanged();
  });

  it('flags an Urdu typo and an English typo in one pass', () => {
    const text = 'پاکستان پکستان is a beautiful country and teh students study hard';
    const words = findMisspelledRanges(text).map((r) => r.word);
    expect(words).toContain('پکستان');
    expect(words).toContain('teh');
    expect(words).not.toContain('پاکستان');
    expect(words).not.toContain('beautiful');
  });

  it('keeps Urdu-only behavior identical for pure Urdu text', () => {
    expect(findMisspelledRanges('پاکستان ایک خوبصورت ملک ہے')).toHaveLength(0);
    const errors = checkUrduText('یہ teh غلطی ہے');
    expect(errors.some((e) => e.word === 'teh')).toBe(true);
  });
});

describe('english suggestions', () => {
  it('puts the intended correction first for classic typos', () => {
    expect(getSpellingSuggestions('teh')[0]).toBe('the');
    expect(getSpellingSuggestions('recieve')[0]).toBe('receive');
    expect(getSpellingSuggestions('goverment')[0]).toBe('government');
    expect(getSpellingSuggestions('enviroment')[0]).toBe('environment');
  });

  it('returns no suggestions for correct English words', () => {
    expect(getSpellingSuggestions('house')).toEqual([]);
    expect(getSpellingSuggestions('the')).toEqual([]);
  });
});

describe('english session ignore + personal dictionary', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessionIgnores();
    notePersonalDictionaryChanged();
  });

  it('an ignored English word is not re-flagged', () => {
    expect(findMisspelledRanges('a zqxjumble word').map((r) => r.word)).toContain('zqxjumble');
    ignoreWordForSession('zqxjumble');
    expect(isSpellingCorrect('zqxjumble')).toBe(true);
    expect(findMisspelledRanges('a zqxjumble word')).toHaveLength(0);
    clearSessionIgnores();
    expect(isSpellingCorrect('zqxjumble')).toBe(false);
  });

  it('an English word in the personal dictionary passes', () => {
    const madeUp = 'flibberty';
    expect(isSpellingCorrect(madeUp)).toBe(false);
    addPersonalWord(madeUp);
    notePersonalDictionaryChanged();
    expect(isSpellingCorrect(madeUp)).toBe(true);
    expect(findMisspelledRanges(`the ${madeUp} word`).map((r) => r.word)).not.toContain(madeUp);
  });
});

describe('english performance smoke', () => {
  it('checks a 1,000-word mixed paragraph fast (Set lookups only)', () => {
    const sentence = 'پاکستان خوبصورت ملک ہے the students are happy and learning english at school';
    const paragraph = Array.from({ length: 125 }, () => sentence).join(' ');
    // Warm-up: first call builds the personal-dictionary cache.
    findMisspelledRanges(paragraph);
    const start = performance.now();
    const ranges = findMisspelledRanges(paragraph);
    const elapsed = performance.now() - start;
    expect(ranges).toHaveLength(0);
    expect(elapsed).toBeLessThan(500);
  });

  it('answers an English suggestion query within the context-menu budget', () => {
    const start = performance.now();
    const suggestions = getSpellingSuggestions('enviroment');
    const elapsed = performance.now() - start;
    expect(suggestions[0]).toBe('environment');
    expect(elapsed).toBeLessThan(500);
  });
});
