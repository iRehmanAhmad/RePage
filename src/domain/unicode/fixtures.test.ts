import { describe, expect, it } from 'vitest';
import {
  URDU_UNICODE_FIXTURES,
  isValidUrduString,
  validateBidiFixtureContent,
} from './fixtures';

describe('URDU_UNICODE_FIXTURES & Bidi QA', () => {
  it('contains all required M2.4 typography and bidi fixtures', () => {
    const keys = Object.keys(URDU_UNICODE_FIXTURES);
    expect(keys).toContain('standardNastalique');
    expect(keys).toContain('joiningControls');
    expect(keys).toContain('bidiControls');
    expect(keys).toContain('mixedEnglish');
    expect(keys).toContain('phoneNumbers');
    expect(keys).toContain('datesAndUrls');
    expect(keys).toContain('emailAddresses');
    expect(keys).toContain('parenthesesAndQuotes');
    expect(keys).toContain('arabicPersianVariants');
    expect(keys).toContain('directionalIsolates');
    expect(keys).toContain('honorifics');
  });

  it('validates UTF-8 validity for all 13 fixtures', () => {
    for (const fixture of Object.values(URDU_UNICODE_FIXTURES)) {
      expect(isValidUrduString(fixture.text)).toBe(true);
    }
  });

  it('preserves code points and bidi control characters across JSON round-trips', () => {
    for (const fixture of Object.values(URDU_UNICODE_FIXTURES)) {
      expect(validateBidiFixtureContent(fixture.text)).toBe(true);
    }
  });

  it('rejects strings containing replacement characters or BOMs', () => {
    expect(isValidUrduString('خطا \uFFFD مکرم')).toBe(false);
    expect(isValidUrduString('\uFEFFمتن')).toBe(false);
  });
});
