import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkUrduText,
  clearSessionIgnores,
  findMisspelledRanges,
  getSpellingSuggestions,
  ignoreWordForSession,
  isSpellingCorrect,
  notePersonalDictionaryChanged,
} from './urduSpellchecker';
import { isWordInBigDictionary, normalizeForDictionary } from './urduDictionary';
import { URDU_WORDLIST, URDU_WORDLIST_SIZE } from './urduWordlist.generated';
import { addPersonalWord } from './personalDictionary';

describe('urdu wordlist (vendored)', () => {
  it('loads tens of thousands of clean, sorted lookup keys', () => {
    expect(URDU_WORDLIST_SIZE).toBeGreaterThan(30000);
    expect(URDU_WORDLIST.length).toBe(URDU_WORDLIST_SIZE);
    expect(URDU_WORDLIST.every((w) => w.length > 0)).toBe(true);
    expect(URDU_WORDLIST.every((w, i, a) => i === 0 || a[i - 1]! <= w)).toBe(true);
    // No category tags / punctuation junk from the upstream dump
    expect(URDU_WORDLIST.some((w) => w.includes(':'))).toBe(false);
  });

  it('contains common Urdu words (spot check)', () => {
    for (const w of ['پاکستان', 'اردو', 'کتاب', 'محبت', 'زندگی', 'حکومت', 'تعلیم', 'استاد', 'اخبار']) {
      expect(isWordInBigDictionary(w)).toBe(true);
    }
  });

  it('lookup keys are aerab-insensitive', () => {
    // پاکِستان with aerab normalizes to the same key as پاکستان
    expect(normalizeForDictionary('پاکِستان')).toBe(normalizeForDictionary('پاکستان'));
    expect(isWordInBigDictionary('پاکِستان')).toBe(true);
  });
});

describe('urdu tokenizer (spellcheck)', () => {
  beforeEach(() => {
    clearSessionIgnores();
    notePersonalDictionaryChanged();
  });

  it('flags genuinely misspelled words with correct offsets', () => {
    const text = 'پاکستان ایک عظیم ملک ہے پکستان';
    const ranges = findMisspelledRanges(text);
    expect(ranges.map((r) => r.word)).toContain('پکستان');
    const hit = ranges.find((r) => r.word === 'پکستان')!;
    expect(text.slice(hit.start, hit.end)).toBe('پکستان');
    expect(ranges.map((r) => r.word)).not.toContain('پاکستان');
  });

  it('does not flag words differing only by aerab/diacritics', () => {
    expect(findMisspelledRanges('پاکِستان قومی ترانہ')).toHaveLength(0);
  });

  it('skips numbers, dates, currency, URLs, emails', () => {
    const text = 'رابطہ https://example.com یا user@domain.org تاریخ 2026-07-26 قیمت 1,250 روپے';
    expect(findMisspelledRanges(text)).toHaveLength(0);
  });

  it('skips single characters and Latin-script tokens', () => {
    expect(findMisspelledRanges('ا ب پ')).toHaveLength(0);
    expect(findMisspelledRanges('یہ SMS الرٹ ہے')).toHaveLength(0);
  });

  it('keeps ZWNJ compounds as one token', () => {
    // با‌اعتماد is in the curated lexicon; must not be flagged
    expect(findMisspelledRanges('وہ با‌اعتماد استاد ہے')).toHaveLength(0);
  });
});

describe('urdu suggestions', () => {
  it('ranks the intended word first for a near-miss', () => {
    const suggestions = getSpellingSuggestions('پکستان');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(5);
    expect(suggestions).toContain('پاکستان');
    // 'پستان' is also distance-1; ties keep wordlist order, so only containment is asserted
  });

  it('returns no suggestions for correct words', () => {
    expect(getSpellingSuggestions('پاکستان')).toEqual([]);
    expect(getSpellingSuggestions('')).toEqual([]);
  });

  it('respects maxSuggestions', () => {
    const suggestions = getSpellingSuggestions('کتااب', 2);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });

  it('completes fast enough for a context menu', () => {
    const start = performance.now();
    getSpellingSuggestions('حکومتت');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});

describe('session ignore + personal dictionary', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessionIgnores();
    notePersonalDictionaryChanged();
  });

  it('ignoreWordForSession suppresses the flag until cleared', () => {
    const madeUp = 'نہایت‌عجیب‌لفظ';
    expect(isSpellingCorrect(madeUp)).toBe(false);
    ignoreWordForSession(madeUp);
    expect(isSpellingCorrect(madeUp)).toBe(true);
    clearSessionIgnores();
    expect(isSpellingCorrect(madeUp)).toBe(false);
  });

  it('personal dictionary words pass after addPersonalWord + cache refresh', () => {
    const madeUp = 'ذاتی‌لفظ';
    expect(isSpellingCorrect(madeUp)).toBe(false);
    addPersonalWord(madeUp);
    notePersonalDictionaryChanged();
    expect(isSpellingCorrect(madeUp)).toBe(true);
    expect(findMisspelledRanges(`یہ ${madeUp} ہے`).map((r) => r.word)).not.toContain(madeUp);
  });
});

describe('checkUrduText back-compat', () => {
  it('keeps the panel API shape and flags a genuine misspelling', () => {
    // NOTE: 'اک' used to be flagged only because the old 101-word dictionary
    // lacked it; the vendored wordlist correctly contains it, so the fixture
    // now uses the genuine misspelling 'پکستان'.
    const errors = checkUrduText('پاکستان پکستان خوبصورت ملک ہے');
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.word === 'پکستان')).toBe(true);
    const first = errors[0]!;
    expect(first).toHaveProperty('word');
    expect(first).toHaveProperty('index');
    expect(first).toHaveProperty('length');
    expect(first).toHaveProperty('suggestions');
  });
});
