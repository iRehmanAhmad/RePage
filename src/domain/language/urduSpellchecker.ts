import { isWordInCoreDictionaries, normalizeForDictionary } from './urduDictionary';
import { loadPersonalDictionary, onPersonalDictionaryChanged } from './personalDictionary';
import { URDU_WORDLIST } from './urduWordlist.generated';
import { ENGLISH_COMMON_WORDS, ENGLISH_WORDLIST } from './englishWordlist.generated';

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
  // Latin tokens are served by the English wordlist path below.
  if (isLatinWord(word)) return getEnglishSuggestions(word, maxSuggestions);
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

// --- English (Latin-script) checking -------------------------------------------
// Vendored English wordlist (tesseract-ocr/langdata, Apache-2.0 — see
// englishWordlist.generated.ts header and docs/DEPENDENCIES.md). Built once at
// module load: O(1) lookup per word, length buckets for suggestions.
const ENGLISH_SET: Set<string> = new Set(ENGLISH_WORDLIST);
const ENGLISH_WORDS_BY_LENGTH: Map<number, string[]> = new Map();
for (const w of ENGLISH_WORDLIST) {
  const bucket = ENGLISH_WORDS_BY_LENGTH.get(w.length);
  if (bucket) bucket.push(w);
  else ENGLISH_WORDS_BY_LENGTH.set(w.length, [w]);
}
// Frequency rank of the most common words (upstream list order); used only
// to rank suggestions so common corrections beat obscure same-distance words.
const ENGLISH_COMMON_RANK: Map<string, number> = new Map(
  ENGLISH_COMMON_WORDS.map((w, i) => [w, i] as const),
);
const NOT_COMMON = Number.MAX_SAFE_INTEGER;

/** Single-letter English words filtered out of the generated list (length >= 2). */
const ENGLISH_CORE_WORDS: ReadonlySet<string> = new Set(['a', 'i']);

// eslint-disable-next-line no-misleading-character-class
const ARABIC_SCRIPT_RE = /[\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u06FA-\u06FC]/;
const LATIN_LETTER_RE = /[A-Za-z]/;

/** True for tokens written purely in Latin letters (+ apostrophes). */
export function isLatinWord(word: string): boolean {
  return LATIN_LETTER_RE.test(word) && !ARABIC_SCRIPT_RE.test(word);
}

/**
 * Lookup key for English matching: lowercase, curly apostrophe unified.
 * Applied to a copy of the token only — document text is never modified.
 */
export function normalizeForEnglish(word: string): string {
  if (!word) return '';
  return word.trim().toLowerCase().replace(/’/g, "'");
}

/** Membership test against the English core set + vendored list. */
export function isWordInEnglishDictionary(word: string): boolean {
  const key = normalizeForEnglish(word);
  if (!key) return false;
  if (ENGLISH_CORE_WORDS.has(key) || ENGLISH_SET.has(key)) return true;
  if (key.includes("'")) {
    // Contractions: the vendored list carries apostrophe-stripped forms
    // ("dont", "isnt", "couldnt"), so the stripped key is authoritative.
    if (ENGLISH_SET.has(key.replace(/'/g, ''))) return true;
    // Possessives: "teacher's" -> "teacher", "students'" -> "students".
    if (key.endsWith("'s") && ENGLISH_SET.has(key.slice(0, -2))) return true;
    if (key.endsWith("'") && ENGLISH_SET.has(key.slice(0, -1))) return true;
  }
  return false;
}

function isEnglishCorrect(word: string): boolean {
  const key = normalizeForEnglish(word);
  if (key.length < 2) return true;
  // Session ignore + personal dictionary apply to English words too. Their
  // caches are keyed by normalizeForDictionary, which agrees with
  // normalizeForEnglish on ASCII Latin tokens; check both key forms so a
  // word ignored in either spelling stays ignored.
  const dictKey = normalizeForDictionary(word);
  if (sessionIgnored.has(key) || sessionIgnored.has(dictKey)) return true;
  const personal = getPersonalCache();
  if (personal.has(key) || personal.has(dictKey)) return true;
  return isWordInEnglishDictionary(word);
}

function sortedLetters(s: string): string {
  return [...s].sort().join('');
}

function getEnglishSuggestions(word: string, maxSuggestions: number): string[] {
  // Suggestions are computed on the apostrophe-stripped key: list entries
  // carry no apostrophes, so "teh" and "don't"-style typos share one path.
  const key = normalizeForEnglish(word).replace(/'/g, '');
  if (!key || isEnglishCorrect(word)) return [];

  const candidates: string[] = [];
  for (let len = Math.max(2, key.length - 2); len <= key.length + 2; len++) {
    const bucket = ENGLISH_WORDS_BY_LENGTH.get(len);
    if (bucket) candidates.push(...bucket);
  }

  const keyLetters = sortedLetters(key);
  const scored: Array<{ candidate: string; distance: number; rank: number; sameLetters: number }> = [];
  for (const candidate of candidates) {
    if (candidate === key) continue;
    const distance = damerauLevenshteinBounded(key, candidate, 2);
    if (distance <= 2) {
      scored.push({
        candidate,
        distance,
        rank: ENGLISH_COMMON_RANK.get(candidate) ?? NOT_COMMON,
        // Transposition typos ("teh" -> "the") reuse exactly the same
        // letters; among equal distance + frequency, rank those first.
        sameLetters: candidate.length === key.length && sortedLetters(candidate) === keyLetters ? 0 : 1,
      });
    }
  }
  // Stable sort: remaining ties keep wordlist (alphabetical) order.
  scored.sort((a, b) => a.distance - b.distance || a.rank - b.rank || a.sameLetters - b.sameLetters);
  return scored.slice(0, maxSuggestions).map((s) => s.candidate);
}

// --- Core verdict ---------------------------------------------------------------
/**
 * Fast O(1)-per-word correctness check used by the inline highlighter.
 * Normalization is for the lookup key only — document text is never modified.
 * Latin words are checked against the English wordlist; Arabic-script words
 * against the Urdu dictionaries. Mixed-script words are judged by the Urdu
 * path only when they contain Arabic-script letters and no Latin letters are
 * present at the token level (see findMisspelledRanges).
 */
export function isSpellingCorrect(word: string): boolean {
  if (isLatinWord(word)) return isEnglishCorrect(word);
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
// eslint-disable-next-line no-misleading-character-class
const URDU_TOKEN_RE = /[\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u06FA-\u06FC\u200C]+/g;
// Matches word-character runs of either script (Arabic-script letters + ZWNJ,
// Latin letters, apostrophes for English contractions/possessives). Each run
// is classified by the scripts it contains:
//   - Latin only   -> English wordlist check
//   - Arabic only  -> Urdu dictionary check (via URDU_TOKEN_RE sub-runs,
//                     exactly the tokens the old Urdu-only scan produced)
//   - both scripts -> skipped (conservative: no dictionary covers hybrid
//                     tokens, and guessing a split could corrupt offsets)
// eslint-disable-next-line no-misleading-character-class
const WORD_TOKEN_RE = /[\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u06FA-\u06FC\u200CA-Za-z'\u2019]+/g;
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
 * Finds misspelled Urdu and English tokens with their text offsets. Skips
 * numbers, dates, currency, URLs, emails, mixed-script tokens and single
 * characters. Aerab and other diacritics never cause a flag: comparison is
 * on normalized lookup keys.
 */
export function findMisspelledRanges(text: string): MisspelledRange[] {
  if (!text) return [];
  const skipSpans = findSkipSpans(text);
  const ranges: MisspelledRange[] = [];
  const inSkipSpan = (start: number, end: number): boolean =>
    skipSpans.some(([s, e]) => start >= s && end <= e);

  WORD_TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WORD_TOKEN_RE.exec(text)) !== null) {
    const span = m[0];
    const spanStart = m.index;
    const spanEnd = spanStart + span.length;
    if (inSkipSpan(spanStart, spanEnd)) continue;

    const hasArabic = ARABIC_SCRIPT_RE.test(span);
    const hasLatin = LATIN_LETTER_RE.test(span);
    // Mixed-script token: no reliable dictionary — skip conservatively.
    if (hasArabic && hasLatin) continue;

    if (hasLatin) {
      // Pure Latin run: English wordlist check. Apostrophes at the edges are
      // quotation marks, not part of the word — trim them (with offsets);
      // internal ones belong to contractions/possessives and stay.
      let lo = 0;
      let hi = span.length;
      while (lo < hi && (span[lo] === "'" || span[lo] === '’')) lo++;
      while (hi > lo && (span[hi - 1] === "'" || span[hi - 1] === '’')) hi--;
      const word = span.slice(lo, hi);
      if (word && !isSpellingCorrect(word)) {
        ranges.push({ word, start: spanStart + lo, end: spanStart + hi });
      }
      continue;
    }
    if (!hasArabic) continue; // stray apostrophes / ZWNJ only

    // Arabic-script run: re-tokenize with the Urdu pattern so offsets and
    // verdicts are identical to the original Urdu-only scan (an apostrophe
    // wedged between Urdu letters splits the run, as before).
    URDU_TOKEN_RE.lastIndex = 0;
    let um: RegExpExecArray | null;
    while ((um = URDU_TOKEN_RE.exec(span)) !== null) {
      const word = um[0];
      const start = spanStart + um.index;
      const end = start + word.length;
      if (inSkipSpan(start, end)) continue;
      if (NUMBER_LIKE_RE.test(word)) continue;
      if (!isSpellingCorrect(word)) ranges.push({ word, start, end });
    }
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
