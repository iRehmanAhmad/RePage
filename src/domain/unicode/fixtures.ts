/**
 * Verified Urdu & Bidirectional Unicode Fixtures.
 *
 * Ensures proper handling of Nastalique typography, joining control characters (ZWNJ, ZWJ),
 * bidi control characters (RLM, LRM), diacritics (Aerab), mixed RTL/LTR content, URLs,
 * email addresses, phone numbers, dates, parentheses, and honorifics.
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
  mixedEnglish: {
    id: 'mixedEnglish',
    name: 'Urdu Paragraph with English Phrases',
    text: 'یہ RePage 0.1.0-foundation سافٹ ویئر کا جدید ترین نسخہ ہے۔',
    description: 'Urdu sentence incorporating embedded English words and version numbers.',
  },
  phoneNumbers: {
    id: 'phoneNumbers',
    name: 'Phone Numbers in RTL Context',
    text: 'رابطہ نمبر: +92-300-1234567 (دفتر)',
    description: 'International phone numbers with country codes inside RTL text.',
  },
  datesAndUrls: {
    id: 'datesAndUrls',
    name: 'Dates & Web URLs',
    text: 'تاریخ: 25 جولائی 2026ء — ویب سائٹ: https://repage.org/download',
    description: 'Urdu date formats paired with standard LTR web URLs.',
  },
  emailAddresses: {
    id: 'emailAddresses',
    name: 'Email Addresses in Urdu Text',
    text: 'برائے رابطہ ای میل کریں: support@repage.org شکریہ',
    description: 'LTR email addresses embedded within Urdu sentence flow.',
  },
  parenthesesAndQuotes: {
    id: 'parenthesesAndQuotes',
    name: 'Parentheses, Brackets & Quotation Marks',
    text: '«ری پیج» (Urdu DTP Software) [نسخہ 1.0]',
    description: 'Paired brackets, parentheses, and Guillemets in mixed bidi text.',
  },
  arabicPersianVariants: {
    id: 'arabicPersianVariants',
    name: 'Arabic & Persian Character Variants',
    text: 'کاف فارسی ک/ك و یائے فارسی ی/ي',
    description: 'Keheh, Swash Kaf, Farsi Yeh, and Yeh Barree variations.',
  },
  directionalIsolates: {
    id: 'directionalIsolates',
    name: 'Directional Isolates (FSI / PDI)',
    text: '\u2067RePage\u2069 — \u2066Urdu Publishing\u2069',
    description: 'First Strong Isolate (U+2067) and Pop Directional Isolate (U+2069).',
  },
  honorifics: {
    id: 'honorifics',
    name: 'Urdu Honorifics & Ligatures',
    text: 'نبی کریم ﷺ — صحابہ کرام رضوان اللہ علیہم اجمعین',
    description: 'Urdu religious honorific ligatures (U+FDFA) and phrase marks.',
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

/**
 * Validates code-point integrity across JSON round-trip serialization.
 */
export function validateBidiFixtureContent(input: string): boolean {
  if (!isValidUrduString(input)) return false;
  const jsonStr = JSON.stringify({ text: input });
  const restored = (JSON.parse(jsonStr) as { text: string }).text;
  return restored === input;
}
