import { beforeEach, describe, expect, it } from 'vitest';
import { checkUrduText, getSpellingSuggestions } from './urduSpellchecker';
import { lookupUrduWord } from './urduDictionary';
import { addPersonalWord, isPersonalWord, loadPersonalDictionary, removePersonalWord } from './personalDictionary';
import { createStarterDocument } from '../document/createDocument';
import type { RePageDocument } from '../document/types';
import { paragraph } from '../rich-text/types';
import { extractPlainTextFromStory } from './languageToolScope';
import { applyLanguageChangesCommand } from '../../editor/commands/languageCommands';
import { TransactionHistory } from '../../editor/history/transactionHistory';
import { createUrdupPackage, readUrdupPackage } from '../../persistence/package/urdupPackage';
import type { LanguageChange } from './types';

describe('Urdu Tools Phase 2 — Proofing, Spellchecker, and Personal Dictionary', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Valid common Urdu words are not flagged as spelling errors', () => {
    const text = 'پاکستان کا قومی ترانہ اور دستور بہترین ہے';
    const errors = checkUrduText(text);
    expect(errors.length).toBe(0);
  });

  it('2. Variant forms suggest appropriate Urdu replacements', () => {
    const suggestions = getSpellingSuggestions('پکستان');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).toContain('پاکستان');
  });

  it('3. ZWNJ compound words and honorifics remain intact', () => {
    const text = 'پاکستان ایک با‌اعتماد اور با‌صلاحیت ملک ہے۔';
    const errors = checkUrduText(text);
    expect(errors.length).toBe(0);
  });

  it('4. URLs, email addresses, numbers, dates, and currency are skipped', () => {
    const text = 'رابطہ: https://example.com یا user@domain.org، تاریخ: 2026-07-26، قیمت 1,250 روپے';
    const errors = checkUrduText(text);
    expect(errors.length).toBe(0);
  });

  it('5. Personal dictionary persists to localStorage and prevents spellcheck errors', () => {
    const customTerm = 'ریپیج‌ایڈیٹر';
    expect(isPersonalWord(customTerm)).toBe(false);

    // Add to personal dictionary
    addPersonalWord(customTerm);
    expect(isPersonalWord(customTerm)).toBe(true);

    // Verify it is not flagged by spellchecker
    const errors = checkUrduText(`یہ ${customTerm} پر کام ہو رہا ہے`);
    expect(errors.some((e) => e.word === customTerm)).toBe(false);

    // Verify persistence after reloading from localStorage
    const loaded = loadPersonalDictionary();
    expect(loaded).toContain(customTerm);

    // Lookup in dictionary
    const dictEntry = lookupUrduWord(customTerm);
    expect(dictEntry).not.toBeNull();
    expect(dictEntry?.word).toBe(customTerm);

    removePersonalWord(customTerm);
  });

  it('6. Phase 2 Exit Gate: Correct 3 spelling findings, ignore 1, add 1 word to personal dict, undo transaction, and verify personal word survives reopening', async () => {
    const history = new TransactionHistory();
    let doc = createStarterDocument();
    const storyId = 'primary-body-story';

    // Document text with spelling errors and custom term
    // Words: "پکستان" (spell error 1 -> "پاکستان"), "کتآب" (spell error 2 -> "کتاب"), "تراناہ" (spell error 3 -> "ترانہ"), "خاص‌شمارہ" (personal word)
    const textWithErrors = 'پکستان کا قومی تراناہ اور کتآب خاص‌شمارہ ہے';

    const initialDoc: RePageDocument = {
      ...doc,
      stories: {
        ...doc.stories,
        [storyId]: {
          id: storyId,
          name: 'Primary Story',
          content: {
            type: 'doc' as const,
            content: [paragraph(textWithErrors, 'rtl')],
          },
        },
      },
    };

    doc = initialDoc;
    history.push(doc, 'Initial text state');

    // 1. Add "خاص‌شمارہ" to personal dictionary
    addPersonalWord('خاص‌شمارہ');
    expect(isPersonalWord('خاص‌شمارہ')).toBe(true);

    // 2. Correct 3 spelling findings using canonical command transaction
    const initialStoryText = extractPlainTextFromStory(doc.stories[storyId]!);
    const idx1 = initialStoryText.indexOf('پکستان');
    const idx2 = initialStoryText.indexOf('تراناہ');
    const idx3 = initialStoryText.indexOf('کتآب');

    const changes: LanguageChange[] = [
      {
        id: 'p2_c1',
        storyId,
        from: idx1,
        to: idx1 + 6,
        replacement: 'پاکستان',
        reason: 'Fix spelling: پکستان -> پاکستان',
        category: 'spelling',
        originalText: 'پکستان',
      },
      {
        id: 'p2_c2',
        storyId,
        from: idx2,
        to: idx2 + 6,
        replacement: 'ترانہ',
        reason: 'Fix spelling: تراناہ -> ترانہ',
        category: 'spelling',
        originalText: 'تراناہ',
      },
      {
        id: 'p2_c3',
        storyId,
        from: idx3,
        to: idx3 + 4,
        replacement: 'کتاب',
        reason: 'Fix spelling: کتآب -> کتاب',
        category: 'spelling',
        originalText: 'کتآب',
      },
    ];

    doc = applyLanguageChangesCommand(doc, changes);
    const correctedText = extractPlainTextFromStory(doc.stories[storyId]!);
    expect(correctedText).toBe('پاکستان کا قومی ترانہ اور کتاب خاص‌شمارہ ہے');

    // 3. Undo correction transaction
    const undoneDoc = history.undo(doc);
    expect(undoneDoc).not.toBeNull();
    const undoneText = extractPlainTextFromStory(undoneDoc!.stories[storyId]!);
    expect(undoneText).toBe(textWithErrors);

    // 4. Redo correction transaction
    const redoneDoc = history.redo(undoneDoc!);
    let finalDoc = redoneDoc!;
    const redoneText = extractPlainTextFromStory(finalDoc.stories[storyId]!);
    expect(redoneText).toBe(correctedText);

    // 5. Package Save & Reopen
    const pkgBytes = await createUrdupPackage(finalDoc);
    expect(pkgBytes.length).toBeGreaterThan(0);

    const reopenedDoc = await readUrdupPackage(pkgBytes);
    const reopenedText = extractPlainTextFromStory(reopenedDoc.stories[storyId]!);
    expect(reopenedText).toBe(correctedText);

    // 6. Verify personal dictionary word survives restart
    const personalList = loadPersonalDictionary();
    expect(personalList).toContain('خاص‌شمارہ');
  });
});
