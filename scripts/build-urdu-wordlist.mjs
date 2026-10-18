/**
 * Builds src/domain/language/urduWordlist.generated.ts from the upstream
 * Tesseract OCR langdata Urdu wordlist.
 *
 * Source: https://github.com/tesseract-ocr/langdata/blob/main/urd/urd.wordlist
 * License: Apache License 2.0 (https://github.com/tesseract-ocr/langdata/blob/main/LICENSE)
 *   — permits redistribution with attribution; the generated file's header
 *   carries the required attribution notice.
 *
 * Cleaning (documented, deterministic):
 *  - strip leading/trailing punctuation/whitespace/digits
 *  - drop tokens containing internal ':', '/', '#', '@' (category tags etc.)
 *  - drop pure-Latin tokens and tokens with no Arabic-script letter
 *  - NFC-normalize, strip aerab/diacritics, strip ZWNJ, map Arabic Kaf/Yeh
 *    to Urdu Kaf/Yeh — lookup keys only; display forms are kept as-is
 *    wherever the normalized key still renders correctly
 *  - deduplicate on the normalized key, sort for stable output
 *
 * Usage: node scripts/build-urdu-wordlist.mjs [--input path/to/urd.wordlist]
 * If --input is omitted, the script downloads the upstream file (needs network).
 * The script never edits the document model — output is lookup keys only.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const OUT = join(REPO, 'src/domain/language/urduWordlist.generated.ts');
const UPSTREAM_URL =
  'https://raw.githubusercontent.com/tesseract-ocr/langdata/main/urd/urd.wordlist';

const AERAB_RE = /[ً-ٰٟ]/g; // U+064B–U+065F + U+0670
const ZWNJ = '‌'; // U+200C
const ARABIC_KAF = 'ك'; // U+0643 -> Urdu Kaf U+06A9
const ARABIC_YEH = /[يى]/g; // U+064A/U+0649 -> Urdu Yeh U+06CC
const EDGE_PUNCT_CHARS = [
  '۔', '،', '؛', '؟', '!', '"', "'", '(', ')', '[', ']', '{', '}', '<', '>',
  '«', '»', '…', '—', '–', '-', '.', ':', ';', '/', '\\', '|', '@', '#', '$',
  '%', '^', '&', '*', '+', '=', '~', '`', ',', '_', "'", '"', ' ', '\t', '\r', '\n',
  ...'0123456789٠١٢٣٤٥٦٧٨٩',
];
const EDGE_PUNCT = new Set(EDGE_PUNCT_CHARS);
const INTERNAL_JUNK = /[:/#@0-9a-zA-Z]/;
const HAS_ARABIC_SCRIPT = /[ء-غف-يٱ-ۓۺ-ۼ]/;
// Strict validity: only Arabic-script letters (+ ZWNJ, already stripped from
// keys), minimum 2 chars. Anything else (brackets, ®, stray marks) is noise.
const VALID_KEY = /^[\u0621-\u06D3]{2,}$/;

function normalizeKey(word) {
  return word
    .normalize('NFC')
    .replace(AERAB_RE, '')
    .replaceAll(ZWNJ, '')
    .replaceAll(ARABIC_KAF, 'ک')
    .replace(ARABIC_YEH, 'ی');
}

function stripEdges(s) {
  let start = 0;
  let end = s.length;
  while (start < end && EDGE_PUNCT.has(s[start])) start++;
  while (end > start && EDGE_PUNCT.has(s[end - 1])) end--;
  return s.slice(start, end);
}

async function loadSource() {
  const arg = process.argv.find((a) => a.startsWith('--input='));
  if (arg) return readFileSync(arg.slice('--input='.length), 'utf8');
  const res = await fetch(UPSTREAM_URL);
  if (!res.ok) throw new Error(`download failed: ${res.status} ${UPSTREAM_URL}`);
  return res.text();
}

function build(text) {
  const seen = new Map();
  let dropped = 0;
  for (const rawLine of text.split('\n')) {
    const cleaned = stripEdges(rawLine.trim());
    if (!cleaned || INTERNAL_JUNK.test(cleaned) || !HAS_ARABIC_SCRIPT.test(cleaned)) {
      dropped++;
      continue;
    }
    const key = normalizeKey(cleaned);
    if (!VALID_KEY.test(key)) {
      dropped++;
      continue;
    }
    if (!seen.has(key)) seen.set(key, cleaned);
  }
  return { words: [...seen.keys()].sort(), dropped, raw: text.split('\n').length };
}

function emit(words, meta) {
  const header = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Regenerate with: node scripts/build-urdu-wordlist.mjs
 *
 * Urdu spellcheck wordlist (${words.length.toLocaleString('en-US')} lookup keys).
 *
 * Source: https://github.com/tesseract-ocr/langdata/blob/main/urd/urd.wordlist
 * License: Apache License 2.0 — https://github.com/tesseract-ocr/langdata/blob/main/LICENSE
 * Attribution: "Urdu wordlist derived from tesseract-ocr/langdata (Apache-2.0),
 *   (c) the Tesseract OCR contributors."
 * Generated: ${meta.date} | upstream lines: ${meta.raw} | dropped as noise: ${meta.dropped}
 *
 * Lookup keys are normalized (NFC, aerab/ZWNJ stripped, Arabic Kaf/Yeh mapped to
 * Urdu forms) for dictionary matching ONLY. Document text is never modified.
 */
`;
  const body = `export const URDU_WORDLIST: readonly string[] = [\n${words.map((w) => `  '${w.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`).join('\n')}\n];\n\nexport const URDU_WORDLIST_SIZE = ${words.length};\n`;
  writeFileSync(OUT, header + '\n' + body, 'utf8');
  return OUT;
}

const { words, dropped, raw } = build(await loadSource());
const out = emit(words, { date: new Date().toISOString().slice(0, 10), dropped, raw });
console.log(`wrote ${out}: ${words.length} words (${dropped} dropped)`);
