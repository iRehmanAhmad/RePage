import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import type { RePageDocument } from '../domain/document/types';
import { paragraph } from '../domain/rich-text/types';
import { extractPlainTextFromStory, getScopeSpans } from '../domain/language/languageToolScope';
import { applyLanguageChangesCommand } from '../editor/commands/languageCommands';
import { TransactionHistory } from '../editor/history/transactionHistory';
import { createUrdupPackage, readUrdupPackage } from '../persistence/package/urdupPackage';
import type { LanguageChange } from '../domain/language/types';

describe('Urdu Tools Phase 1 — Document Selection & Scope Integration Gate', () => {
  it('1. Extracts scope spans accurately for Selection vs Story vs Document', () => {
    const doc = createStarterDocument();
    const storyId = 'primary-body-story';

    // Selection scope
    const selectionSpans = getScopeSpans(doc, {
      kind: 'selection',
      storyId,
      from: 0,
      to: 5,
    });
    expect(selectionSpans.length).toBe(1);
    expect(selectionSpans[0]?.scopeFrom).toBe(0);
    expect(selectionSpans[0]?.scopeTo).toBe(5);

    // Whole Document scope
    const docSpans = getScopeSpans(doc, { kind: 'document' });
    expect(docSpans.length).toBeGreaterThan(0);
  });

  it('2. Phase 1 Exit Gate: Selects كِتاب, normalizes to کتاب under Selection scope, verifies single occurrence change, undo/redo, package round-trip', async () => {
    const history = new TransactionHistory();
    let doc = createStarterDocument();
    const storyId = 'primary-body-story';

    // Text containing two instances of Arabic kaaf: "یہ كِتاب بہت با‌اثر كِتاب ہے۔"
    const textWithTwoArabicKaaf = 'یہ كِتاب بہت با‌اثر كِتاب ہے۔';

    const testDoc: RePageDocument = {
      ...doc,
      stories: {
        ...doc.stories,
        [storyId]: {
          id: storyId,
          name: 'Primary Story',
          content: {
            type: 'doc' as const,
            content: [paragraph(textWithTwoArabicKaaf, 'rtl')],
          },
        },
      },
    };

    doc = testDoc;
    history.push(doc, 'Initial document state');

    const fullText = extractPlainTextFromStory(doc.stories[storyId]!);
    expect(fullText).toBe(textWithTwoArabicKaaf);

    // First instance of "كِتاب" starts at index 3..8
    const firstKaafIndex = fullText.indexOf('كِتاب');
    expect(firstKaafIndex).toBe(3);

    // Second instance starts at index 20..25
    const secondKaafIndex = fullText.indexOf('كِتاب', 9);
    expect(secondKaafIndex).toBeGreaterThan(15);

    // Create a LanguageChange targeting ONLY the first selection: [3..8]
    const selectionChange: LanguageChange = {
      id: 'p1_change_1',
      storyId,
      from: firstKaafIndex,
      to: firstKaafIndex + 5,
      replacement: 'کتاب',
      reason: 'Arabic Kaaf to Urdu (Selection Scope)',
      category: 'normalization',
      originalText: 'كِتاب',
    };

    // Apply change
    doc = applyLanguageChangesCommand(doc, [selectionChange]);
    const modifiedText = extractPlainTextFromStory(doc.stories[storyId]!);

    // Verify ONLY the first instance was changed to "کتاب", second instance remains "كِتاب"
    expect(modifiedText).toContain('یہ کتاب');
    expect(modifiedText).toContain('با‌اثر كِتاب'); // second occurrence untouched!

    // Undo check
    const undoneDoc = history.undo(doc);
    expect(undoneDoc).not.toBeNull();
    const undoneText = extractPlainTextFromStory(undoneDoc!.stories[storyId]!);
    expect(undoneText).toBe(textWithTwoArabicKaaf);

    // Redo check
    const redoneDoc = history.redo(undoneDoc!);
    expect(redoneDoc).not.toBeNull();
    let finalDoc = redoneDoc!;
    const redoneText = extractPlainTextFromStory(finalDoc.stories[storyId]!);
    expect(redoneText).toBe(modifiedText);

    // .urdup Package save and reopen check
    const pkgBytes = await createUrdupPackage(finalDoc);
    expect(pkgBytes.length).toBeGreaterThan(0);

    const reopenedDoc = await readUrdupPackage(pkgBytes);
    const reopenedText = extractPlainTextFromStory(reopenedDoc.stories[storyId]!);
    expect(reopenedText).toBe(modifiedText);
    expect(reopenedText).toContain('با‌اثر'); // ZWNJ intact
  });
});
