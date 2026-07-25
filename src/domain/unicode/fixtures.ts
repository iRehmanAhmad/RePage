/**
 /**
 * Verified Urdu & Bidirectional Unicode Fixtures.
 *
 * Ensures proper handling of Nastalique typography, joining control characters (ZWNJ, ZWJ),
 * bidi control characters (RLM, LRM), diacritics (Aerab), and mixed RTL/LTR content.
 */

export interface UnicodeFixture {
  id: string;
  name: string;
  text: string;
  description: string;
}

export const URDU_UNICODE_FIXTURES: Record<string, UnicodeFixture> = {
  standardNastalique: {
    id: 'standardNastalique',
    name: 'Standard Urdu Nastalique',
    text: 'اردو پیج — جدید ڈیسک ٹاپ پبلشنگ سافٹ ویئر',
    description: 'Standard Urdu headline text with dashes and spaces.',
  },
  joiningControls: {
    id: 'joiningControls',
    name: 'Zero-Width Joiner & Non-Joiner (ZWNJ / ZWJ)',
    text: 'بے\u200Cلگام با\u200Cوقار \u200Cکرنے',
    description: 'Compound Urdu words requiring ZWNJ (U+200C) for correct ligatures.',
  },
  bidiControls: {
    id: 'bidiControls',
    name: 'Mixed Direction & Bidi Marks (RLM / LRM)',
    text: 'ورژن \u200E0.1.0\u200F - RePage Foundation',
    description: 'Mixed Urdu and Latin content with directional formatting marks.',
  },
  aerabDiacritics: {
    id: 'aerabDiacritics',
    name: 'Urdu Aerab & Combining Diacritics',
    text: 'اُردُو صَفَحَہ — إِعْرَاب',
    description: 'Urdu vowels and diacritic marks (Pesh, Zair, Zabar).',
  },
  numerals: {
    id: 'numerals',
    name: 'Eastern & Western Digits',
    text: 'صفحہ نمبر ۱۲۳۴۵ (12345)',
    description: 'Eastern Arabic-Indic digits paired with Western Arabic digits.',
  },
};

/**
 * Validates that a string does not contain replacement characters or byte order marks.
 */
export function isValidUrduString(input: string): boolean {
  if (typeof input !== 'string') return false;
  if (input.includes('\uFFFD')) return false; // Replacement character U+FFFD
  if (input.startsWith('\uFEFF')) return false; // Byte order mark U+FEFF
  return true;
}
