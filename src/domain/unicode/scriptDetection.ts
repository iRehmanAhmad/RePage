/**
 * Script Detection Utility
 *
 * Classifies Unicode characters by script and segments mixed-script text
 * into contiguous runs. Used by the smart font pairing system to determine
 * which characters should render in the Urdu font vs the paired Latin font.
 *
 * Does NOT destructively normalise text — joiners, bidi controls, and
 * combining marks are preserved (per AGENTS.md).
 */

export type ScriptClass = 'arabic' | 'latin' | 'digit' | 'punctuation' | 'whitespace' | 'other';

export interface ScriptSegment {
  text: string;
  script: ScriptClass;
}

/**
 * Classify a single Unicode code point into a script class.
 */
export function classifyChar(codePoint: number): ScriptClass {
  // Whitespace
  if (
    codePoint === 0x0020 || // Space
    codePoint === 0x00a0 || // Non-breaking space
    codePoint === 0x0009 || // Tab
    codePoint === 0x000a || // LF
    codePoint === 0x000d    // CR
  ) {
    return 'whitespace';
  }

  // Bidi control characters — classify as 'other' (invisible, no font needed)
  // Must be checked BEFORE General Punctuation range (U+2000-206F) which would catch them
  if (
    codePoint === 0x200c || // ZWNJ
    codePoint === 0x200d || // ZWJ
    codePoint === 0x200e || // LRM
    codePoint === 0x200f || // RLM
    codePoint === 0x200b || // ZWSP
    codePoint === 0x2066 || // LRI
    codePoint === 0x2067 || // RLI
    codePoint === 0x2068 || // FSI
    codePoint === 0x2069 || // PDI
    codePoint === 0x202a || // LRE
    codePoint === 0x202b || // RLE
    codePoint === 0x202c || // PDF
    codePoint === 0xfeff    // BOM / ZWNBSP
  ) {
    return 'other';
  }

  // Arabic-script punctuation — classify as 'punctuation' not 'arabic'
  // Must be checked BEFORE the broad Arabic block (U+0600-06FF) which would catch them
  if (
    codePoint === 0x060c || // Arabic comma ،
    codePoint === 0x061b || // Arabic semicolon ؛
    codePoint === 0x061f || // Arabic question mark ؟
    codePoint === 0x06d4 || // Arabic full stop ۔
    codePoint === 0x066b || // Arabic decimal separator
    codePoint === 0x066c    // Arabic thousands separator
  ) {
    return 'punctuation';
  }

  // Arabic script blocks (after excluding Arabic punctuation above)
  if (
    (codePoint >= 0x0600 && codePoint <= 0x06ff) || // Arabic
    (codePoint >= 0x0750 && codePoint <= 0x077f) || // Arabic Supplement
    (codePoint >= 0x08a0 && codePoint <= 0x08ff) || // Arabic Extended-A
    (codePoint >= 0xfb50 && codePoint <= 0xfdff) || // Arabic Presentation Forms-A
    (codePoint >= 0xfe70 && codePoint <= 0xfeff) || // Arabic Presentation Forms-B
    codePoint === 0x0640                             // Tatweel
  ) {
    return 'arabic';
  }

  // Urdu-specific digits (Eastern Arabic-Indic)
  if (codePoint >= 0x06f0 && codePoint <= 0x06f9) {
    return 'arabic'; // Already covered above but explicit for clarity
  }

  // Western digits 0-9
  if (codePoint >= 0x0030 && codePoint <= 0x0039) {
    return 'digit';
  }

  // Basic Latin letters (A-Z, a-z)
  if (
    (codePoint >= 0x0041 && codePoint <= 0x005a) || // A-Z
    (codePoint >= 0x0061 && codePoint <= 0x007a)    // a-z
  ) {
    return 'latin';
  }

  // Latin Extended blocks
  if (
    (codePoint >= 0x00c0 && codePoint <= 0x024f) || // Latin Extended-A & B
    (codePoint >= 0x1e00 && codePoint <= 0x1eff)    // Latin Extended Additional
  ) {
    return 'latin';
  }

  // Common punctuation & symbols (after bidi controls excluded above)
  if (
    (codePoint >= 0x0021 && codePoint <= 0x002f) || // !"#$%&'()*+,-./
    (codePoint >= 0x003a && codePoint <= 0x0040) || // :;<=>?@
    (codePoint >= 0x005b && codePoint <= 0x0060) || // [\]^_`
    (codePoint >= 0x007b && codePoint <= 0x007e) || // {|}~
    (codePoint >= 0x2000 && codePoint <= 0x206f) || // General Punctuation
    (codePoint >= 0x00ab && codePoint <= 0x00bb)    // « »
  ) {
    return 'punctuation';
  }

  return 'other';
}

/**
 * Classify the dominant script of a text string.
 * Returns the script class of the first "strong" (non-neutral) character.
 */
export function classifyRun(text: string): ScriptClass {
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    const cls = classifyChar(cp);
    if (cls === 'arabic' || cls === 'latin') {
      return cls;
    }
  }
  return 'other';
}

/**
 * Segment a string into contiguous same-script runs.
 *
 * Whitespace, digits, and punctuation are "neutral" — they inherit the script
 * of the preceding strong (arabic/latin) character, or the following one if
 * they appear at the start. This prevents a space between two Urdu words
 * from splitting into a separate segment.
 */
export function segmentByScript(text: string): ScriptSegment[] {
  if (!text) return [];

  // Step 1: Classify every character
  const chars: Array<{ char: string; script: ScriptClass }> = [];
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    chars.push({ char, script: classifyChar(cp) });
  }

  // Step 2: Resolve neutral characters (whitespace, digit, punctuation, other)
  // by inheriting from the nearest strong neighbour
  const resolved: ScriptClass[] = new Array(chars.length);
  let lastStrong: ScriptClass = 'arabic'; // Default to arabic in an Urdu-first app

  // Forward pass: inherit from previous strong
  for (let i = 0; i < chars.length; i++) {
    const cls = chars[i]!.script;
    if (cls === 'arabic' || cls === 'latin') {
      lastStrong = cls;
      resolved[i] = cls;
    } else {
      resolved[i] = lastStrong;
    }
  }

  // Backward pass: fix leading neutrals that had no preceding strong
  // Find the first strong character and propagate its script backward
  let firstStrong: ScriptClass = 'arabic';
  for (let i = 0; i < chars.length; i++) {
    const cls = chars[i]!.script;
    if (cls === 'arabic' || cls === 'latin') {
      firstStrong = cls;
      break;
    }
  }
  for (let i = 0; i < chars.length; i++) {
    const cls = chars[i]!.script;
    if (cls === 'arabic' || cls === 'latin') break;
    resolved[i] = firstStrong;
  }

  // Step 3: Group into contiguous segments
  const segments: ScriptSegment[] = [];
  let currentText = chars[0]!.char;
  let currentScript = resolved[0]!;

  for (let i = 1; i < chars.length; i++) {
    if (resolved[i] === currentScript) {
      currentText += chars[i]!.char;
    } else {
      segments.push({ text: currentText, script: currentScript });
      currentText = chars[i]!.char;
      currentScript = resolved[i]!;
    }
  }
  segments.push({ text: currentText, script: currentScript });

  return segments;
}
