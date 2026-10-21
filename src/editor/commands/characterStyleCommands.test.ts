import { describe, expect, it } from 'vitest';
import { createDocument } from '../../domain/document/createDocument';
import type { RePageDocument, TextStory } from '../../domain/document/types';
import {
  effectiveMarksForRun,
  findCharacterStyleInstances,
  getCharacterStyles,
  resolveEffectiveRunProps,
} from '../../domain/rich-text/characterStyles';
import type { TextRun } from '../../domain/rich-text/types';
import {
  applyCharacterStyleToStoryCommand,
  createCharacterStyleCommand,
  deleteCharacterStyleCommand,
  renameCharacterStyleCommand,
  updateCharacterStyleCommand,
} from './characterStyleCommands';

function docWithStory(paragraphs: TextStory['content']['content']): {
  doc: RePageDocument;
  storyId: string;
} {
  const doc = createDocument('styles');
  const storyId = Object.keys(doc.stories)[0]!;
  const story = doc.stories[storyId]!;
  return {
    doc: { ...doc, stories: { [storyId]: { ...story, content: { type: 'doc', content: paragraphs } } } },
    storyId,
  };
}

function runsOf(doc: RePageDocument, storyId: string, paragraphIndex = 0): TextRun[] {
  return (doc.stories[storyId]!.content.content[paragraphIndex]!.content ?? []).filter(
    (n): n is TextRun => n.type === 'text',
  );
}

describe('registry access', () => {
  it('falls back to built-ins when the document has no registry', () => {
    const doc = createDocument('x');
    const styles = getCharacterStyles(doc);
    expect(styles['emphasis']).toBeDefined();
    expect(styles['title_lead']).toBeDefined();
  });

  it('first mutation materializes the built-ins so a delete is real', () => {
    const doc = createDocument('x');
    const { document: created, style } = createCharacterStyleCommand(doc, { name: 'Mine' });
    expect(getCharacterStyles(created)['emphasis']).toBeDefined();
    expect(getCharacterStyles(created)[style.id]).toBeDefined();
    const deleted = deleteCharacterStyleCommand(created, 'emphasis');
    expect(getCharacterStyles(deleted)['emphasis']).toBeUndefined();
    expect(getCharacterStyles(deleted)[style.id]).toBeDefined();
  });
});

describe('resolution precedence', () => {
  it('direct marks override style properties per-type', () => {
    const style = { id: 's', name: 'S', bold: true, color: '#111111', fontSize: 12 };
    const run: TextRun = { type: 'text', text: 'x', marks: [{ type: 'color', color: '#ff0000' }] };
    const props = resolveEffectiveRunProps(run, style);
    expect(props.bold).toBe(true); // from style
    expect(props.color).toBe('#ff0000'); // direct wins
    expect(props.fontSize).toBe(12); // from style
    const types = effectiveMarksForRun(run, style).map((m) => m.type);
    expect(types.filter((t) => t === 'color')).toHaveLength(1);
  });

  it('a run without a style resolves to its direct marks only', () => {
    const run: TextRun = { type: 'text', text: 'x', marks: [{ type: 'italic' }] };
    const props = resolveEffectiveRunProps(run, undefined);
    expect(props).toEqual({
      bold: false, italic: true, underline: false,
      fontFamily: undefined, fontSize: undefined, color: undefined,
    });
  });

  it('updating a style changes the effective formatting of its runs (live reference)', () => {
    const { doc, storyId } = docWithStory([
      { type: 'paragraph', content: [{ type: 'text', text: 'hello', characterStyleId: 'emphasis' }] },
    ]);
    const updated = updateCharacterStyleCommand(doc, 'emphasis', { color: '#123456' });
    const run = runsOf(updated, storyId)[0]!;
    const style = getCharacterStyles(updated)['emphasis'];
    expect(resolveEffectiveRunProps(run, style).color).toBe('#123456');
    expect(run.marks).toBeUndefined(); // nothing was baked into the run
  });
});

describe('applyCharacterStyleToStoryCommand', () => {
  it('splits runs at range boundaries and merges compatible neighbours', () => {
    const { doc, storyId } = docWithStory([
      { type: 'paragraph', content: [{ type: 'text', text: 'abcdefghij' }] },
    ]);
    const applied = applyCharacterStyleToStoryCommand(doc, storyId, 2, 5, 'emphasis');
    const runs = runsOf(applied, storyId);
    expect(runs.map((r) => r.text)).toEqual(['ab', 'cde', 'fghij']);
    expect(runs[1]!.characterStyleId).toBe('emphasis');
    expect(runs[0]!.characterStyleId).toBeUndefined();
    expect(findCharacterStyleInstances(applied, storyId, 'emphasis')).toBe(1);
  });

  it('spans paragraphs using story char offsets (boundaries not counted)', () => {
    const { doc, storyId } = docWithStory([
      { type: 'paragraph', content: [{ type: 'text', text: 'aaaa' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'bbbb' }] },
    ]);
    const applied = applyCharacterStyleToStoryCommand(doc, storyId, 2, 6, 'emphasis');
    expect(runsOf(applied, storyId, 0).map((r) => [r.text, r.characterStyleId ?? null])).toEqual([
      ['aa', null], ['aa', 'emphasis'],
    ]);
    expect(runsOf(applied, storyId, 1).map((r) => [r.text, r.characterStyleId ?? null])).toEqual([
      ['bb', 'emphasis'], ['bb', null],
    ]);
  });

  it('clearing with undefined merges the paragraph back into one run', () => {
    const { doc, storyId } = docWithStory([
      { type: 'paragraph', content: [{ type: 'text', text: 'abcdefghij' }] },
    ]);
    const applied = applyCharacterStyleToStoryCommand(doc, storyId, 2, 5, 'emphasis');
    const cleared = applyCharacterStyleToStoryCommand(applied, storyId, 2, 5, undefined);
    const runs = runsOf(cleared, storyId);
    expect(runs).toHaveLength(1);
    expect(runs[0]!.text).toBe('abcdefghij');
    expect(runs[0]!.characterStyleId).toBeUndefined();
  });

  it('rejects an unknown style id without touching the document', () => {
    const { doc, storyId } = docWithStory([
      { type: 'paragraph', content: [{ type: 'text', text: 'abc' }] },
    ]);
    const { document: withRegistry } = createCharacterStyleCommand(doc, { name: 'Real' });
    const result = applyCharacterStyleToStoryCommand(withRegistry, storyId, 0, 2, 'nope');
    expect(result).toBe(withRegistry);
  });
});

describe('deleteCharacterStyleCommand bake', () => {
  it('leaves every run visually unchanged after the style is deleted', () => {
    const { doc, storyId } = docWithStory([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'plain ' },
          {
            type: 'text',
            text: 'styled',
            characterStyleId: 'emphasis',
            marks: [{ type: 'color', color: '#ff0000' }, { type: 'highlight', color: '#ffff00' }],
          },
        ],
      },
    ]);
    const styleBefore = getCharacterStyles(doc)['emphasis'];
    const styledBefore = runsOf(doc, storyId)[1]!;
    const propsBefore = resolveEffectiveRunProps(styledBefore, styleBefore);

    const deleted = deleteCharacterStyleCommand(doc, 'emphasis');
    expect(getCharacterStyles(deleted)['emphasis']).toBeUndefined();
    const styledAfter = runsOf(deleted, storyId)[1]!;
    expect(styledAfter.characterStyleId).toBeUndefined();
    // Visual equivalence on every property a character style can carry...
    expect(resolveEffectiveRunProps(styledAfter, undefined)).toEqual(propsBefore);
    // ...and non-style marks (highlight) survive the bake untouched.
    expect(styledAfter.marks?.some((m) => m.type === 'highlight')).toBe(true);
    // The unstyled run is untouched.
    expect(runsOf(deleted, storyId)[0]).toEqual(runsOf(doc, storyId)[0]);
  });
});

describe('rename', () => {
  it('renames in the registry only', () => {
    const doc = createDocument('x');
    const renamed = renameCharacterStyleCommand(doc, 'emphasis', 'زور (Emphasis)');
    expect(getCharacterStyles(renamed)['emphasis']!.name).toBe('زور (Emphasis)');
    expect(getCharacterStyles(renamed)['emphasis']!.bold).toBe(true);
  });
});
