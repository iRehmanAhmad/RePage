/**
 * Character Style Commands (Phase 4 batch 12)
 *
 * All mutations of the document's character-style registry and of runs'
 * characterStyleId references go through these commands (the sanctioned
 * canonical-document mutation path). Every command is a pure
 * document -> document transform; App wraps each call in ONE
 * updateDocument, so each is exactly one undo step.
 *
 * Registry rule: when a document has no characterStyles registry yet, the
 * built-in set is materialized into it by the first mutation (see
 * domain/rich-text/characterStyles.ts), so a delete is a real delete —
 * built-ins do not resurrect.
 */

import type { RePageDocument, TextStory } from '../../domain/document/types';
import { createId } from '../../domain/document/ids';
import {
  getCharacterStyles,
  hasOwnCharacterStyleRegistry,
  marksFromEffectiveProps,
  resolveEffectiveRunProps,
} from '../../domain/rich-text/characterStyles';
import type { CharacterStyle } from '../../domain/rich-text/styles';
import type { InlineNode, ParagraphNode, TextMark, TextRun } from '../../domain/rich-text/types';

interface StyleLibraryShape {
  characterStyles?: Record<string, unknown> | undefined;
  paragraphStyles?: Record<string, unknown> | undefined;
  objectStyles?: Record<string, unknown> | undefined;
}

function withCharacterStyles(
  doc: RePageDocument,
  characterStyles: Record<string, CharacterStyle>,
): RePageDocument {
  const library = (doc.styles ?? {}) as StyleLibraryShape;
  return { ...doc, styles: { ...library, characterStyles } };
}

/** The registry to mutate: the document's own, or the built-ins materialized. */
function materializedRegistry(doc: RePageDocument): Record<string, CharacterStyle> {
  return getCharacterStyles(doc);
}

export function createCharacterStyleCommand(
  doc: RePageDocument,
  init: Omit<CharacterStyle, 'id'> & { id?: string },
): { document: RePageDocument; style: CharacterStyle } {
  const style: CharacterStyle = {
    ...init,
    id: init.id ?? createId('charstyle'),
    name: init.name.trim() || 'Untitled style',
  };
  const registry = { ...materializedRegistry(doc), [style.id]: style };
  return { document: withCharacterStyles(doc, registry), style };
}

export function updateCharacterStyleCommand(
  doc: RePageDocument,
  styleId: string,
  patch: Partial<Omit<CharacterStyle, 'id'>>,
): RePageDocument {
  const registry = { ...materializedRegistry(doc) };
  const existing = registry[styleId];
  if (!existing) return doc;
  registry[styleId] = { ...existing, ...patch, id: styleId };
  return withCharacterStyles(doc, registry);
}

export function renameCharacterStyleCommand(
  doc: RePageDocument,
  styleId: string,
  name: string,
): RePageDocument {
  return updateCharacterStyleCommand(doc, styleId, { name: name.trim() || name });
}

/**
 * Deletes a style WITHOUT changing any text's appearance: every run that
 * referenced the style first has its effective formatting baked in as
 * direct marks (resolved style-under-direct props become the run's marks),
 * then the reference and the registry entry are removed. The bake covers
 * exactly the properties character styles can carry; other direct marks
 * (highlight, spacing, effects) were never the style's and pass through.
 */
export function deleteCharacterStyleCommand(
  doc: RePageDocument,
  styleId: string,
): RePageDocument {
  const registry = { ...materializedRegistry(doc) };
  const style = registry[styleId];
  if (!style) return doc;
  delete registry[styleId];

  const stories: Record<string, TextStory> = {};
  for (const [storyId, story] of Object.entries(doc.stories)) {
    let changed = false;
    const paragraphs = story.content.content.map((paragraph) => {
      if (!paragraph.content?.some((n) => n.type === 'text' && n.characterStyleId === styleId)) {
        return paragraph;
      }
      changed = true;
      const content = (paragraph.content ?? []).map((node): InlineNode => {
        if (node.type !== 'text' || node.characterStyleId !== styleId) return node;
        const baked = marksFromEffectiveProps(resolveEffectiveRunProps(node, style));
        const styleTypes = new Set(baked.map((m) => m.type));
        const others = (node.marks ?? []).filter((m) => !styleTypes.has(m.type));
        // Effective marks already include the run's direct marks for the
        // style-carried types (direct wins in resolution), so the run's
        // new mark set = baked style-carried types + untouched others.
        const merged: TextMark[] = [...others];
        for (const mark of baked) {
          if (!merged.some((m) => m.type === mark.type)) merged.push(mark);
        }
        const next: TextRun = { type: 'text', text: node.text, marks: merged };
        return next;
      });
      return { ...paragraph, content };
    });
    stories[storyId] = changed ? { ...story, content: { ...story.content, content: paragraphs } } : story;
  }

  return { ...withCharacterStyles(doc, registry), stories };
}

// --- Applying a style to a character range -------------------------------------

function marksEqual(a: TextMark[] | undefined, b: TextMark[] | undefined): boolean {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
}

function runsCompatible(a: TextRun, b: TextRun): boolean {
  return a.characterStyleId === b.characterStyleId && marksEqual(a.marks, b.marks);
}

/** Splits/merges runs of one paragraph so [from, to) carries styleId. */
function applyToParagraph(
  paragraph: ParagraphNode,
  from: number,
  to: number,
  styleId: string | undefined,
): ParagraphNode {
  const nodes = paragraph.content ?? [];
  const out: InlineNode[] = [];
  let pos = 0;
  const pushRun = (run: TextRun): void => {
    if (!run.text) return;
    const last = out[out.length - 1];
    if (last && last.type === 'text' && runsCompatible(last, run)) {
      out[out.length - 1] = { ...last, text: last.text + run.text };
    } else {
      out.push({ ...run });
    }
  };
  for (const node of nodes) {
    if (node.type !== 'text') {
      // Non-text inline atoms (hardBreak / break) occupy no character
      // positions and carry no character style; they pass through and act
      // as merge barriers (pushRun only merges into a trailing text run).
      out.push(node);
      continue;
    }
    const start = pos;
    const end = pos + node.text.length;
    pos = end;
    if (end <= from || start >= to) {
      pushRun(node);
      continue;
    }
    const localFrom = Math.max(0, from - start);
    const localTo = Math.min(node.text.length, to - start);
    if (localFrom > 0) pushRun({ ...node, text: node.text.slice(0, localFrom) });
    const middle: TextRun = { ...node, text: node.text.slice(localFrom, localTo) };
    if (styleId === undefined) delete middle.characterStyleId;
    else middle.characterStyleId = styleId;
    pushRun(middle);
    if (localTo < node.text.length) pushRun({ ...node, text: node.text.slice(localTo) });
  }
  return { ...paragraph, content: out };
}

/**
 * Applies (or, with styleId undefined, clears) a character style over the
 * character range [from, to) of a story. Range convention matches the
 * codebase's story char offsets: text characters counted across the
 * story's paragraphs in order, paragraph boundaries not counted (the same
 * convention clipboardCommands and App's selection state use).
 */
export function applyCharacterStyleToStoryCommand(
  doc: RePageDocument,
  storyId: string,
  from: number,
  to: number,
  styleId: string | undefined,
): RePageDocument {
  const story = doc.stories[storyId];
  if (!story || from >= to) return doc;
  if (styleId !== undefined && hasOwnCharacterStyleRegistry(doc) === false) {
    // Materialize the registry so the referenced style provably exists.
    doc = withCharacterStyles(doc, materializedRegistry(doc));
  }
  if (styleId !== undefined && !getCharacterStyles(doc)[styleId]) return doc;

  let offset = 0;
  const paragraphs = story.content.content.map((paragraph) => {
    const length = (paragraph.content ?? []).reduce(
      (sum, n) => sum + (n.type === 'text' ? n.text.length : 0),
      0,
    );
    const start = offset;
    offset += length;
    if (length === 0 || offset <= from || start >= to) return paragraph;
    return applyToParagraph(paragraph, from - start, to - start, styleId);
  });

  return {
    ...doc,
    stories: { ...doc.stories, [storyId]: { ...story, content: { ...story.content, content: paragraphs } } },
  };
}
