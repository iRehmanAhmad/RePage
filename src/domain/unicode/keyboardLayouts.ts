export type KeyboardMode = 'native' | 'crulp' | 'navees' | 'english';

export interface KeyMapEntry {
  normal: string;
  shift: string;
}

// CRULP Phonetic Layout Mapping
export const CRULP_PHONETIC_MAP: Record<string, KeyMapEntry> = {
  a: { normal: 'ا', shift: 'آ' },
  b: { normal: 'ب', shift: '۠' },
  c: { normal: 'چ', shift: 'ث' },
  d: { normal: 'د', shift: 'ڈ' },
  e: { normal: 'ع', shift: 'ۓ' },
  f: { normal: 'ف', shift: 'ڡ' },
  g: { normal: 'گ', shift: 'غ' },
  h: { normal: 'ح', shift: 'ھ' },
  i: { normal: 'ی', shift: 'ٰ' },
  j: { normal: 'ج', shift: 'ض' },
  k: { normal: 'ک', shift: 'خ' },
  l: { normal: 'ل', shift: '؍' },
  m: { normal: 'م', shift: 'ں' },
  n: { normal: 'ن', shift: 'ں' },
  o: { normal: 'ہ', shift: 'ۃ' },
  p: { normal: 'پ', shift: 'ُ' },
  q: { normal: 'ق', shift: 'ْ' },
  r: { normal: 'ر', shift: 'ڑ' },
  s: { normal: 'س', shift: 'ص' },
  t: { normal: 'ت', shift: 'ٹ' },
  u: { normal: 'ء', shift: 'ئ' },
  v: { normal: 'ط', shift: 'ظ' },
  w: { normal: 'و', shift: 'ؤ' },
  x: { normal: 'ش', shift: 'ژ' },
  y: { normal: 'ے', shift: 'َ' },
  z: { normal: 'ز', shift: 'ذ' },
};

// Navees Phonetic Layout Mapping
export const NAVEES_PHONETIC_MAP: Record<string, KeyMapEntry> = {
  ...CRULP_PHONETIC_MAP,
  e: { normal: 'ع', shift: 'ٍ' },
  y: { normal: 'ے', shift: 'ِ' },
  u: { normal: 'ء', shift: 'ُ' },
};

export const SPECIAL_URDU_CHARACTERS = [
  { label: 'ZWNJ', char: '\u200C', description: 'Zero-Width Non-Joiner' },
  { label: 'ZWJ', char: '\u200D', description: 'Zero-Width Joiner' },
  { label: 'RLM', char: '\u200F', description: 'Right-to-Left Mark' },
  { label: 'LRM', char: '\u200E', description: 'Left-to-Right Mark' },
  { label: 'ﷺ', char: '\uFDFA', description: 'Sallallahu Alayhi Wasallam' },
  { label: 'ؒ', char: '\u0612', description: 'Rahmatullah Alayh' },
  { label: 'ؓ', char: '\u0617', description: 'Radi Allahu Anhu' },
];

export function mapKeyToUrduCharacter(
  key: string,
  mode: KeyboardMode,
  isShift: boolean,
): string | null {
  if (mode === 'native' || mode === 'english') {
    return null; // Passes through native OS input
  }

  const lowerKey = key.toLowerCase();
  const layout = mode === 'crulp' ? CRULP_PHONETIC_MAP : NAVEES_PHONETIC_MAP;
  const entry = layout[lowerKey];

  if (!entry) return null;
  return isShift ? entry.shift : entry.normal;
}
