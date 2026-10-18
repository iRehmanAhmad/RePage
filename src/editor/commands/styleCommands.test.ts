import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { paragraph } from '../../domain/rich-text/types';
import type { RePageDocument, TextStory } from '../../domain/document/types';
import {
  applyStyleToStory,
  findStyleInstances,
  getStyleDisplayName,
  GALLERY_STYLE_IDS,
  URDU_STYLE_PRESETS,
} from './styleCommands';

function docWithStory(paragraphs: string[]): { doc: RePageDocument; storyId: string } {
  const rawDoc = createStarterDocument();
  const storyId = Object.keys(rawDoc.stories)[0]!;
  const story = rawDoc.stories[storyId]!;
  const updatedStory: TextStory = {
    ...story,
    content: { type: 'doc', content: paragraphs.map((t) => paragraph(t)) },
  };
  const doc: RePageDocument = {
    ...rawDoc,
    stories: { ...rawDoc.stories, [storyId]: updatedStory },
  };
  return { doc, storyId };
}

describe('applyStyleToStory', () => {
  it('stamps every paragraph with the applied styleId', () => {
    const { doc, storyId } = docWithStory(['پہلا', 'دوسرا']);
    const next = applyStyleToStory(doc, storyId, 'poetry');
    const paras = next.stories[storyId]!.content.content;
    expect(paras).toHaveLength(2);
    for (const p of paras) {
      expect(p.styleId).toBe('poetry');
      expect(p.alignment).toBe(URDU_STYLE_PRESETS['poetry']!.alignment);
    }
    // Original document untouched (immutable update).
    expect(doc.stories[storyId]!.content.content[0]!.styleId).toBeUndefined();
  });

  it('returns the document unchanged for a missing story', () => {
    const { doc } = docWithStory(['x']);
    expect(applyStyleToStory(doc, 'nope', 'poetry')).toBe(doc);
  });
});

describe('findStyleInstances', () => {
  it('finds stamped paragraphs across stories', () => {
    const { doc, storyId } = docWithStory(['a', 'b', 'c']);
    const styled = applyStyleToStory(doc, storyId, 'quote');
    // Restamp only the middle paragraph with another style.
    const onlyMiddle: RePageDocument = JSON.parse(JSON.stringify(styled));
    onlyMiddle.stories[storyId]!.content.content[1]!.styleId = 'poetry';

    expect(findStyleInstances(onlyMiddle, 'quote')).toEqual([
      { storyId, paragraphIndex: 0 },
      { storyId, paragraphIndex: 2 },
    ]);
    expect(findStyleInstances(onlyMiddle, 'poetry')).toEqual([
      { storyId, paragraphIndex: 1 },
    ]);
  });

  it('returns empty when nothing was stamped', () => {
    const { doc } = docWithStory(['a']);
    expect(findStyleInstances(doc, 'poetry')).toEqual([]);
  });
});

describe('getStyleDisplayName', () => {
  it('prefers the rename override, then the preset name, then the raw id', () => {
    expect(getStyleDisplayName('poetry', { poetry: 'My Poems' })).toBe('My Poems');
    expect(getStyleDisplayName('poetry', {})).toBe(URDU_STYLE_PRESETS['poetry']!.name);
    expect(getStyleDisplayName('unknown-id', {})).toBe('unknown-id');
  });
});

describe('GALLERY_STYLE_IDS', () => {
  it('lists the seven gallery styles', () => {
    expect([...GALLERY_STYLE_IDS]).toEqual([
      'normal',
      'heading-1',
      'heading-2',
      'heading-3',
      'poetry',
      'quote',
      'quran',
    ]);
  });
});
