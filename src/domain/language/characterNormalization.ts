export interface NormalizationDiffSegment {
  type: 'unchanged' | 'replaced';
  originalText: string;
  normalizedText: string;
  reason?: string | undefined;
  offset?: number | undefined;
}

export interface NormalizationPreviewResult {
  originalText: string;
  normalizedText: string;
  replacementCount: number;
  segments: NormalizationDiffSegment[];
}

export interface NormalizationOptions {
  preserveArabicText?: boolean | undefined;
  previewOnly?: boolean | undefined;
}

// Sacred/Arabic phrase regex (e.g. «...» or phrases containing Quranic honorifics)
const SACRED_ARABIC_REGEX = /«[^»]+»|"(?:بسم|القرآن|اللہ|رسول|صلى|علیہ|رضی)[^"]+"/g;

export function previewNormalization(
  text: string,
  options: NormalizationOptions = {},
): NormalizationPreviewResult {
  if (!text) {
    return {
      originalText: '',
      normalizedText: '',
      replacementCount: 0,
      segments: [],
    };
  }

  const { preserveArabicText = false } = options;

  // Identify protected ranges if preserveArabicText is enabled
  const protectedRanges: Array<{ from: number; to: number }> = [];
  if (preserveArabicText) {
    let match: RegExpExecArray | null;
    while ((match = SACRED_ARABIC_REGEX.exec(text)) !== null) {
      protectedRanges.push({
        from: match.index,
        to: match.index + match[0].length,
      });
    }
  }

  const isProtectedIndex = (idx: number): boolean => {
    return protectedRanges.some((r) => idx >= r.from && idx < r.to);
  };

  const segments: NormalizationDiffSegment[] = [];
  let replacementCount = 0;
  let normalizedText = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (!char) continue;

    const isProtected = isProtectedIndex(i);

    if (!isProtected && char === '\u0643') {
      // Arabic Kaf 'ك' -> Urdu Kaf 'ک'
      segments.push({
        type: 'replaced',
        originalText: 'ك',
        normalizedText: 'ک',
        reason: 'عربی کاف (ك) کو اردو کاف (ک) میں تبدیل کیا گیا',
        offset: i,
      });
      replacementCount++;
      normalizedText += 'ک';
    } else if (!isProtected && (char === '\u064A' || char === '\u0649')) {
      // Arabic/Farsi Yeh 'ي'/'ى' -> Urdu Yeh 'ی'
      segments.push({
        type: 'replaced',
        originalText: char,
        normalizedText: 'ی',
        reason: 'عربی/فارسی یاء کو اردو گول ی (ی) میں تبدیل کیا گیا',
        offset: i,
      });
      replacementCount++;
      normalizedText += 'ی';
    } else if (!isProtected && char === '\u0629') {
      // Arabic Teh Marbuta 'ۃ' -> Urdu Goal Heh 'ہ'
      segments.push({
        type: 'replaced',
        originalText: 'ۃ',
        normalizedText: 'ہ',
        reason: 'تائے مربوطہ (ۃ) کو اردو گول ہ (ہ) میں تبدیل کیا گیا',
        offset: i,
      });
      replacementCount++;
      normalizedText += 'ہ';
    } else {
      segments.push({
        type: 'unchanged',
        originalText: char,
        normalizedText: char,
        offset: i,
      });
      normalizedText += char;
    }
  }

  return {
    originalText: text,
    normalizedText,
    replacementCount,
    segments,
  };
}

export function applyNormalization(
  text: string,
  options: NormalizationOptions = {},
): string {
  return previewNormalization(text, options).normalizedText;
}
