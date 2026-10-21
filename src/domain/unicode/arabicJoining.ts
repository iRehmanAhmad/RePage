/**
 * Arabic-script joining classification, shared by the layout features
 * that need to know where letters connect (kashida justification in
 * domain/layout, circle text segmentation in domain/geometry).
 *
 * A letter "joins forward" when it connects to the FOLLOWING letter.
 * The right-joining-only letters (they connect to the previous letter
 * but never forward) are the well-known set:
 * ا آ أ إ ٱ ؤ د ڈ ذ ر ڑ ز ژ و ة ى ے and their variants.
 * Urdu-specific members (ڈ ڑ ے) follow the same rule as their Arabic
 * bases. ہ (U+06C1), ھ (U+06BE) and ئ (U+0626) are dual-joining — they
 * DO join forward and are deliberately absent from the table. Tatweel
 * (U+0640) joins both ways by design.
 *
 * This module is the single source of truth for that set; do not copy
 * the tables elsewhere.
 */

/** The tatweel / kashida character. */
export const TATWEEL = 'ـ';

/** Zero-width non-joiner: explicitly severs a connection. */
export const ZWNJ = '‌';

/** Zero-width joiner: explicitly requests a connection. */
export const ZWJ = '‍';

const RIGHT_JOINING_RANGES: Array<[number, number]> = [
  [0x0622, 0x0625], // آ أ ؤ إ — madda/hamza alef variants + waw-hamza
  [0x0627, 0x0627], // ا alef (U+0626 ئ is dual-joining — excluded)
  [0x0629, 0x0629], // ة teh marbuta
  [0x062f, 0x0632], // د ذ ر ز — dal/reh group
  [0x0648, 0x0649], // و ى — waw + alef maksura
  [0x0671, 0x0677], // ٱ … ٷ — alef wasla + high-hamza letters (right-joining)
  [0x0688, 0x0699], // ڈ … ڙ — Urdu dal/reh variants
  [0x06c3, 0x06cb], // ڃ … ۋ — yeh/waw variants (right-joining)
  [0x06cd, 0x06cd], // ۍ yeh with tail
  [0x06d2, 0x06d3], // ے ۓ — bari yeh (right-joining)
];

/**
 * True when the code point is a right-joining-only Arabic letter: it
 * joins to the letter BEFORE it but never to the letter AFTER it.
 */
export function isRightJoiningLetter(codePoint: number): boolean {
  for (const [lo, hi] of RIGHT_JOINING_RANGES) {
    if (codePoint >= lo && codePoint <= hi) return true;
  }
  return false;
}

/** True for Arabic-script letters (the blocks Urdu/Arabic text lives in). */
export function isArabicScriptLetter(codePoint: number): boolean {
  return (
    (codePoint >= 0x0620 && codePoint <= 0x064a) ||
    (codePoint >= 0x066e && codePoint <= 0x06d3) ||
    (codePoint >= 0x06fa && codePoint <= 0x06fc) ||
    (codePoint >= 0x0750 && codePoint <= 0x077f) ||
    (codePoint >= 0x08a0 && codePoint <= 0x08ff) ||
    (codePoint >= 0xfb50 && codePoint <= 0xfdff) ||
    (codePoint >= 0xfe70 && codePoint <= 0xfeff)
  );
}

/** Combining marks that ride on a base letter (aerab and friends). */
export function isArabicCombiningMark(codePoint: number): boolean {
  return (
    (codePoint >= 0x064b && codePoint <= 0x065f) ||
    codePoint === 0x0670 ||
    (codePoint >= 0x06d6 && codePoint <= 0x06ed) ||
    (codePoint >= 0x08d3 && codePoint <= 0x08e1)
  );
}

/** Arabic-Indic and extended digits (never valid kashida anchors). */
export function isArabicScriptDigit(codePoint: number): boolean {
  return (
    (codePoint >= 0x0660 && codePoint <= 0x0669) ||
    (codePoint >= 0x06f0 && codePoint <= 0x06f9)
  );
}
