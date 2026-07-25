import { describe, expect, it } from 'vitest';
import { checkUrduText, computeEditDistance, getSpellingSuggestions } from './urduSpellchecker';

describe('urduSpellchecker', () => {
  it('computes Damerau-Levenshtein edit distance correctly', () => {
    expect(computeEditDistance('پاکستان', 'پاکستان')).toBe(0);
    expect(computeEditDistance('پاکستان', 'پکستان')).toBe(1);
  });

  it('provides spelling suggestions for misspelled Urdu words', () => {
    const suggestions = getSpellingSuggestions('پکستان');
    expect(suggestions).toContain('پاکستان');
  });

  it('detects spelling errors in Urdu text', () => {
    const errors = checkUrduText('پاکستان اک خوبصورت ملک ہے');
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.word === 'اک')).toBe(true);
  });
});
