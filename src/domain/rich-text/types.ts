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

export type InlineNode = TextRun | HardBreakNode;

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
  lineHeight?: number | undefined;
  spaceBefore?: number | undefined;
  spaceAfter?: number | undefined;
  paragraphSpacing?: number | undefined;
  indentLevel?: number | undefined;
  firstLineIndent?: number | undefined;
  backgroundColor?: string | undefined;
  border?: ParagraphBorder | undefined;
  content: InlineNode[];
}

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

export const inlineNodeSchema = z.discriminatedUnion('type', [textRunSchema, hardBreakNodeSchema]);

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
  lineHeight: z.number().positive().optional(),
  spaceBefore: z.number().nonnegative().optional(),
  spaceAfter: z.number().nonnegative().optional(),
  paragraphSpacing: z.number().nonnegative().optional(),
  indentLevel: z.number().nonnegative().optional(),
  firstLineIndent: z.number().optional(),
  backgroundColor: z.string().optional(),
  border: paragraphBorderSchema.optional(),
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
