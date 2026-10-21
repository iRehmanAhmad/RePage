import type { RePageDocument } from '../document/types';
import {
  BUILTIN_URDU_CHARACTER_STYLES,
  characterStyleSchema,
  type CharacterStyle,
} from './styles';
import type { TextMark, TextRun } from './types';

/**
 * Character styles (Phase 4 batch 12): named, reusable RUN-level
 * formatting stored in the document's style library
 * (doc.styles.characterStyles), referenced from runs by
 * TextRun.characterStyleId.
 *
 * Resolution precedence (mirrors how paragraph styles relate to direct
 * paragraph properties in this codebase):
 *
 *     effective(run) = character style properties, overridden per-property
 *                      by the run's own marks (direct formatting wins)
 *
 * Paragraph styles in RePage are presets that BAKE formatting into the
 * paragraph at apply time (see editor/commands/styleCommands), while
 * character styles are live references: editing a character style updates
 * every run that uses it, which is the behavior users expect from Word /
 * InPage character styles and the reason runs store an id, not a copy.
 *
 * Registry access rule: documents created before this feature carry
 * `styles: {}` (or no characterStyles key). Reading falls back to the
 * built-in Urdu character styles so they are always listed; the first
 * mutating command MATERIALIZES the full set into the document (see
 * editor/commands/characterStyleCommands), after which the document's own
 * registry is authoritative — including deletions of built-ins.
 */

interface StyleLibraryShape {
  characterStyles?: Record<string, unknown> | undefined;
  paragraphStyles?: Record<string, unknown> | undefined;
  objectStyles?: Record<string, unknown> | undefined;
}

function libraryOf(doc: RePageDocument): StyleLibraryShape {
  return (doc.styles ?? {}) as StyleLibraryShape;
}

/** True when the document carries its own character-style registry. */
export function hasOwnCharacterStyleRegistry(doc: RePageDocument): boolean {
  return libraryOf(doc).characterStyles !== undefined;
}

/**
 * The document's character styles: its own registry when present, else the
 * built-in set. Entries are validated against characterStyleSchema;
 * malformed entries are skipped rather than crashing rendering.
 */
export function getCharacterStyles(doc: RePageDocument): Record<string, CharacterStyle> {
  const own = libraryOf(doc).characterStyles;
  if (own === undefined) return { ...BUILTIN_URDU_CHARACTER_STYLES };
  const out: Record<string, CharacterStyle> = {};
  for (const [id, raw] of Object.entries(own)) {
    const parsed = characterStyleSchema.safeParse(raw);
    if (parsed.success) out[id] = { ...parsed.data, id };
  }
  return out;
}

export function getCharacterStyle(
  doc: RePageDocument,
  styleId: string | undefined,
): CharacterStyle | undefined {
  if (!styleId) return undefined;
  return getCharacterStyles(doc)[styleId];
}

/** The style's properties expressed as marks (only defined props appear). */
export function characterStyleToMarks(style: CharacterStyle): TextMark[] {
  const marks: TextMark[] = [];
  if (style.bold) marks.push({ type: 'bold' });
  if (style.italic) marks.push({ type: 'italic' });
  if (style.underline) marks.push({ type: 'underline' });
  if (style.fontFamily) marks.push({ type: 'fontFamily', family: style.fontFamily });
  if (style.fontSize !== undefined) marks.push({ type: 'fontSize', size: style.fontSize });
  if (style.color) marks.push({ type: 'color', color: style.color });
  return marks;
}

/**
 * The run's effective marks: style marks UNDER direct marks. A direct mark
 * of the same type replaces the style's; direct formatting can also
 * explicitly switch a toggle off by ... it cannot — canonical marks have
 * no "off" value for bold/italic/underline, so a style's bold can only be
 * overridden by removing the style from the run (same rule as Word, where
 * toggling bold on styled text adds a direct bold mark; here the absence
 * of an off-state is a documented model limit).
 */
export function effectiveMarksForRun(run: TextRun, style: CharacterStyle | undefined): TextMark[] {
  const styleMarks = style ? characterStyleToMarks(style) : [];
  const direct = run.marks ?? [];
  const directTypes = new Set(direct.map((m) => m.type));
  return [...styleMarks.filter((m) => !directTypes.has(m.type)), ...direct];
}

export interface EffectiveRunProps {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontFamily: string | undefined;
  fontSize: number | undefined;
  color: string | undefined;
}

/**
 * Resolved scalar props for a run — the single comparison surface used by
 * renderers (editor CSS, DOCX) and by the delete-style bake (two runs are
 * "visually equal" iff their resolved props are equal).
 */
export function resolveEffectiveRunProps(
  run: TextRun,
  style: CharacterStyle | undefined,
): EffectiveRunProps {
  const marks = effectiveMarksForRun(run, style);
  const props: EffectiveRunProps = {
    bold: false,
    italic: false,
    underline: false,
    fontFamily: undefined,
    fontSize: undefined,
    color: undefined,
  };
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold': props.bold = true; break;
      case 'italic': props.italic = true; break;
      case 'underline': props.underline = true; break;
      case 'fontFamily': props.fontFamily = mark.family; break;
      case 'fontSize': props.fontSize = mark.size; break;
      case 'color': props.color = mark.color; break;
      default: break;
    }
  }
  return props;
}

/** Marks that reproduce the given resolved props as direct formatting. */
export function marksFromEffectiveProps(props: EffectiveRunProps): TextMark[] {
  const marks: TextMark[] = [];
  if (props.bold) marks.push({ type: 'bold' });
  if (props.italic) marks.push({ type: 'italic' });
  if (props.underline) marks.push({ type: 'underline' });
  if (props.fontFamily) marks.push({ type: 'fontFamily', family: props.fontFamily });
  if (props.fontSize !== undefined) marks.push({ type: 'fontSize', size: props.fontSize });
  if (props.color) marks.push({ type: 'color', color: props.color });
  return marks;
}

/**
 * Inline CSS for one character style, used by the editors to render
 * `span[data-character-style]` runs. Only the style's own properties are
 * emitted; direct marks on the run render as nested elements and override
 * naturally through CSS specificity/order (direct-mark elements sit
 * INSIDE the styled span — see tiptapConverter).
 */
export function characterStyleCssText(style: CharacterStyle): string {
  const decls: string[] = [];
  if (style.fontFamily) decls.push(`font-family: ${style.fontFamily}`);
  if (style.fontSize !== undefined) decls.push(`font-size: ${style.fontSize}pt`);
  if (style.color) decls.push(`color: ${style.color}`);
  if (style.bold !== undefined) decls.push(`font-weight: ${style.bold ? 'bold' : 'normal'}`);
  if (style.italic !== undefined) decls.push(`font-style: ${style.italic ? 'italic' : 'normal'}`);
  if (style.underline !== undefined) {
    decls.push(`text-decoration: ${style.underline ? 'underline' : 'none'}`);
  }
  return decls.join('; ');
}

/** CSS rules for a whole registry, for injection into the editor surface. */
export function characterStylesCss(registry: Record<string, CharacterStyle>): string {
  return Object.values(registry)
    .map((style) => `[data-character-style="${style.id}"] { ${characterStyleCssText(style)} }`)
    .join('\n');
}

/** Counts runs using each character style in one story (paragraph-style analogue of findStyleInstances). */
export function findCharacterStyleInstances(
  doc: RePageDocument,
  storyId: string,
  styleId: string,
): number {
  const story = doc.stories[storyId];
  if (!story) return 0;
  let count = 0;
  for (const paragraph of story.content.content) {
    for (const node of paragraph.content ?? []) {
      if (node.type === 'text' && node.characterStyleId === styleId) count += 1;
    }
  }
  return count;
}
