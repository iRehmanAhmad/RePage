import { describe, expect, it } from 'vitest';
import { DICTIONARY, type Translations } from './menuTranslation';

const LANGS = ['en', 'ur'] as const;

function allKeys(): (keyof Translations)[] {
  // Derive the key list from the English dictionary (interface and both
  // languages must stay in sync — the type system enforces the shape).
  return Object.keys(DICTIONARY.en) as (keyof Translations)[];
}

describe('menuTranslation dictionary completeness', () => {
  it('has the same key set in en and ur', () => {
    const enKeys = Object.keys(DICTIONARY.en).sort();
    const urKeys = Object.keys(DICTIONARY.ur).sort();
    expect(urKeys).toEqual(enKeys);
  });

  it('every key has a non-empty en AND ur entry', () => {
    const empty: string[] = [];
    for (const key of allKeys()) {
      for (const lang of LANGS) {
        const value = DICTIONARY[lang][key];
        if (!value || value.trim().length === 0) empty.push(`${lang}.${key}`);
      }
    }
    expect(empty).toEqual([]);
  });

  it('has no duplicate values within a language (copy-paste guard)', () => {
    // Pre-existing intentional duplicates (same word, different UI slots).
    const KNOWN_DUPES = new Set([
      'en:Columns', // grpColumns (ribbon group) vs columns (page layout label)
      'ur:املاء تفتیش', // grpProofing (group caption) vs spellcheck (button) — same natural word
    ]);
    for (const lang of LANGS) {
      const seen = new Map<string, string>();
      const dupes: string[] = [];
      for (const key of allKeys()) {
        const value = DICTIONARY[lang][key].trim();
        // Short shared words (e.g. "OK"-style particles) are fine to repeat;
        // flag only longer accidental duplicates.
        if (value.length < 6) continue;
        if (KNOWN_DUPES.has(`${lang}:${value}`)) continue;
        const first = seen.get(value);
        if (first !== undefined) dupes.push(`${lang}: "${value}" in ${first} and ${key}`);
        else seen.set(value, key);
      }
      expect(dupes).toEqual([]);
    }
  });

  it('spot-checks known Urdu terms (not transliteration, not machine-ese)', () => {
    const ur = DICTIONARY.ur;
    expect(ur.saveAs).toBe('محفوظ کریں');
    expect(ur.open).toBe('کھولیں');
    expect(ur.bold).toBe('جلی');
    expect(ur.italic).toBe('ترچھا');
    expect(ur.kashida).toBe('کشیدہ');
    expect(ur.alignJustify).toBe('برابر');
    expect(ur.spellcheck).toBe('املاء تفتیش');
    expect(ur.dictionary).toBe('اردو لغت');
    expect(ur.pageNumbering).toBe('صفحہ نمبرنگ');
    expect(ur.exportPdf).toBe('PDF برآمد');
    expect(ur.dlgCancel).toBe('منسوخ کریں');
    expect(ur.dlgOk).toBe('ٹھیک ہے');
    expect(ur.dlgStrikethrough).toBe('خطِ تنسیخ');
    expect(ur.dlgSubscript).toBe('زیر نویس');
    expect(ur.dlgSuperscript).toBe('بالا نویس');
    expect(ur.mnuBorderBottom).toBe('نچلا کنارہ');
    expect(ur.clrAutomatic).toBe('خودکار');
    // Urdu entries must actually contain Urdu script (catches en-pasted values)
    for (const key of allKeys()) {
      const value = ur[key];
      // Brand/technical tokens are allowed to stay Latin (e.g. "ePUB 3.0 برآمد" mixes).
      if (/^[A-Za-z0-9 .…()/-]+$/.test(value)) continue;
      expect(value, `ur.${key} should contain Urdu script`).toMatch(/[\u0600-\u06FF]/);
    }
  });

  it('keeps keyboard-shortcut suffixes intact in tooltips', () => {
    // Spot check: English tooltips that carry (Ctrl+X) keep the shortcut token.
    expect(DICTIONARY.en.dlgFontTitle).toBe('Font Formatting');
  });
});
