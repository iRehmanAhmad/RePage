import { z } from 'zod';

export type TextDirection = 'rtl' | 'ltr' | 'auto';
export type TextAlignment = 'start' | 'center' | 'end' | 'justify' | 'left' | 'right';

export interface BoldMark {
  type: 'bold';
}

export interface ItalicMark {
  type: 'italic';
}

export interface UnderlineMark {
  type: 'underline';
  style?: 'single' | 'double' | 'thick' | 'dotted' | 'dashed' | 'wave' | undefined;
  color?: string | undefined;
}

export interface StrikethroughMark {
  type: 'strikethrough';
}

export interface SubscriptMark {
  type: 'subscript';
}

export interface SuperscriptMark {
  type: 'superscript';
}

export interface HighlightMark {
  type: 'highlight';
  color: string;
}

export interface FontFamilyMark {
  type: 'fontFamily';
  family: string;
}

export interface FontSizeMark {
  type: 'fontSize';
  size: number;
}

export interface ColorMark {
  type: 'color';
  color: string;
}

export interface CharacterSpacingMark {
  type: 'characterSpacing';
  value: number;
}

export interface TextEffectMark {
  type: 'textEffect';
  shadow?: boolean | undefined;
  glow?: boolean | undefined;
  outline?: string | undefined;
}

export type TextMark =
  | BoldMark
  | ItalicMark
  | UnderlineMark
  | StrikethroughMark
  | SubscriptMark
  | SuperscriptMark
  | HighlightMark
  | FontFamilyMark
  | FontSizeMark
  | ColorMark
  | CharacterSpacingMark
  | TextEffectMark;

export interface TextRun {
  type: 'text';
  text: string;
  marks?: TextMark[] | undefined;
}

export interface HardBreakNode {
  type: 'hardBreak';
}

/**
 * An explicit layout break inside a story: a point where layout must leave
 * the current column ('column') or page ('page') while staying in the SAME
 * section — unlike a section break, it changes no page setup, headers, or
 * numbering.
 *
 * Model choice: an inline atom node, sibling of HardBreakNode. The story
 * model already represents special in-text content as zero-width inline
 * nodes (hardBreak), every layout path (pagination, frame-chain slicing,
 * split/merge helpers) already walks inline nodes generically, and the
 * Tiptap editor has a direct analogue (an inline atom node, like its own
 * hardBreak). A paragraph property could only express "break at paragraph
 * start" and a Tiptap-only node would not survive the canonical round-trip,
 * so the inline node is the one representation all paths share.
 */
export interface BreakNode {
  type: 'break';
  breakType: 'page' | 'column';
}

export type InlineNode = TextRun | HardBreakNode | BreakNode;

export interface ParagraphBorder {
  side: 'bottom' | 'top' | 'left' | 'right' | 'box' | 'all';
  color?: string | undefined;
  width?: number | undefined;
  style?: 'solid' | 'dashed' | 'dotted' | 'double' | undefined;
}

export interface ParagraphNode {
  type: 'paragraph' | 'bulletList' | 'orderedList' | 'listItem';
  direction?: TextDirection | undefined;
  alignment?: TextAlignment | undefined;
  /** Id of the named style preset last applied to this paragraph (e.g. 'poetry'). */
  styleId?: string | undefined;
  lineHeight?: number | undefined;
  spaceBefore?: number | undefined;
  spaceAfter?: number | undefined;
  paragraphSpacing?: number | undefined;
  indentLevel?: number | undefined;
  firstLineIndent?: number | undefined;
  backgroundColor?: string | undefined;
  border?: ParagraphBorder | undefined;
  /**
   * When true, layout starts this paragraph at the top of the next PAGE
   * (never merely the next column — page-break-before means page, matching
   * Word's "Page break before" paragraph option). Absent = false, so
   * documents written before this field existed stay valid unchanged.
   */
  pageBreakBefore?: boolean | undefined;
  /**
   * Justification strategy when `alignment` is 'justify': 'space' widens
   * the word gaps (the Latin/Word default); 'kashida' stretches joinable
   * Arabic letters with tatweel at render time (the InPage behavior).
   * Absent = default ('kashida' for RTL paragraphs, 'space' for LTR).
   * Rendering-only — the stored text is never stretched with tatweels;
   * DOCX export maps it to Word's native kashida justification (w:jc).
   * See domain/layout/kashida.ts.
   */
  justificationMode?: JustificationMode | undefined;
  content: InlineNode[];
}

/** Justification strategy of a justified paragraph. See ParagraphNode. */
export type JustificationMode = 'space' | 'kashida';

export interface RichTextDocument {
  type: 'doc';
  content: ParagraphNode[];
}

// Zod Validation Schemas
export const textMarkSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({
    type: z.literal('underline'),
    style: z.enum(['single', 'double', 'thick', 'dotted', 'dashed', 'wave']).optional(),
    color: z.string().optional(),
  }),
  z.object({ type: z.literal('strikethrough') }),
  z.object({ type: z.literal('subscript') }),
  z.object({ type: z.literal('superscript') }),
  z.object({ type: z.literal('highlight'), color: z.string() }),
  z.object({ type: z.literal('fontFamily'), family: z.string() }),
  z.object({ type: z.literal('fontSize'), size: z.number().positive() }),
  z.object({ type: z.literal('color'), color: z.string() }),
  z.object({ type: z.literal('characterSpacing'), value: z.number() }),
  z.object({
    type: z.literal('textEffect'),
    shadow: z.boolean().optional(),
    glow: z.boolean().optional(),
    outline: z.string().optional(),
  }),
]);

export const textRunSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  marks: z.array(textMarkSchema).optional(),
});

export const hardBreakNodeSchema = z.object({
  type: z.literal('hardBreak'),
});

export const breakNodeSchema = z.object({
  type: z.literal('break'),
  breakType: z.enum(['page', 'column']),
});

export const inlineNodeSchema = z.discriminatedUnion('type', [
  textRunSchema,
  hardBreakNodeSchema,
  breakNodeSchema,
]);

export const paragraphBorderSchema = z.object({
  side: z.enum(['bottom', 'top', 'left', 'right', 'box', 'all']),
  color: z.string().optional(),
  width: z.number().optional(),
  style: z.enum(['solid', 'dashed', 'dotted', 'double']).optional(),
});

export const paragraphNodeSchema = z.object({
  type: z.enum(['paragraph', 'bulletList', 'orderedList', 'listItem']),
  direction: z.enum(['rtl', 'ltr', 'auto']).optional(),
  alignment: z.enum(['start', 'center', 'end', 'justify', 'left', 'right']).optional(),
  styleId: z.string().optional(),
  lineHeight: z.number().positive().optional(),
  spaceBefore: z.number().nonnegative().optional(),
  spaceAfter: z.number().nonnegative().optional(),
  paragraphSpacing: z.number().nonnegative().optional(),
  indentLevel: z.number().nonnegative().optional(),
  firstLineIndent: z.number().optional(),
  backgroundColor: z.string().optional(),
  border: paragraphBorderSchema.optional(),
  pageBreakBefore: z.boolean().optional(),
  justificationMode: z.enum(['space', 'kashida']).optional(),
  content: z.array(inlineNodeSchema),
});

export const richTextDocumentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(paragraphNodeSchema),
});

export function parseRichText(data: unknown): RichTextDocument {
  return richTextDocumentSchema.parse(data) as RichTextDocument;
}

export function paragraph(text = '', direction: TextDirection = 'rtl'): ParagraphNode {
  return {
    type: 'paragraph',
    direction,
    alignment: 'start',
    content: text ? [{ type: 'text', text }] : [],
  };
}

export function extractPlainText(doc: RichTextDocument): string {
  const paragraphs: string[] = [];

  for (const para of doc.content) {
    let paraText = '';
    for (const inline of para.content) {
      if (inline.type === 'text') {
        paraText += inline.text;
      } else if (inline.type === 'hardBreak') {
        paraText += '\n';
      }
    }
    paragraphs.push(paraText);
  }

  return paragraphs.join('\n');
}

export function createRichTextFromPlainText(
  text: string,
  direction: TextDirection = 'rtl',
): RichTextDocument {
  const lines = text.split('\n');
  const paragraphs: ParagraphNode[] = lines.map((line) => paragraph(line, direction));

  return {
    type: 'doc',
    content: paragraphs.length > 0 ? paragraphs : [paragraph('', direction)],
  };
}
