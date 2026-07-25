export interface NormalizationDiffSegment {
  type: 'unchanged' | 'replaced';
  originalText: string;
  normalizedText: string;
  reason?: string | undefined;
}

export interface NormalizationPreviewResult {
  originalText: string;
  normalizedText: string;
  replacementCount: number;
  segments: NormalizationDiffSegment[];
}

export function previewNormalization(text: string): NormalizationPreviewResult {
  if (!text) {
    return {
      originalText: '',
      normalizedText: '',
      replacementCount: 0,
      segments: [],
    };
  }

  const segments: NormalizationDiffSegment[] = [];
  let replacementCount = 0;
  let normalizedText = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (!char) continue;

    if (char === '\u0643') {
      // Arabic Kaf 'ك' -> Urdu Kaf 'ک'
      segments.push({
        type: 'replaced',
        originalText: 'ك',
        normalizedText: 'ک',
        reason: 'عربی کاف (ك) کو اردو کاف (ک) میں تبدیل کیا گیا',
      });
      replacementCount++;
      normalizedText += 'ک';
    } else if (char === '\u064A' || char === '\u0649') {
      // Arabic/Farsi Yeh 'ي'/'ى' -> Urdu Yeh 'ی'
      segments.push({
        type: 'replaced',
        originalText: char,
        normalizedText: 'ی',
        reason: 'عربی/فارسی یاء کو اردو گول ی (ی) میں تبدیل کیا گیا',
      });
      replacementCount++;
      normalizedText += 'ی';
    } else if (char === '\u0629') {
      // Arabic Teh Marbuta 'ۃ' -> Urdu Goal Heh 'ہ'
      segments.push({
        type: 'replaced',
        originalText: 'ۃ',
        normalizedText: 'ہ',
        reason: 'تائے مربوطہ (ۃ) کو اردو گول ہ (ہ) میں تبدیل کیا گیا',
      });
      replacementCount++;
      normalizedText += 'ہ';
    } else {
      segments.push({
        type: 'unchanged',
        originalText: char,
        normalizedText: char,
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

export function applyNormalization(text: string): string {
  return previewNormalization(text).normalizedText;
}
