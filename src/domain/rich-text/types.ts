export type TextDirection = 'rtl' | 'ltr' | 'auto';
export type TextAlignment = 'start' | 'center' | 'end' | 'justify';

export interface TextRun {
  type: 'text';
  text: string;
  marks?: Array<'bold' | 'italic' | 'underline'> | undefined;
}

export interface ParagraphNode {
  type: 'paragraph';
  direction: TextDirection;
  alignment: TextAlignment;
  content: TextRun[];
}

export interface RichTextDocument {
  type: 'doc';
  content: ParagraphNode[];
}

export function paragraph(text = '', direction: TextDirection = 'rtl'): ParagraphNode {
  return {
    type: 'paragraph',
    direction,
    alignment: 'start',
    content: text ? [{ type: 'text', text }] : [],
  };
}
