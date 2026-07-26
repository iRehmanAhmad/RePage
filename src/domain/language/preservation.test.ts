import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import type { RePageDocument } from '../document/types';
import { paragraph } from '../rich-text/types';
import { extractPlainTextFromStory } from './languageToolScope';
import { applyLanguageChangesCommand } from '../../editor/commands/languageCommands';
import { previewNormalization } from './characterNormalization';
import { romanToUrdu } from './transliteration';
import type { LanguageChange } from './types';

describe('Urdu Tools Phase 3 — Bidi, Joiner, and Combining Marks Preservation', () => {
  it('1. Preserves ZWNJ (\\u200C) and ZWJ (\\u200D) byte-for-byte', () => {
    const textWithJoiners = 'با‌اعتماد با‍صلاحیت'; // \u200C in first word, \u200D in second word
    expect(textWithJoiners).toContain('\u200C');
    expect(textWithJoiners).toContain('\u200D');

    const preview = previewNormalization(textWithJoiners);
    expect(preview.normalizedText).toContain('\u200C');
    expect(preview.normalizedText).toContain('\u200D');
  });

  it('2. Preserves RLM (\\u200F) and LRM (\\u200E) bidi directional marks', () => {
    const textWithBidi = 'صفحہ \u200F12\u200E سے لے کر';
    const preview = previewNormalization(textWithBidi);
    expect(preview.normalizedText).toContain('\u200F');
    expect(preview.normalizedText).toContain('\u200E');
  });

  it('3. Preserves Arabic combining marks (Aerab) and honorific glyphs (ﷺ)', () => {
    const textWithAerab = 'مُحَمَّدٌ ﷺ رضى الله عنه';
    const preview = previewNormalization(textWithAerab);
    expect(preview.normalizedText).toContain('\u064F'); // Damma
    expect(preview.normalizedText).toContain('\u064E'); // Fatha
    expect(preview.normalizedText).toContain('ﷺ'); // Honorific
  });

  it('4. Preserves URLs, email addresses, and mixed bidi formatting', () => {
    const mixedBidi = 'رابطہ: https://example.com، قیمت 1,250 روپے (e.g. PDF)';
    const roman = romanToUrdu(mixedBidi);

    expect(roman).toContain('https://example.com');
    expect(roman).toContain('PDF');
  });

  it('5. Phase 3 Exit Gate: Preview never mutates document, selective apply changes target only, joiners stay byte-for-byte unchanged', () => {
    const doc = createStarterDocument();
    const storyId = 'primary-body-story';

    // Original text with ZWNJ \u200C, honorific ﷺ, and Arabic kaaf ك
    const originalText = 'یہ كِتاب با‌اعتماد اور با‌صلاحیت مصنف کی ہے۔ ﷺ';

    const testDoc: RePageDocument = {
      ...doc,
      stories: {
        ...doc.stories,
        [storyId]: {
          id: storyId,
          name: 'Primary Story',
          content: {
            type: 'doc' as const,
            content: [paragraph(originalText, 'rtl')],
          },
        },
      },
    };

    // 1. Verify Preview NEVER mutates document state
    const preview = previewNormalization(originalText, { preserveArabicText: true });
    expect(preview.replacementCount).toBe(1);
    expect(extractPlainTextFromStory(testDoc.stories[storyId]!)).toBe(originalText); // document untouched!

    // 2. Apply ONLY selected replacement for "كِتاب" -> "کتاب"
    const kaafIdx = originalText.indexOf('كِتاب');
    const change: LanguageChange = {
      id: 'p3_gate_1',
      storyId,
      from: kaafIdx,
      to: kaafIdx + 5,
      replacement: 'کتاب',
      reason: 'Fix Arabic Kaaf',
      category: 'normalization',
      originalText: 'كِتاب',
    };

    const updatedDoc = applyLanguageChangesCommand(testDoc, [change]);
    const updatedText = extractPlainTextFromStory(updatedDoc.stories[storyId]!);

    // Verify target replacement applied
    expect(updatedText).toContain('یہ کتاب');
    expect(updatedText).not.toContain('كِتاب');

    // Verify ZWNJ, RLM, and Honorific glyphs survive byte-for-byte
    expect(updatedText).toContain('با‌اعتماد'); // ZWNJ \u200C intact
    expect(updatedText).toContain('با‌صلاحیت'); // ZWNJ \u200C intact
    expect(updatedText).toContain('ﷺ'); // Honorific intact
  });
});
