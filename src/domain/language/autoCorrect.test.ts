import { describe, expect, it } from 'vitest';
import {
  ENGLISH_AUTO_CORRECT,
  URDU_AUTO_CORRECT,
  getAutoCorrection,
  isWordDelimiter,
} from './autoCorrect';
import {
  isSpellingCorrect,
  isWordInEnglishDictionary,
} from './urduSpellchecker';
import { addPersonalWord, removePersonalWord } from './personalDictionary';
import { ignoreWordForSession, clearSessionIgnores } from './urduSpellchecker';

describe('auto-correct pair validation (curated map hygiene)', () => {
  it('every English key is a non-word and every value is a dictionary word', () => {
    for (const [key, value] of Object.entries(ENGLISH_AUTO_CORRECT)) {
      expect(isWordInEnglishDictionary(key), `key "${key}" must not be a word`).toBe(false);
      expect(isWordInEnglishDictionary(value), `value "${value}" must be a word`).toBe(true);
      expect(key, 'keys are stored lowercase').toBe(key.toLowerCase());
      expect(value, 'values are stored lowercase').toBe(value.toLowerCase());
      expect(key).not.toBe(value);
    }
  });

  it('every English pair actually fires through getAutoCorrection', () => {
    for (const [key, value] of Object.entries(ENGLISH_AUTO_CORRECT)) {
      expect(getAutoCorrection(key), `pair ${key} -> ${value}`).toBe(value);
    }
  });

  it('every Urdu key is flagged by the checker and every value is accepted', () => {
    for (const [key, value] of Object.entries(URDU_AUTO_CORRECT)) {
      expect(isSpellingCorrect(key), `Urdu key "${key}" must be flagged`).toBe(false);
      expect(isSpellingCorrect(value), `Urdu value "${value}" must be a word`).toBe(true);
      expect(getAutoCorrection(key), `pair ${key} -> ${value}`).toBe(value);
    }
  });

  it('has a substantial English canon and a small, certain Urdu set', () => {
    expect(Object.keys(ENGLISH_AUTO_CORRECT).length).toBe(162);
    expect(Object.keys(URDU_AUTO_CORRECT).length).toBe(15);
  });
});

describe('getAutoCorrection behavior', () => {
  it('preserves capitalization patterns', () => {
    expect(getAutoCorrection('teh')).toBe('the');
    expect(getAutoCorrection('Teh')).toBe('The');
    expect(getAutoCorrection('TEH')).toBe('THE');
    expect(getAutoCorrection('Recieve')).toBe('Receive');
  });

  it('never alters valid words', () => {
    expect(getAutoCorrection('the')).toBeNull();
    expect(getAutoCorrection('receive')).toBeNull();
    expect(getAutoCorrection('حاصل')).toBeNull();
    expect(getAutoCorrection('پاکستان')).toBeNull();
    expect(getAutoCorrection('a')).toBeNull();
    expect(getAutoCorrection('')).toBeNull();
  });

  it('never corrects personal-dictionary words', () => {
    addPersonalWord('teh');
    try {
      expect(getAutoCorrection('teh')).toBeNull();
    } finally {
      removePersonalWord('teh');
    }
  });

  it('never corrects session-ignored words', () => {
    ignoreWordForSession('recieve');
    try {
      expect(getAutoCorrection('recieve')).toBeNull();
    } finally {
      clearSessionIgnores();
    }
  });

  it('never corrects words on the document ignore list', () => {
    expect(getAutoCorrection('teh', { documentIgnoredWords: ['teh'] })).toBeNull();
    expect(getAutoCorrection('حاسل', { documentIgnoredWords: ['حاسل'] })).toBeNull();
    // ...while other typos still correct in the same document.
    expect(getAutoCorrection('teh', { documentIgnoredWords: ['recieve'] })).toBe('the');
  });

  it('delimiter set covers Latin and Urdu punctuation', () => {
    for (const ch of [' ', '.', ',', '!', '?', '،', '۔', '؟', ';', ':']) {
      expect(isWordDelimiter(ch)).toBe(true);
    }
    expect(isWordDelimiter('a')).toBe(false);
    expect(isWordDelimiter('ا')).toBe(false);
    expect(isWordDelimiter('\n')).toBe(false);
  });
});
