import { isWordInDictionary, normalizeForDictionary } from './urduDictionary';
import { isPersonalWord } from './personalDictionary';

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

  for (let i = 0; i <= m; i++) (dp[i]!)[0] = i;
  for (let j = 0; j <= n; j++) (dp[0]!)[j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      const prevRow = dp[i - 1]!;
      const currRow = dp[i]!;

      currRow[j] = Math.min(
        prevRow[j]! + 1, // Deletion
        currRow[j - 1]! + 1, // Insertion
        prevRow[j - 1]! + cost, // Substitution
      );

      // Transposition check
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        const prevPrevRow = dp[i - 2]!;
        currRow[j] = Math.min(currRow[j]!, prevPrevRow[j - 2]! + cost);
      }
    }
  }

  return dp[m]![n]!;
}

const COMMON_URDU_VOCAB = [
  'پاکستان', 'اردو', 'سلام', 'شکریہ', 'خوش', 'آمدید', 'کتاب', 'قلم',
  'علم', 'محبت', 'دوست', 'وطن', 'شعر', 'ادب', 'شاعری', 'صفحہ',
  'تحریر', 'عنوان', 'مضمون', 'قومی', 'زبان', 'خوبصورت', 'بہت', 'اچھا',
  'کیا', 'حال', 'ہے', 'ہیں', 'تھا', 'تھے', 'کا', 'کی', 'کے', 'میں',
  'پر', 'اور', 'سے', 'کو', 'یہ', 'وہ', 'ترانہ', 'دستور', 'حکومت', 'ملک',
  'جمہوریہ', 'با‌اعتماد', 'با‌صلاحیت', 'بہترین', 'رابطہ', 'یا', 'تاریخ', 'قیمت', 'روپے', 'ایک', 'انسان', 'دنیا', 'روشنی',
  'تاریکی', 'زندگی', 'امید', 'شہر', 'کمپیوٹر', 'سافٹ ویئر', 'دستاویز',
];

export function getSpellingSuggestions(word: string, maxSuggestions = 5): string[] {
  if (!word || isWordInDictionary(word) || isPersonalWord(word)) return [];

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

const URL_OR_EMAIL_REGEX = /^(https?:\/\/|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/;
const NUMBER_OR_DATE_CURRENCY_REGEX = /^[\d\s.,:/$€£¥₹روپےRs]+$/;

export function checkUrduText(text: string): SpellingError[] {
  if (!text) return [];

  const errors: SpellingError[] = [];
  // Match Urdu letters & ZWNJ, excluding punctuation symbols (such as \u060C Arabic comma or \u06D4 Urdu period)
  const wordRegex = /[\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u06FA-\u06FC\u200C]+/g;

  let match: RegExpExecArray | null;
  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0];
    const index = match.index;

    // Skip numbers, dates, currency, URLs, emails
    if (URL_OR_EMAIL_REGEX.test(word) || NUMBER_OR_DATE_CURRENCY_REGEX.test(word)) {
      continue;
    }

    if (!isWordInDictionary(word) && !isPersonalWord(word)) {
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
