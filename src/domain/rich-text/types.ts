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

export type TextMark =
  | BoldMark
  | ItalicMark
  | UnderlineMark
  | FontFamilyMark
  | FontSizeMark
  | ColorMark
  | CharacterSpacingMark;

export interface TextRun {
  type: 'text';
  text: string;
  marks?: TextMark[] | undefined;
}

export interface HardBreakNode {
  type: 'hardBreak';
}

export type InlineNode = TextRun | HardBreakNode;

export interface ParagraphNode {
  type: 'paragraph';
  direction?: TextDirection | undefined;
  alignment?: TextAlignment | undefined;
  lineHeight?: number | undefined;
  paragraphSpacing?: number | undefined;
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
  z.object({ type: z.literal('underline') }),
  z.object({ type: z.literal('fontFamily'), family: z.string().min(1) }),
  z.object({ type: z.literal('fontSize'), size: z.number().positive() }),
  z.object({ type: z.literal('color'), color: z.string().min(1) }),
  z.object({ type: z.literal('characterSpacing'), value: z.number() }),
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

export const paragraphNodeSchema = z.object({
  type: z.literal('paragraph'),
  direction: z.enum(['rtl', 'ltr', 'auto']).optional(),
  alignment: z.enum(['start', 'center', 'end', 'justify', 'left', 'right']).optional(),
  lineHeight: z.number().positive().optional(),
  paragraphSpacing: z.number().nonnegative().optional(),
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
