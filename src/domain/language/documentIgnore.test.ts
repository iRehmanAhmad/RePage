import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import {
  addDocumentIgnoredWordCommand,
  clearDocumentIgnoredWordsCommand,
  removeDocumentIgnoredWordCommand,
} from '../../editor/commands/languageCommands';
import { parseDocument } from '../document/schema';
import {
  checkUrduText,
  findMisspelledRanges,
  isSpellingCorrect,
} from './urduSpellchecker';

// 'پکستان' is a genuine misspelling (absent from the vendored dictionaries);
// 'recieve' is a genuine English typo. Neither is session-ignored or in the
// personal dictionary in the test environment.
const URDU_TEXT = 'پاکستان پکستان خوبصورت ملک ہے';
const ENGLISH_TEXT = 'Please recieve this letter';

describe('per-document spellcheck ignore (engine options)', () => {
  it('flags the words when no document ignore list is given', () => {
    expect(findMisspelledRanges(URDU_TEXT).some((r) => r.word === 'پکستان')).toBe(true);
    expect(findMisspelledRanges(ENGLISH_TEXT).some((r) => r.word === 'recieve')).toBe(true);
    expect(isSpellingCorrect('پکستان')).toBe(false);
    expect(isSpellingCorrect('recieve')).toBe(false);
  });

  it('suppresses Urdu words listed in the document ignore list', () => {
    const ranges = findMisspelledRanges(URDU_TEXT, { documentIgnoredWords: ['پکستان'] });
    expect(ranges.some((r) => r.word === 'پکستان')).toBe(false);
    expect(isSpellingCorrect('پکستان', { documentIgnoredWords: ['پکستان'] })).toBe(true);
    // Correct words are unaffected either way.
    expect(isSpellingCorrect('پاکستان', { documentIgnoredWords: ['پکستان'] })).toBe(true);
  });

  it('suppresses English words listed in the document ignore list', () => {
    const errors = checkUrduText(ENGLISH_TEXT, { documentIgnoredWords: ['recieve'] });
    expect(errors.some((e) => e.word === 'recieve')).toBe(false);
    // Teaches case-insensitively, like the rest of the English checker.
    expect(isSpellingCorrect('Recieve', { documentIgnoredWords: ['recieve'] })).toBe(true);
  });

  it('does not leak into a document without the ignore (two-document isolation)', () => {
    const withIgnore = findMisspelledRanges(URDU_TEXT, { documentIgnoredWords: ['پکستان'] });
    const withoutIgnore = findMisspelledRanges(URDU_TEXT, { documentIgnoredWords: [] });
    const otherDocument = findMisspelledRanges(URDU_TEXT);
    expect(withIgnore).toHaveLength(0);
    expect(withoutIgnore.some((r) => r.word === 'پکستان')).toBe(true);
    expect(otherDocument.some((r) => r.word === 'پکستان')).toBe(true);
  });
});

describe('document ignore commands', () => {
  it('adds, deduplicates, removes and clears words in document metadata', () => {
    const doc = createStarterDocument();
    const one = addDocumentIgnoredWordCommand(doc, 'پکستان');
    expect(one.metadata.spellcheckIgnoredWords).toEqual(['پکستان']);
    expect(doc.metadata.spellcheckIgnoredWords).toBeUndefined();

    const dup = addDocumentIgnoredWordCommand(one, 'پکستان');
    expect(dup).toBe(one);

    const two = addDocumentIgnoredWordCommand(one, 'recieve');
    expect(two.metadata.spellcheckIgnoredWords).toEqual(['پکستان', 'recieve']);

    const removed = removeDocumentIgnoredWordCommand(two, 'پکستان');
    expect(removed.metadata.spellcheckIgnoredWords).toEqual(['recieve']);

    const cleared = clearDocumentIgnoredWordsCommand(removed);
    expect(cleared.metadata.spellcheckIgnoredWords).toBeUndefined();
    // Clearing an already-empty list is a no-op.
    expect(clearDocumentIgnoredWordsCommand(cleared)).toBe(cleared);
  });

  it('end to end: a word ignored in one document is still flagged in another', () => {
    const docA = addDocumentIgnoredWordCommand(createStarterDocument(), 'پکستان');
    const docB = createStarterDocument();

    expect(
      checkUrduText(URDU_TEXT, { documentIgnoredWords: docA.metadata.spellcheckIgnoredWords }),
    ).toHaveLength(0);
    expect(
      checkUrduText(URDU_TEXT, { documentIgnoredWords: docB.metadata.spellcheckIgnoredWords })
        .some((e) => e.word === 'پکستان'),
    ).toBe(true);

    // Clearing the list restores flagging in that same document.
    const cleared = clearDocumentIgnoredWordsCommand(docA);
    expect(
      checkUrduText(URDU_TEXT, { documentIgnoredWords: cleared.metadata.spellcheckIgnoredWords })
        .some((e) => e.word === 'پکستان'),
    ).toBe(true);
  });

  it('round-trips through parseDocument (save/load safety)', () => {
    const doc = addDocumentIgnoredWordCommand(createStarterDocument(), 'recieve');
    const parsed = parseDocument(JSON.parse(JSON.stringify(doc)));
    expect(parsed.metadata.spellcheckIgnoredWords).toEqual(['recieve']);
  });
});
