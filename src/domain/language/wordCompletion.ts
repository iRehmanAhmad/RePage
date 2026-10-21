import { ENGLISH_COMMON_WORDS } from './englishWordlist.generated';
import { URDU_WORDLIST } from './urduWordlist.generated';
import { normalizeForDictionary } from './urduDictionary';
import type { DocumentVocabularyEntry } from './textAssistSettings';

/**
 * Word completion (Phase 4 batch 12): candidates for the word currently
 * being typed, shown in a small popup by the editor extension. Sources, in
 * priority order:
 *   1. the ACTIVE DOCUMENT's own vocabulary (buildDocumentVocabulary) —
 *      names and terms the user is actually writing about win first;
 *   2. the dictionary frequency head (ENGLISH_COMMON_WORDS, in frequency
 *      order) for Latin, and the vendored Urdu wordlist for Arabic script.
 *
 * Pure and synchronous; the whole scan is a prefix filter over 5k / 30k
 * entries, fast enough per keystroke. Rules (brief): prefix of at least 3
 * characters, never inside numeric strings, never for mixed-script
 * prefixes, and never a candidate equal to what is already typed.
 */

export const MIN_COMPLETION_PREFIX = 3;
export const MAX_COMPLETIONS = 6;

const ARABIC_RE = /[\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u06FA-\u06FC]/;
const LATIN_RE = /[A-Za-z]/;
// Aerab / superscript marks make length-based suffix slicing unsafe (the
// dictionary keys have them stripped), so a "dirty" Arabic prefix only
// completes from the document vocabulary, by exact surface prefix.
const ARABIC_DIRTY_RE = /[\u064B-\u065F\u0670\u200C\u200D]/;

export function isCompletablePrefix(prefix: string): boolean {
  if (prefix.length < MIN_COMPLETION_PREFIX) return false;
  if (/\d/.test(prefix)) return false;
  const hasArabic = ARABIC_RE.test(prefix);
  const hasLatin = LATIN_RE.test(prefix);
  return hasArabic !== hasLatin; // exactly one script
}

function matchCapitalization(typed: string, candidate: string): string {
  if (typed.length > 1 && typed === typed.toUpperCase() && typed !== typed.toLowerCase()) {
    return candidate.toUpperCase();
  }
  const first = typed.charAt(0);
  if (first && first === first.toUpperCase() && first !== first.toLowerCase()) {
    return candidate.charAt(0).toUpperCase() + candidate.slice(1);
  }
  return candidate;
}

function docCandidates(
  prefix: string,
  docVocab: readonly DocumentVocabularyEntry[],
  matches: (entryWord: string) => boolean,
): string[] {
  return docVocab
    .filter((entry) => entry.word.length > prefix.length && matches(entry.word))
    .sort((a, b) => b.count - a.count || a.word.length - b.word.length || a.word.localeCompare(b.word))
    .map((entry) => entry.word);
}

export function getCompletions(
  prefix: string,
  docVocab: readonly DocumentVocabularyEntry[] = [],
  limit: number = MAX_COMPLETIONS,
): string[] {
  if (!isCompletablePrefix(prefix)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (candidate: string): void => {
    const key = candidate.toLowerCase();
    if (seen.has(key) || out.length >= limit) return;
    seen.add(key);
    out.push(candidate);
  };

  if (LATIN_RE.test(prefix)) {
    const lower = prefix.toLowerCase();
    for (const word of docCandidates(prefix, docVocab, (w) => w.toLowerCase().startsWith(lower))) {
      push(word);
    }
    for (const word of ENGLISH_COMMON_WORDS) {
      if (out.length >= limit) break;
      if (word.length > prefix.length && word.startsWith(lower)) {
        push(matchCapitalization(prefix, word));
      }
    }
    return out;
  }

  // Arabic script.
  for (const word of docCandidates(prefix, docVocab, (w) => w.startsWith(prefix))) {
    push(word);
  }
  if (!ARABIC_DIRTY_RE.test(prefix)) {
    const normalizedPrefix = normalizeForDictionary(prefix);
    if (normalizedPrefix && normalizedPrefix.length >= MIN_COMPLETION_PREFIX) {
      for (const key of URDU_WORDLIST) {
        if (out.length >= limit) break;
        if (key.length > normalizedPrefix.length && key.startsWith(normalizedPrefix)) {
          push(key);
        }
      }
    }
  }
  return out;
}
