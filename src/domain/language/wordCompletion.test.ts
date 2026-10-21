import { describe, expect, it } from 'vitest';
import { getCompletions, isCompletablePrefix } from './wordCompletion';
import { buildDocumentVocabulary } from './textAssistSettings';
import { createDocument } from '../document/createDocument';

describe('isCompletablePrefix', () => {
  it('requires 3+ chars, one script, no digits', () => {
    expect(isCompletablePrefix('go')).toBe(false);
    expect(isCompletablePrefix('gov')).toBe(true);
    expect(isCompletablePrefix('abc123')).toBe(false);
    expect(isCompletablePrefix('abا')).toBe(false);
    expect(isCompletablePrefix('پاک')).toBe(true);
    expect(isCompletablePrefix('')).toBe(false);
  });
});

describe('getCompletions — Latin', () => {
  it('suggests frequency-head words for a prefix', () => {
    const results = getCompletions('gov');
    expect(results).toContain('government');
    expect(results.length).toBeLessThanOrEqual(6);
    expect(results.every((w) => w.toLowerCase().startsWith('gov'))).toBe(true);
  });

  it('never suggests the exact word already typed', () => {
    expect(getCompletions('the')).not.toContain('the');
    expect(getCompletions('government')).not.toContain('government');
  });

  it('returns nothing for short or numeric prefixes', () => {
    expect(getCompletions('go')).toEqual([]);
    expect(getCompletions('a1b')).toEqual([]);
    expect(getCompletions('123')).toEqual([]);
  });

  it('document vocabulary wins over dictionary order', () => {
    const vocab = [
      { word: 'governance', count: 4 },
      { word: 'government', count: 1 },
    ];
    const results = getCompletions('gov', vocab);
    expect(results[0]).toBe('governance');
  });

  it('document words are deduped against dictionary words', () => {
    const vocab = [{ word: 'government', count: 2 }];
    const results = getCompletions('gov', vocab);
    expect(results.filter((w) => w === 'government')).toHaveLength(1);
    expect(results[0]).toBe('government');
  });

  it('matches the typed capitalization pattern', () => {
    expect(getCompletions('Gov')).toContain('Government');
    const vocab = [{ word: 'governance', count: 1 }];
    expect(getCompletions('Gov', vocab)[0]).toBe('governance');
  });
});

describe('getCompletions — Urdu', () => {
  it('suggests dictionary words for an Arabic prefix', () => {
    const results = getCompletions('پاک');
    expect(results).toContain('پاکستان');
    expect(results.every((w) => w.startsWith('پاک'))).toBe(true);
  });

  it('document vocabulary comes first for Urdu too', () => {
    const vocab = [{ word: 'پاکستانی', count: 3 }];
    const results = getCompletions('پاک', vocab);
    expect(results[0]).toBe('پاکستانی');
  });

  it('a prefix with aerab only completes from the document (no unsafe slicing)', () => {
    const dirty = 'مُح'; // مُح — with pesh (U+064F)
    expect(getCompletions(dirty)).toEqual([]);
    const vocab = [{ word: 'مُحمد', count: 1 }];
    expect(getCompletions(dirty, vocab)).toEqual(['مُحمد']);
  });
});

describe('buildDocumentVocabulary', () => {
  it('counts words across stories, keyed per script', () => {
    const doc = createDocument('t');
    const storyId = Object.keys(doc.stories)[0]!;
    const story = doc.stories[storyId]!;
    const vocab = buildDocumentVocabulary({
      ...doc,
      stories: {
        [storyId]: {
          ...story,
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Government school government اسکول اسکول کتاب' },
                ],
              },
            ],
          },
        },
      },
    });
    const gov = vocab.find((v) => v.word === 'Government');
    expect(gov?.count).toBe(2);
    const schoolUr = vocab.find((v) => v.word === 'اسکول');
    expect(schoolUr?.count).toBe(2);
    // Words under 3 chars never enter the vocabulary.
    expect(vocab.some((v) => v.word.length < 3)).toBe(false);
  });
});
