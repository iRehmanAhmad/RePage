/**
 * Builds src/domain/language/englishWordlist.generated.ts from the upstream
 * Tesseract OCR langdata English wordlist.
 *
 * Source: https://github.com/tesseract-ocr/langdata/blob/main/eng/eng.wordlist
 * License: Apache License 2.0 (https://github.com/tesseract-ocr/langdata/blob/main/LICENSE)
 *   — verified by reading the upstream LICENSE file; permits redistribution
 *   with attribution; the generated file's header carries the notice.
 *
 * Cleaning (documented, deterministic):
 *  - lowercase every token (the upstream list mixes cases for frequency data)
 *  - keep only pure a–z tokens of length >= 2 (drops symbols, digits,
 *    hyphenated fragments and apostrophe forms; contractions are handled by
 *    the engine, which checks the apostrophe-stripped form — the upstream
 *    list itself contains "dont", "isnt", "couldnt", ...)
 *  - drop the known-typo exclusions below: the upstream list is
 *    frequency-derived from OCR corpora, so a handful of common misspellings
 *    leaked in. They are not English words; leaving them in would make the
 *    spellchecker accept them. The list is deliberately small and explicit.
 *  - deduplicate, sort for stable output
 *  - ALSO emit ENGLISH_COMMON_WORDS: the first 5,000 valid words in upstream
 *    order. The upstream list is frequency-ordered ("the" is line 1), and
 *    the engine uses this head as a tie-break rank for suggestions, so a
 *    common correction ("the") beats an obscure same-distance word ("eth").
 * Single-letter words ("a", "I") are length-filtered out here; the engine
 * treats them via its core set and never flags single characters anyway.
 *
 * Usage: node scripts/build-english-wordlist.mjs [--input path/to/eng.wordlist]
 * If --input is omitted, the script downloads the upstream file (needs network).
 * The script never edits the document model — output is lookup keys only.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const OUT = join(REPO, 'src/domain/language/englishWordlist.generated.ts');
const UPSTREAM_URL =
  'https://raw.githubusercontent.com/tesseract-ocr/langdata/main/eng/eng.wordlist';

// Common misspellings present in the frequency-derived upstream list.
// Each entry is a misspelling of a common English word (in parentheses),
// not a word in its own right in modern usage.
const KNOWN_TYPO_EXCLUSIONS = new Set([
  'teh', // the
  'recieve', // receive
  'seperate', // separate
  'occured', // occurred
  'goverment', // government
  'enviroment', // environment
  'accomodate', // accommodate
  'definately', // definitely
  'independant', // independent
  'adress', // address
  'formating', // formatting
  'funtion', // function
  'untill', // until
  'writen', // written
  'wich', // which (standalone; the place-name suffix never appears alone)
]);

const VALID_KEY = /^[a-z]{2,}$/;
const COMMON_HEAD_SIZE = 5000;

async function loadSource() {
  const arg = process.argv.find((a) => a.startsWith('--input='));
  if (arg) return readFileSync(arg.slice('--input='.length), 'utf8');
  const res = await fetch(UPSTREAM_URL);
  if (!res.ok) throw new Error(`download failed: ${res.status} ${UPSTREAM_URL}`);
  return res.text();
}

function build(text) {
  const seen = new Set();
  const common = [];
  let dropped = 0;
  let excluded = 0;
  for (const rawLine of text.split('\n')) {
    const key = rawLine.trim().toLowerCase();
    if (!key || !VALID_KEY.test(key)) {
      dropped++;
      continue;
    }
    if (KNOWN_TYPO_EXCLUSIONS.has(key)) {
      excluded++;
      continue;
    }
    if (!seen.has(key)) {
      seen.add(key);
      // First sighting order = upstream frequency order.
      if (common.length < COMMON_HEAD_SIZE) common.push(key);
    }
  }
  return { words: [...seen].sort(), common, dropped, excluded, raw: text.split('\n').length };
}

function emit(words, common, meta) {
  const header = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Regenerate with: node scripts/build-english-wordlist.mjs
 *
 * English spellcheck wordlist (${words.length.toLocaleString('en-US')} lookup keys).
 *
 * Source: https://github.com/tesseract-ocr/langdata/blob/main/eng/eng.wordlist
 * License: Apache License 2.0 — https://github.com/tesseract-ocr/langdata/blob/main/LICENSE
 * Attribution: "English wordlist derived from tesseract-ocr/langdata (Apache-2.0),
 *   (c) the Tesseract OCR contributors."
 * Generated: ${meta.date} | upstream lines: ${meta.raw} | dropped as noise: ${meta.dropped} | known-typo exclusions applied: ${meta.excluded}
 *
 * Lookup keys are lowercase a–z only. Document text is never modified;
 * matching lowercases a copy of the token. Single-letter words ("a", "I")
 * are covered by the spellcheck engine's core set, not this list.
 */
`;
  const body = `export const ENGLISH_WORDLIST: readonly string[] = [\n${words.map((w) => `  '${w}',`).join('\n')}\n];\n\nexport const ENGLISH_WORDLIST_SIZE = ${words.length};\n\n/**\n * The ${common.length} most frequent words, in upstream frequency order.\n * Used only as a suggestion-ranking tie-break (lower index = more common).\n */\nexport const ENGLISH_COMMON_WORDS: readonly string[] = [\n${common.map((w) => `  '${w}',`).join('\n')}\n];\n`;
  writeFileSync(OUT, header + '\n' + body, 'utf8');
  return OUT;
}

const { words, common, dropped, excluded, raw } = build(await loadSource());
const out = emit(words, common, { date: new Date().toISOString().slice(0, 10), dropped, excluded, raw });
console.log(`wrote ${out}: ${words.length} words (${dropped} dropped, ${excluded} typo exclusions, ${common.length} common head)`);
