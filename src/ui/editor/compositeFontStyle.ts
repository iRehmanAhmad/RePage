/**
 * Composite Font Style Manager
 *
 * Manages a dynamic <style> element that uses CSS @font-face with
 * unicode-range to automatically render Latin characters in a paired
 * Latin font and Arabic-script characters in the active Urdu font.
 *
 * This is the CSS-only approach to smart font pairing — zero overhead
 * at edit time, no document model mutations. The browser handles all
 * font switching automatically based on the character's Unicode code point.
 */

const STYLE_ELEMENT_ID = 'repage-composite-font';

/**
 * Unicode ranges for Arabic script (Urdu, Arabic, Persian, etc.)
 * Covers: Arabic, Arabic Supplement, Arabic Extended-A,
 *         Arabic Presentation Forms-A & B, Tatweel, Eastern Arabic-Indic digits.
 */
const ARABIC_UNICODE_RANGE =
  'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF';

/**
 * Unicode ranges for Latin script + Western digits + common punctuation.
 * Covers: Basic Latin, Latin-1 Supplement, Latin Extended-A & B,
 *         Latin Extended Additional, General Punctuation.
 */
const LATIN_UNICODE_RANGE =
  'U+0000-024F, U+1E00-1EFF, U+2000-206F, U+20A0-20CF, U+2100-214F';

/**
 * The composite font family name used in editor styles.
 * This single font-family automatically serves different physical fonts
 * for different Unicode ranges.
 */
export const COMPOSITE_FONT_FAMILY = 'RePage-Composite';

/**
 * Creates or updates the <style> element with @font-face rules
 * for smart font pairing.
 *
 * @param urduFont  - The Urdu/Arabic font family name (e.g. 'Noto Nastaliq Urdu')
 * @param latinFont - The Latin/English font family name (e.g. 'Calibri')
 */
import { getFontFamilyCss } from '../../domain/unicode/fontRegistry';

export function updateCompositeFontRules(urduFont: string, latinFont: string): void {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ELEMENT_ID;
    document.head.appendChild(styleEl);
  }

  const urduCss = getFontFamilyCss(urduFont);
  const urduNames = urduCss
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter((s) => s && s !== 'serif' && s !== 'sans-serif' && s !== 'cursive');

  const urduSrcList = [
    ...urduNames.map((name) => `local('${name}')`),
    `local('Noto Nastaliq Urdu')`,
  ].join(', ');

  const latinSrcList = `local('${latinFont}'), local('Calibri'), local('Arial')`;

  styleEl.textContent = `
@font-face {
  font-family: '${COMPOSITE_FONT_FAMILY}';
  src: ${urduSrcList};
  unicode-range: ${ARABIC_UNICODE_RANGE};
}
@font-face {
  font-family: '${COMPOSITE_FONT_FAMILY}';
  src: ${latinSrcList};
  unicode-range: ${LATIN_UNICODE_RANGE};
}
`;
}

/**
 * Removes the composite font <style> element from the document head.
 * Call on editor unmount to clean up.
 */
export function removeCompositeFontRules(): void {
  if (typeof document === 'undefined') return;
  const styleEl = document.getElementById(STYLE_ELEMENT_ID);
  if (styleEl) {
    styleEl.remove();
  }
}
