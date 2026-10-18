import { isWordInCoreDictionaries, normalizeForDictionary } from './urduDictionary';
import { loadPersonalDictionary, onPersonalDictionaryChanged } from './personalDictionary';
import { URDU_WORDLIST } from './urduWordlist.generated';

export interface SpellingError {
  word: string;
  index: number;
  length: number;
  suggestions: string[];
}

export interface MisspelledRange {
  word: string;
  /** UTF-16 offset of the token start in the source text. */
  start: number;
  /** UTF-16 offset of the token end (exclusive). */
  end: number;
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

/**
 * Damerau-Levenshtein capped at a threshold: returns the exact distance when
 * it is <= threshold, otherwise threshold + 1. Only the |i-j| <= threshold
 * band of the DP table is computed — any alignment of cost <= threshold can
 * never leave that band (each indel changes the prefix-length difference by
 * at most 1), so the result is exact. ~5x cheaper than the full table for
 * short words, which is what the suggestion hot path needs.
 */
function damerauLevenshteinBounded(s1: string, s2: string, threshold: number): number {
  const m = s1.length;
  const n = s2.length;
  if (Math.abs(m - n) > threshold) return threshold + 1;
  const INF = threshold + 1;
  const stride = n + 1;
  // Flat buffer: one allocation per call instead of (m+1) row arrays.
  const dp = new Int16Array((m + 1) * stride).fill(INF);
  for (let i = 0; i <= m && i <= threshold; i++) dp[i * stride] = i;
  for (let j = 0; j <= n && j <= threshold; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    const row = i * stride;
    const prevRow = (i - 1) * stride;
    const prevPrevRow = (i - 2) * stride;
    for (let j = Math.max(1, i - threshold); j <= Math.min(n, i + threshold); j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      let best = Math.min(dp[prevRow + j]! + 1, dp[row + j - 1]! + 1, dp[prevRow + j - 1]! + cost);
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        best = Math.min(best, dp[prevPrevRow + j - 2]! + cost);
      }
      dp[row + j] = best;
    }
  }
  const dist = dp[m * stride + n]!;
  return dist <= threshold ? dist : threshold + 1;
}

// Length buckets over the vendored wordlist so suggestion candidates stay
// small: only words within ±2 of the query length are distance-checked.
const WORDS_BY_LENGTH: Map<number, string[]> = new Map();
for (const w of URDU_WORDLIST) {
  const bucket = WORDS_BY_LENGTH.get(w.length);
  if (bucket) bucket.push(w);
  else WORDS_BY_LENGTH.set(w.length, [w]);
}

export function getSpellingSuggestions(word: string, maxSuggestions = 5): string[] {
  if (!word) return [];
  const norm = normalizeForDictionary(word);
  if (!norm || isSpellingCorrect(word)) return [];

  const candidates: string[] = [];
  for (let len = Math.max(2, norm.length - 2); len <= norm.length + 2; len++) {
    const bucket = WORDS_BY_LENGTH.get(len);
    if (bucket) candidates.push(...bucket);
  }

  const scored: Array<{ candidate: string; distance: number }> = [];
  for (const candidate of candidates) {
    if (candidate === norm) continue;
    const distance = damerauLevenshteinBounded(norm, candidate, 2);
    if (distance <= 2) scored.push({ candidate, distance });
  }
  // Stable sort: ties keep wordlist order, so results are deterministic.
  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, maxSuggestions).map((s) => s.candidate);
}

// --- Personal dictionary cache -------------------------------------------------
// The hot path must not hit localStorage per word, so personal words are cached
// in memory and invalidated whenever the personal dictionary changes.
let personalCache: Set<string> | null = null;

function getPersonalCache(): Set<string> {
  if (!personalCache) {
    personalCache = new Set();
    for (const w of loadPersonalDictionary()) {
      const norm = normalizeForDictionary(w);
      if (norm) personalCache.add(norm);
    }
  }
  return personalCache;
}

/** Call after addPersonalWord/removePersonalWord so inline checks pick it up. */
export function notePersonalDictionaryChanged(): void {
  personalCache = null;
}

// Auto-invalidate the cache whenever the personal dictionary is mutated
// (addPersonalWord/removePersonalWord/savePersonalDictionary emit this),
// so existing callers keep working without manual cache management.
onPersonalDictionaryChanged(() => {
  personalCache = null;
});

// --- Session ignore ------------------------------------------------------------
const sessionIgnored = new Set<string>();

/** Ignore a word until the app reloads (context-menu "Ignore"). */
export function ignoreWordForSession(word: string): void {
  const norm = normalizeForDictionary(word);
  if (norm) sessionIgnored.add(norm);
}

export function clearSessionIgnores(): void {
  sessionIgnored.clear();
}

// --- Core verdict ---------------------------------------------------------------
/**
 * Fast O(1)-per-word correctness check used by the inline highlighter.
 * Normalization is for the lookup key only — document text is never modified.
 */
export function isSpellingCorrect(word: string): boolean {
  const norm = normalizeForDictionary(word);
  // Too short to judge (single characters, stray marks): never flag.
  if (norm.length < 2) return true;
  return (
    sessionIgnored.has(norm) ||
    getPersonalCache().has(norm) ||
    isWordInCoreDictionaries(norm)
  );
}

// --- Tokenizer -------------------------------------------------------------------
// Matches Urdu-script runs (letters + ZWNJ so joined words stay one token).
// Latin-script tokens never match and are therefore always skipped: this batch
// vendors no English wordlist, so Latin checking is future work (see report).
// eslint-disable-next-line no-misleading-character-class
const URDU_TOKEN_RE = /[\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u06FA-\u06FC\u200C]+/g;
const URL_SPAN_RE = /https?:\/\/[^\s]+/g;
const EMAIL_SPAN_RE = /[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
const NUMBER_LIKE_RE = /^[\d\s.,:/$€£¥₹روپےRs]+$/;

function findSkipSpans(text: string): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  for (const re of [URL_SPAN_RE, EMAIL_SPAN_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) spans.push([m.index, m.index + m[0].length]);
  }
  return spans;
}

/**
 * Finds misspelled Urdu tokens with their text offsets. Skips numbers, dates,
 * currency, URLs, emails, Latin-script tokens and single characters. Aerab and
 * other diacritics never cause a flag: comparison is on normalized lookup keys.
 */
export function findMisspelledRanges(text: string): MisspelledRange[] {
  if (!text) return [];
  const skipSpans = findSkipSpans(text);
  const ranges: MisspelledRange[] = [];
  URDU_TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URDU_TOKEN_RE.exec(text)) !== null) {
    const word = m[0];
    const start = m.index;
    const end = start + word.length;
    if (skipSpans.some(([s, e]) => start >= s && end <= e)) continue;
    if (NUMBER_LIKE_RE.test(word)) continue;
    if (!isSpellingCorrect(word)) ranges.push({ word, start, end });
  }
  return ranges;
}

/**
 * Back-compat panel API: same signature and shape as before, now powered by
 * the vendored wordlist engine (no second dictionary).
 */
export function checkUrduText(text: string): SpellingError[] {
  return findMisspelledRanges(text).map((r) => ({
    word: r.word,
    index: r.start,
    length: r.word.length,
    suggestions: getSpellingSuggestions(r.word),
  }));
}
