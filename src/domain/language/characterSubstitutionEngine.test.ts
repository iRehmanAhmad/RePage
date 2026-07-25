import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import {
  correctUrduPunctuation,
  substituteArabicCharacters,
  substituteDocumentCharacters,
} from './characterSubstitutionEngine';

describe('characterSubstitutionEngine (Phase UX-6)', () => {
  it('replaces Arabic character variants with native Urdu characters', () => {
    // Legacy text containing Arabic Kaf (ك) and Arabic Yeh (ي)
    const arabicText = 'كتاب يہ ہے';
    const sub = substituteArabicCharacters(arabicText);

    expect(sub.text).toBe('کتاب یہ ہے');
    expect(sub.replacementsCount).toBe(2);
  });

  it('corrects English punctuation in Urdu context', () => {
    const textWithEnglishPunct = 'آپ کا نام کیا ہے?';
    const sub = correctUrduPunctuation(textWithEnglishPunct);

    expect(sub.text).toBe('آپ کا نام کیا ہے؟');
    expect(sub.replacementsCount).toBeGreaterThan(0);
  });

  it('substitutes characters across canonical document stories', () => {
    const doc = createStarterDocument();
    const result = substituteDocumentCharacters(doc);

    expect(result.doc).toBeDefined();
    expect(result.arabicReplacements).toBeGreaterThanOrEqual(0);
  });
});
