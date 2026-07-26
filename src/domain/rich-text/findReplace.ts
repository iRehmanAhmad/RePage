export interface FindMatch {
  index: number;
  length: number;
  matchedText: string;
}

export interface FindReplaceOptions {
  matchCase?: boolean;
  ignoreAerab?: boolean;
  matchVariants?: boolean;
}

// Urdu Aerab / diacritic character set regex range (U+064B - U+065F, U+0670)
const URDU_AERAB_REGEX = /[\u064B-\u065F\u0670]/g;

export function stripAerab(input: string): string {
  return input.replace(URDU_AERAB_REGEX, '');
}

/**
 * Normalizes Arabic-to-Urdu character variants for flexible matching (ك -> ک, ي -> ی).
 */
export function normalizeVariants(input: string): string {
  return input.replace(/ك/g, 'ک').replace(/ي/g, 'ی');
}

/**
 * Searches for query substring occurrences within input text with support for case, aerab & variant options.
 */
export function findInUrduText(
  text: string,
  query: string,
  options: FindReplaceOptions = {},
): FindMatch[] {
  if (!text || !query) return [];

  const { matchCase = false, ignoreAerab = false, matchVariants = false } = options;

  let targetText = text;
  let searchQuery = query;

  if (!matchCase) {
    targetText = targetText.toLowerCase();
    searchQuery = searchQuery.toLowerCase();
  }

  if (ignoreAerab) {
    targetText = stripAerab(targetText);
    searchQuery = stripAerab(searchQuery);
  }

  if (matchVariants) {
    targetText = normalizeVariants(targetText);
    searchQuery = normalizeVariants(searchQuery);
  }

  const matches: FindMatch[] = [];
  let startIndex = 0;

  while (startIndex < targetText.length) {
    const foundIndex = targetText.indexOf(searchQuery, startIndex);
    if (foundIndex === -1) break;

    matches.push({
      index: foundIndex,
      length: searchQuery.length,
      matchedText: text.substring(foundIndex, foundIndex + searchQuery.length),
    });

    startIndex = foundIndex + Math.max(1, searchQuery.length);
  }

  return matches;
}

/**
 * Replaces occurrences of query substring with replacement string.
 */
export function replaceInUrduText(
  text: string,
  query: string,
  replacement: string,
  options: FindReplaceOptions = {},
): string {
  if (!text || !query) return text;

  const matches = findInUrduText(text, query, options);
  if (matches.length === 0) return text;

  let result = '';
  let lastIndex = 0;

  for (const match of matches) {
    result += text.substring(lastIndex, match.index) + replacement;
    lastIndex = match.index + match.length;
  }

  result += text.substring(lastIndex);
  return result;
}
