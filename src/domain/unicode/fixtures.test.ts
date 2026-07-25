import { describe, expect, it } from 'vitest';
import { URDU_UNICODE_FIXTURES, isValidUrduString } from './fixtures';

describe('Urdu Unicode Fixtures', () => {
  it('contains valid non-empty Unicode test strings', () => {
    for (const key of Object.keys(URDU_UNICODE_FIXTURES)) {
      const fixture = URDU_UNICODE_FIXTURES[key]!;
      expect(fixture.text.length).toBeGreaterThan(0);
      expect(isValidUrduString(fixture.text)).toBe(true);
    }
  });

  it('detects corrupted or invalid replacement characters', () => {
    expect(isValidUrduString('اردو \uFFFD پیج')).toBe(false);
    expect(isValidUrduString('\uFEFFاردو')).toBe(false);
    expect(isValidUrduString('پاک ')).toBe(true);
  });

  it('preserves Zero-Width Non-Joiner (ZWNJ) control characters', () => {
    const fixture = URDU_UNICODE_FIXTURES.joiningControls!;
    expect(fixture.text).toContain('\u200C');
  });

  it('preserves Aerab diacritics', () => {
    const fixture = URDU_UNICODE_FIXTURES.aerabDiacritics!;
    expect(fixture.text).toContain('\u064F'); // Pesh U+064F
  });
});
