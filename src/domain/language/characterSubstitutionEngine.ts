import type { ParagraphNode } from '../rich-text/types';
import type { RePageDocument } from '../document/types';

export interface SubstitutionResult {
  doc: RePageDocument;
  arabicReplacements: number;
  punctuationReplacements: number;
}

const ARABIC_TO_URDU_MAP: Record<string, string> = {
  '\u0643': '\u06a9', // Arabic Kaf ك -> Urdu Keheh ک
  '\u064a': '\u06cc', // Arabic Yeh ي -> Urdu Farsi Yeh ی
  '\u0647': '\u06c1', // Arabic Heh ه -> Urdu Goal Heh ہ
  '\u0629': '\u06c2', // Arabic Teh Marbuta ة -> Urdu Teh Marbuta Goal ۃ
  '\u0649': '\u06d2', // Arabic Alef Maksura ى -> Urdu Bari Yeh ے (when appropriate)
  '\u0660': '۰', // Arabic 0 -> Urdu 0
  '\u0661': '۱', // Arabic 1 -> Urdu 1
  '\u0662': '۲', // Arabic 2 -> Urdu 2
  '\u0663': '۳', // Arabic 3 -> Urdu 3
  '\u0664': '۴', // Arabic 4 -> Urdu 4
  '\u0665': '۵', // Arabic 5 -> Urdu 5
  '\u0666': '۶', // Arabic 6 -> Urdu 6
  '\u0667': '۷', // Arabic 7 -> Urdu 7
  '\u0668': '۸', // Arabic 8 -> Urdu 8
  '\u0669': '۹', // Arabic 9 -> Urdu 9
};

/**
 * Replaces legacy Arabic character variants with native Urdu Unicode characters.
 */
export function substituteArabicCharacters(text: string): { text: string; replacementsCount: number } {
  let count = 0;
  let result = '';

  for (const char of text) {
    if (ARABIC_TO_URDU_MAP[char]) {
      result += ARABIC_TO_URDU_MAP[char];
      count++;
    } else {
      result += char;
    }
  }

  return { text: result, replacementsCount: count };
}

/**
 * Corrects punctuation marks in Urdu paragraphs (e.g. replacing English '?' with Urdu '؟').
 */
export function correctUrduPunctuation(text: string): { text: string; replacementsCount: number } {
  let count = 0;
  let result = text;

  // Replace English question mark in Urdu context
  if (result.includes('?')) {
    const prevLen = result.length;
    result = result.replace(/\?/g, '؟');
    count += prevLen - result.length + (result.split('؟').length - 1);
  }

  // Replace English comma in Urdu context
  if (result.includes(',')) {
    result = result.replace(/,/g, '،');
    count++;
  }

  // Replace English semicolon in Urdu context
  if (result.includes(';')) {
    result = result.replace(/;/g, '؛');
    count++;
  }

  return { text: result, replacementsCount: count };
}

/**
 * Bulk updates canonical document stories replacing legacy Arabic character variants and fixing punctuation.
 */
export function substituteDocumentCharacters(doc: RePageDocument): SubstitutionResult {
  let totalArabic = 0;
  let totalPunctuation = 0;

  const updatedStories = { ...doc.stories };

  for (const [storyId, story] of Object.entries(doc.stories)) {
    if (!story?.content?.content) continue;

    const updatedParagraphs: ParagraphNode[] = story.content.content.map((paragraph) => {
      const updatedRuns = paragraph.content.map((run) => {
        if (run.type !== 'text') return run;

        const arabicSub = substituteArabicCharacters(run.text);
        const punctSub = correctUrduPunctuation(arabicSub.text);

        totalArabic += arabicSub.replacementsCount;
        totalPunctuation += punctSub.replacementsCount;

        return {
          ...run,
          text: punctSub.text,
        };
      });

      return {
        ...paragraph,
        content: updatedRuns,
      };
    });

    updatedStories[storyId] = {
      ...story,
      content: {
        ...story.content,
        content: updatedParagraphs,
      },
    };
  }

  return {
    doc: {
      ...doc,
      stories: updatedStories,
    },
    arabicReplacements: totalArabic,
    punctuationReplacements: totalPunctuation,
  };
}
