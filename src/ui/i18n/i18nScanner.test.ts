import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * Ratchet test: no NEW hardcoded user-facing string literals may appear in
 * src/ui or src/app. Every user-facing string must come from the i18n
 * dictionary (menuTranslation.ts) or the file-local `lang === 'ur'` ternary.
 *
 * Legitimate leftovers (paper sizes, font names, product names, bilingual
 * labels, code false-positives) are allowlisted below with reasons. The
 * allowlist may only shrink over time.
 */

// [string, reason]
const ALLOWLIST: Array<[string, string]> = [
  // Universal paper sizes — same in every language.
  ['0 pt', 'unit value'],
  ['6 × 9 in Book (152.4 × 228.6 mm)', 'paper size'],
  ['6×9 Book', 'paper size'],
  ['A3 (297 × 420 mm)', 'paper size'],
  ['A3 (297×420mm)', 'paper size'],
  ['A4', 'paper size'],
  ['A4 (210 × 297 mm)', 'paper size'],
  ['A4 (210×297mm)', 'paper size'],
  ['A5 (148 × 210 mm)', 'paper size'],
  ['A5 (148×210mm)', 'paper size'],
  ['Legal (8.5 × 14 in)', 'paper size'],
  ['Legal (8.5×14in)', 'paper size'],
  ['Letter (8.5 × 11 in)', 'paper size'],
  ['Letter (8.5×11in)', 'paper size'],
  // Font / style preset names — proper nouns of the preset.
  ['Amiri Arabic 18pt | Center | 1.8x', 'font preset name'],
  ['CRULP', 'keyboard layout name'],
  ['CRULP Phonetic (Standard Urdu)', 'keyboard layout name'],
  ['Navees', 'keyboard layout name'],
  ['Navees Phonetic', 'keyboard layout name'],
  ['Native', 'keyboard layout option'],
  ['Noto Nastaliq 13pt | Justify | 1.5x', 'font preset name'],
  ['Noto Nastaliq 14pt | Right | 1.5x', 'font preset name'],
  ['Noto Nastaliq 16pt | Center | 2.0x', 'font preset name'],
  ['Noto Nastaliq 22pt | Right | 1.3x', 'font preset name'],
  // Product / file names.
  ['RePage Studio', 'product name'],
  ['RePage_Document', 'default file name'],
  ['Urdu Publishing 1.0', 'product tagline'],
  // Language codes / names shown bilingually.
  ['EN', 'language code'],
  ['English (LTR Latin)', 'language name'],
  ['English (انگریزی)', 'bilingual language name'],
  ['Urdu Nastaliq (اردو)', 'bilingual language name'],
  ['Auto-detect Mixed (اردو + English)', 'bilingual option'],
  // Already-bilingual labels (Urdu primary, English gloss).
  ['DPI (رزولیوشن):', 'bilingual label'],
  ['Space (وقفہ)', 'bilingual label'],
  ['Selection Pane... (پینل انتخاب)', 'bilingual label'],
  ['اردو خطاطی کی نمائش — Quick Brown Fox', 'font preview pangram (deliberate)'],
  // Example / placeholder content, not chrome.
  ['e.g. shukriya pakistan...', 'example input text'],
  // Scanner false positives (code fragments matched by the JSX-text regex).
  ['maxPt || hPt', 'code fragment, not UI text'],
  ["Number(element.getAttribute('data-repage-margin-bottom')) || 42,", 'code fragment, not UI text'],
  ["Number(element.getAttribute('data-repage-margin-left')) || 42,", 'code fragment, not UI text'],
  ["Number(element.getAttribute('data-repage-margin-right')) || 42,", 'code fragment, not UI text'],
  ["Number(element.getAttribute('data-repage-margin-top')) || 42,", 'code fragment, not UI text'],
  ["Number(element.getAttribute('data-repage-page-height')) || 842,", 'code fragment, not UI text'],
  ["Number(element.getAttribute('data-repage-page-width')) || 595,", 'code fragment, not UI text'],
  ['renderHeadingNode(node))', 'code fragment, not UI text'],
  ['renderParagraph(p, idx))', 'code fragment, not UI text'],
  // Bilingual Urdu-first tooltips/labels (pre-existing pattern: Urdu primary,
  // English gloss in parentheses). Readable in Urdu mode; kept as-is to avoid
  // churning stable tooltips — the ratchet still blocks NEW hardcoded strings.
  ['تبصرے (Comments)', 'bilingual label (Urdu-first)'],
  ['کوئی تبصرہ نہیں (No comments found)', 'bilingual label (Urdu-first)'],
  ['اردو رسم الخط (Urdu Font Family)', 'bilingual tooltip (Urdu-first)'],
  ['انتخاب آلہ (Select Tool)', 'bilingual tooltip (Urdu-first)'],
  ['انپیج علی نستعلیق', 'font name'],
  ['انپیج لاہوری نستعلیق', 'font name'],
  ['برابر (Justify)', 'bilingual tooltip (Urdu-first)'],
  ['تصویر فریم (Image Frame Tool)', 'bilingual tooltip (Urdu-first)'],
  ['جمیل نوری نستعلیق', 'font name'],
  ['دائیں (Right Alignment)', 'bilingual tooltip (Urdu-first)'],
  ['دوبارہ کریں (Redo Ctrl+Y)', 'bilingual tooltip (Urdu-first)'],
  ['فونٹ کا سائز (Font Size pt)', 'bilingual tooltip (Urdu-first)'],
  ['متن فریم (Text Frame Tool)', 'bilingual tooltip (Urdu-first)'],
  ['مرکز (Center Alignment)', 'bilingual tooltip (Urdu-first)'],
  ['مستطیل شکل (Rectangle Tool)', 'bilingual tooltip (Urdu-first)'],
  ['منسوخ کریں (Undo Ctrl+Z)', 'bilingual tooltip (Urdu-first)'],
  ['نستعلیق (Noto Nastaliq)', 'bilingual tooltip (Urdu-first)'],
  ['کشیدہ کشش (Kashida Justification)', 'bilingual tooltip (Urdu-first)'],
  ['گلزار (Gulzar)', 'font name'],
  ['ابجد (ا، ب، ج)', 'numbering style name'],
  ['اردو (۰، ۱، ۲)', 'numbering style name'],
  ['اردو پیراگراف کی لائیو نمائش۔ یہ نمائش جدید انپیج اور ایم ایس ورڈ کے مطابق بہترین پیراگراف فارمیٹنگ فراہم کرتی ہے۔', 'already Urdu'],
  ['اردو رسم الخط اور اسٹائلز کا نمونہ', 'already Urdu'],
  ['جدول منتقل کریں (Move Table)', 'bilingual label (Urdu-first)'],
  ['مکمل (Done)', 'bilingual label (Urdu-first)'],
  ['اعراب:', 'already Urdu'],
  ['تصحیح محفوظ کریں', 'already Urdu'],
  ['حذف کریں (Delete)', 'bilingual label (Urdu-first)'],
  ['محفوظ کریں (Save)', 'bilingual label (Urdu-first)'],
  ['منسوخ (Cancel)', 'bilingual label (Urdu-first)'],
  ['📄 عام تحریر (Standard Body)', 'style preset name (bilingual)'],
  ['📌 سرخی و عنوان (Headings & Titles)', 'style preset name (bilingual)'],
  ['📖 ناول و کالم (Justified Prose & Column)', 'style preset name (bilingual)'],
  ['📜 شاعری و نعت (Poetry & Verses)', 'style preset name (bilingual)'],
  ['🕌 آیات و اقتباس (Arabic & Citation)', 'style preset name (bilingual)'],
];

const ALLOW_SET = new Set(ALLOWLIST.map(([s]) => s));

function isAllowlisted(s: string): boolean {
  if (ALLOW_SET.has(s)) return true;
  // Multi-line code fragments: the flagged string contains the allowlisted snippet.
  for (const a of ALLOW_SET) if (s.includes(a)) return true;
  return false;
}

function dictionaryValues(): Set<string> {
  const p = path.resolve(HERE, 'menuTranslation.ts');
  const src = fs.readFileSync(p, 'utf-8');
  const vals = new Set<string>();
  for (const m of src.matchAll(/:\s*'((?:[^'\\]|\\.)*)'/g)) {
    const v = (m[1] ?? '').trim();
    if (v) vals.add(v);
  }
  return vals;
}

function looksUserFacing(s: string, dictVals: Set<string>): boolean {
  s = s.trim();
  if (s.length < 2 || dictVals.has(s)) return false;
  if (!/[A-Za-z\u0600-\u06FF]/.test(s)) return false;
  if (/[{}[\];=]/.test(s)) return false;
  if (/^https?:\/\/|^www\.|^[/\\][\w./\\-]+\.\w+/.test(s)) return false;
  return (
    s.includes(' ') || /^[A-Z\u0600-\u06FF]/.test(s) || s.length > 20
  );
}

function scanFile(rel: string, dictVals: Set<string>): string[] {
  const full = path.resolve(HERE, '..', '..', rel);
  let src: string;
  try {
    src = fs.readFileSync(full, 'utf-8');
  } catch {
    return [];
  }
  src = src.replace(/\/\/[^\n]*/g, '');
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const found: string[] = [];
  for (const m of src.matchAll(/>([^<>{}]+)</g)) {
    const s = (m[1] ?? '').trim();
    if (looksUserFacing(s, dictVals) && !isAllowlisted(s)) found.push(s);
  }
  for (const m of src.matchAll(/(?:title|placeholder|aria-label|alt|label)=["']([^"']+)["']/g)) {
    const s = (m[1] ?? '').trim();
    if (looksUserFacing(s, dictVals) && !isAllowlisted(s)) found.push(s);
  }
  return [...new Set(found)].map((s) => `${rel}: ${s}`);
}

function allTsx(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.tsx') && !e.name.endsWith('.test.tsx')) {
        out.push(path.relative(path.resolve(HERE, '..', '..'), p));
      }
    }
  };
  walk(path.resolve(HERE, '..', '..', dir));
  return out;
}

describe('i18n hardcoded-literal scanner (ratchet)', () => {
  it('has no un-allowlisted hardcoded UI strings in src/ui and src/app', () => {
    const dictVals = dictionaryValues();
    const offenders: string[] = [];
    for (const dir of ['ui', 'app']) {
      for (const rel of allTsx(dir)) offenders.push(...scanFile(rel, dictVals));
    }
    expect(
      offenders,
      offenders.length
        ? `Hardcoded UI strings must use the i18n dictionary:\n${offenders.join('\n')}`
        : undefined,
    ).toEqual([]);
  });

  it('allowlist only references strings that still exist', () => {
    // Guards against a stale allowlist hiding nothing (dead entries).
    const dictVals = dictionaryValues();
    const seen = new Set<string>();
    for (const dir of ['ui', 'app']) {
      for (const rel of allTsx(dir)) {
        const full = path.resolve(HERE, '..', '..', rel);
        const src = fs.readFileSync(full, 'utf-8');
        for (const [s] of ALLOWLIST) if (src.includes(s)) seen.add(s);
      }
    }
    const dead = ALLOWLIST.map(([s]) => s).filter((s) => !seen.has(s) && !dictVals.has(s));
    expect(dead).toEqual([]);
  });
});
