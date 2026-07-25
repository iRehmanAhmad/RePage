import { describe, expect, it } from 'vitest';
import {
  canonicalToTiptapHtml,
  sanitizeHtml,
  tiptapHtmlToCanonical,
} from './tiptapConverter';
import type { RichTextDocument } from './types';

describe('Tiptap HTML & Canonical Converter (Phase UX-2)', () => {
  it('sanitizes dangerous HTML tags and event handlers during paste', () => {
    const maliciousHtml = '<p>Urdu text <script>alert("xss")</script><iframe src="evil.com"></iframe><b onclick="bad()">Click</b></p>';
    const clean = sanitizeHtml(maliciousHtml);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('<iframe>');
    expect(clean).not.toContain('onclick');
    expect(clean).toContain('Urdu text');
  });

  it('converts canonical document with bold, italic, underline, and RTL/LTR direction to HTML and back', () => {
    const originalDoc: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          direction: 'rtl',
          alignment: 'start',
          content: [
            { type: 'text', text: 'یہ جلی متن ہے: ', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'اردو اور English دونوں ایک ساتھ co-exist کرتے ہیں۔', marks: [{ type: 'italic' }] },
          ],
        },
        {
          type: 'paragraph',
          direction: 'ltr',
          alignment: 'start',
          content: [
            { type: 'text', text: 'Underlined English paragraph', marks: [{ type: 'underline' }] },
          ],
        },
      ],
    };

    const html = canonicalToTiptapHtml(originalDoc);
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('<strong>یہ جلی متن ہے: </strong>');
    expect(html).toContain('<em>اردو اور English دونوں ایک ساتھ co-exist کرتے ہیں۔</em>');
    expect(html).toContain('dir="ltr"');
    expect(html).toContain('<u>Underlined English paragraph</u>');

    const roundtripDoc = tiptapHtmlToCanonical(html);
    expect(roundtripDoc.content.length).toBe(2);
    expect(roundtripDoc.content[0]!.direction).toBe('rtl');
    expect(roundtripDoc.content[1]!.direction).toBe('ltr');
  });
});
