import { isWordInDictionary, normalizeForDictionary } from './urduDictionary';

export interface SpellingError {
  word: string;
  index: number;
  length: number;
  suggestions: string[];
}

// Compute Damerau-Levenshtein edit distance for Urdu string suggestions
export function computeEditDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Deletion
        dp[i][j - 1] + 1, // Insertion
        dp[i - 1][j - 1] + cost, // Substitution
      );

      // Transposition check
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }

  return dp[m][n];
}

const COMMON_URDU_VOCAB = [
  'پاکستان', 'اردو', 'سلام', 'شکریہ', 'خوش', 'آمدید', 'کتاب', 'قلم',
  'علم', 'محبت', 'دوست', 'وطن', 'شعر', 'ادب', 'شاعری', 'صفحہ',
  'تحریر', 'عنوان', 'مضمون', 'قومی', 'زبان', 'خوبصورت', 'بہت', 'اچھا',
  'کیا', 'حال', 'ہے', 'ہیں', 'تھا', 'تھے', 'کا', 'کی', 'کے', 'میں',
  'پر', 'اور', 'سے', 'کو', 'یہ', 'وہ'
];

export function getSpellingSuggestions(word: string, maxSuggestions = 5): string[] {
  if (!word || isWordInDictionary(word)) return [];

  const norm = normalizeForDictionary(word);
  const candidates: Array<{ candidate: string; distance: number }> = [];

  for (const vocabWord of COMMON_URDU_VOCAB) {
    const vocabNorm = normalizeForDictionary(vocabWord);
    const dist = computeEditDistance(norm, vocabNorm);

    if (dist <= 2) {
      candidates.push({ candidate: vocabWord, distance: dist });
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates.map((c) => c.candidate).slice(0, maxSuggestions);
}

export function checkUrduText(text: string): SpellingError[] {
  if (!text) return [];

  const errors: SpellingError[] = [];
  const wordRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;

  let match: RegExpExecArray | null;
  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0];
    const index = match.index;

    if (!isWordInDictionary(word)) {
      const suggestions = getSpellingSuggestions(word);
      errors.push({
        word,
        index,
        length: word.length,
        suggestions,
      });
    }
  }

  return errors;
}
