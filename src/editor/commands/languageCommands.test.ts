import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { paragraph } from '../../domain/rich-text/types';
import { TransactionHistory } from '../history/transactionHistory';
import { createUrdupPackage, readUrdupPackage } from '../../persistence/package/urdupPackage';
import { applyLanguageChangesCommand, replaceRangeInStory } from './languageCommands';
import { extractPlainTextFromStory, getScopeSpans, validateLanguageChange } from '../../domain/language/languageToolScope';
import type { LanguageChange } from '../../domain/language/types';

describe('Urdu Tools Phase 0 — Safe Language Mutation Command Foundation', () => {
  it('1. Extracts plain text from story and resolves scope spans', () => {
    const doc = createStarterDocument();
    const primaryStory = doc.stories['primary-body-story']!;
    const text = extractPlainTextFromStory(primaryStory);
    expect(typeof text).toBe('string');

    const spans = getScopeSpans(doc, { kind: 'document' });
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0]?.storyId).toBe('primary-body-story');
  });

  it('2. Replaces range in story preserving rich text marks and Urdu joiners', () => {
    const storyId = 'primary-body-story';

    // Create a story with rich text marks and ZWNJ (‌)
    const customStory: import('../../domain/document/types').TextStory = {
      id: storyId,
      name: 'Test Story',
      content: {
        type: 'doc',
        content: [
          paragraph('پاکِستان', 'rtl'), // with aerab
          {
            type: 'paragraph',
            direction: 'rtl',
            content: [
              {
                type: 'text',
                text: 'یہ كِتاب ', // contains Arabic kaaf (ك)
                marks: [{ type: 'bold' }, { type: 'color', color: '#0284c7' }],
              },
              {
                type: 'text',
                text: 'سب سے با‌اثر ہے۔', // contains ZWNJ \u200C inside با‌اثر
                marks: [{ type: 'italic' }],
              },
            ],
          },
        ],
      },
    };

    const initialText = extractPlainTextFromStory(customStory);
    expect(initialText).toContain('كِتاب');
    expect(initialText).toContain('با‌اثر');

    // Replace كِتاب with کتاب at exact offset
    const targetIdx = initialText.indexOf('كِتاب');
    expect(targetIdx).toBeGreaterThan(-1);

    const updatedStory = replaceRangeInStory(customStory, targetIdx, targetIdx + 5, 'کتاب');
    const updatedText = extractPlainTextFromStory(updatedStory);

    expect(updatedText).toContain('کتاب');
    expect(updatedText).not.toContain('كِتاب');
    expect(updatedText).toContain('با‌اثر'); // ZWNJ intact

    // Check that rich text marks on the paragraph run survived
    const p1 = updatedStory.content.content[1];
    expect(p1).toBeDefined();
    const run1 = p1?.content?.[0];
    expect(run1?.type).toBe('text');
    if (run1?.type === 'text') {
      expect(run1.marks).toEqual([{ type: 'bold' }, { type: 'color', color: '#0284c7' }]);
    }
  });

  it('3. Applies batch changes in reverse offset order so multi-replacements stay valid', () => {
    const doc = createStarterDocument();
    const storyId = 'primary-body-story';

    const testDoc = {
      ...doc,
      stories: {
        ...doc.stories,
        [storyId]: {
          id: storyId,
          name: 'Primary Story',
          content: {
            type: 'doc' as const,
            content: [paragraph('عربى كِتاب اور يہ ترانہ', 'rtl')],
          },
        },
      },
    };

    const text = extractPlainTextFromStory(testDoc.stories[storyId]!);
    // Text: "عربى كِتاب اور يہ ترانہ"
    // "عربى" at 0..4 (should become "عربی")
    // "كِتاب" at 5..10 (should become "کتاب")
    // "يہ" at 15..17 (should become "یہ")

    const idxArabicYaa = text.indexOf('عربى');
    const idxArabicKaaf = text.indexOf('كِتاب');
    const idxArabicHeh = text.indexOf('يہ');

    const changes: LanguageChange[] = [
      {
        id: 'c1',
        storyId,
        from: idxArabicYaa,
        to: idxArabicYaa + 4,
        replacement: 'عربی',
        reason: 'Fix Arabic Yaa variant',
        category: 'character-fix',
        originalText: 'عربى',
      },
      {
        id: 'c2',
        storyId,
        from: idxArabicKaaf,
        to: idxArabicKaaf + 5,
        replacement: 'کتاب',
        reason: 'Fix Arabic Kaaf and Aerab',
        category: 'character-fix',
        originalText: 'كِتاب',
      },
      {
        id: 'c3',
        storyId,
        from: idxArabicHeh,
        to: idxArabicHeh + 2,
        replacement: 'یہ',
        reason: 'Fix Arabic Yaa variant',
        category: 'character-fix',
        originalText: 'يہ',
      },
    ];

    const resultDoc = applyLanguageChangesCommand(testDoc, changes);
    const resultText = extractPlainTextFromStory(resultDoc.stories[storyId]!);

    expect(resultText).toBe('عربی کتاب اور یہ ترانہ');
  });

  it('4. Rejects stale changes safely if target text changed', () => {
    const doc = createStarterDocument();
    const storyId = 'primary-body-story';

    const staleChange: LanguageChange[] = [
      {
        id: 'stale-1',
        storyId,
        from: 0,
        to: 5,
        replacement: 'نیا متن',
        reason: 'Stale fix',
        category: 'spelling',
        originalText: 'غير موجود متن', // text doesn't match
      },
    ];

    expect(validateLanguageChange(doc, staleChange[0]!)).toBe(false);

    const resultDoc = applyLanguageChangesCommand(doc, staleChange);
    expect(resultDoc).toBe(doc); // returned unchanged
  });

  it('5. Phase 0 Exit Gate: Apply change -> Undo -> Redo -> Package Save & Reopen Urdu integrity', async () => {
    const history = new TransactionHistory();
    let doc = createStarterDocument();
    const storyId = 'primary-body-story';

    // Set document story content with Urdu ZWNJ and honorifics (ﷺ)
    const urduTextWithMarks = 'پاکستان ایک با‌اعتماد اور با‌صلاحیت ملک ہے۔ ﷺ';
    doc = {
      ...doc,
      stories: {
        ...doc.stories,
        [storyId]: {
          id: storyId,
          name: 'Primary Story',
          content: {
            type: 'doc' as const,
            content: [paragraph(urduTextWithMarks, 'rtl')],
          },
        },
      },
    };

    const initialText = extractPlainTextFromStory(doc.stories[storyId]!);
    expect(initialText).toBe(urduTextWithMarks);

    // Save initial state for undo
    history.push(doc, 'Initial state');

    // Create a change: replace "ملک" with "جمہوریہ"
    const targetIdx = urduTextWithMarks.indexOf('ملک');
    expect(targetIdx).toBeGreaterThan(-1);

    const change: LanguageChange = {
      id: 'change-gate-1',
      storyId,
      from: targetIdx,
      to: targetIdx + 3,
      replacement: 'جمہوریہ',
      reason: 'Replace ملک with جمہوریہ',
      category: 'proofread',
      originalText: 'ملک',
    };

    // Apply change via canonical command
    doc = applyLanguageChangesCommand(doc, [change]);
    const modifiedText = extractPlainTextFromStory(doc.stories[storyId]!);
    expect(modifiedText).toContain('جمہوریہ');
    expect(modifiedText).not.toContain('ملک');
    expect(modifiedText).toContain('با‌اعتماد'); // ZWNJ intact
    expect(modifiedText).toContain('ﷺ'); // honorific intact

    // Undo transaction
    const undoneDoc = history.undo(doc);
    expect(undoneDoc).not.toBeNull();
    if (undoneDoc) {
      const undoneText = extractPlainTextFromStory(undoneDoc.stories[storyId]!);
      expect(undoneText).toBe(urduTextWithMarks);
    }

    // Redo transaction
    const redoneDoc = history.redo(undoneDoc!);
    expect(redoneDoc).not.toBeNull();
    let finalDoc = redoneDoc!;
    const redoneText = extractPlainTextFromStory(finalDoc.stories[storyId]!);
    expect(redoneText).toContain('جمہوریہ');

    // .urdup Package save and reopen serialization check
    const packageBytes = await createUrdupPackage(finalDoc);
    expect(packageBytes.length).toBeGreaterThan(0);

    const reopenedDoc = await readUrdupPackage(packageBytes);
    const reopenedText = extractPlainTextFromStory(reopenedDoc.stories[storyId]!);

    expect(reopenedText).toBe(modifiedText);
    expect(reopenedText).toContain('با‌اعتماد'); // ZWNJ preserved after package round-trip
    expect(reopenedText).toContain('ﷺ'); // honorific preserved
  });
});
