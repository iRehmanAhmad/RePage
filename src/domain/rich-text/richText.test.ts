import { describe, expect, it } from 'vitest';
import {
  createRichTextFromPlainText,
  extractPlainText,
  paragraph,
  parseRichText,
  richTextDocumentSchema,
  type RichTextDocument,
} from './types';

describe('richText schema & utilities', () => {
  it('validates a standard Urdu rich-text document through Zod', () => {
    const doc: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          direction: 'rtl',
          alignment: 'right',
          lineHeight: 1.8,
          content: [
            {
              type: 'text',
              text: 'خوش آمدید',
              marks: [
                { type: 'bold' },
                { type: 'color', color: '#10b981' },
                { type: 'fontFamily', family: 'Noto Nastaliq Urdu' },
                { type: 'fontSize', size: 24 },
              ],
            },
            { type: 'hardBreak' },
            {
              type: 'text',
              text: 'اردو صفحہ',
              marks: [{ type: 'italic' }, { type: 'underline' }],
            },
          ],
        },
      ],
    };

    const parsed = parseRichText(doc);
    expect(parsed).toEqual(doc);
  });

  it('extracts plain text correctly including multi-line paragraphs and hard breaks', () => {
    const doc: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          direction: 'rtl',
          content: [
            { type: 'text', text: 'پہلی لائن' },
            { type: 'hardBreak' },
            { type: 'text', text: 'دوسری لائن' },
          ],
        },
        paragraph('دوسرا پیراگراف'),
      ],
    };

    const text = extractPlainText(doc);
    expect(text).toBe('پہلی لائن\nدوسری لائن\nدوسرا پیراگراف');
  });

  it('converts plain text string into structured RichTextDocument', () => {
    const raw = 'عنوان\nمتن کی پہلی سطر\nمتن کی دوسری سطر';
    const doc = createRichTextFromPlainText(raw, 'rtl');

    expect(doc.type).toBe('doc');
    expect(doc.content).toHaveLength(3);
    expect(doc.content[0]?.direction).toBe('rtl');
    expect(extractPlainText(doc)).toBe(raw);
  });

  it('rejects invalid mark types or invalid alignment properties', () => {
    const invalidDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          alignment: 'invalid-alignment',
          content: [{ type: 'text', text: 'test' }],
        },
      ],
    };

    expect(() => richTextDocumentSchema.parse(invalidDoc)).toThrow();
  });
});
