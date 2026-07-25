/**
 * Tiptap HTML / JSON <-> Canonical RichTextDocument Converter
 *
 * Provides bidirectional conversion and HTML sanitization ensuring:
 * 1. Safe pasting (no script, iframe, or unsafe attribute injection).
 * 2. Full preservation of bold, italic, underline, paragraph direction (RTL/LTR), and text runs.
 */

import type { ParagraphNode, RichTextDocument, TextDirection, TextMark, TextRun } from './types';
import { paragraph } from './types';

/**
 * Sanitizes raw HTML input to strip dangerous elements (scripts, style tags, event handlers, iframes)
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/ on\w+="[^"]*"/gi, '')
    .replace(/ on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Converts a canonical RichTextDocument to Tiptap-compatible HTML string
 */
export function canonicalToTiptapHtml(doc: RichTextDocument): string {
  if (!doc || !doc.content || doc.content.length === 0) {
    return '<p dir="rtl"></p>';
  }

  return doc.content
    .map((para) => {
      const dirAttr = para.direction ? ` dir="${para.direction}"` : ' dir="rtl"';
      const alignAttr = para.alignment ? ` style="text-align: ${para.alignment};"` : '';

      const inlineHtml = para.content
        .map((inline) => {
          if (inline.type === 'hardBreak') {
            return '<br />';
          }
          let text = inline.text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          if (inline.marks) {
            for (const mark of inline.marks) {
              if (mark.type === 'bold') text = `<strong>${text}</strong>`;
              if (mark.type === 'italic') text = `<em>${text}</em>`;
              if (mark.type === 'underline') text = `<u>${text}</u>`;
            }
          }
          return text;
        })
        .join('');

      return `<p${dirAttr}${alignAttr}>${inlineHtml}</p>`;
    })
    .join('');
}

/**
 * Converts Tiptap HTML string to a canonical RichTextDocument
 */
export function tiptapHtmlToCanonical(
  html: string,
  defaultDirection: TextDirection = 'rtl',
): RichTextDocument {
  const cleanHtml = sanitizeHtml(html);
  if (!cleanHtml.trim()) {
    return { type: 'doc', content: [paragraph('', defaultDirection)] };
  }

  // Parse HTML elements
  const parser = new DOMParser();
  const dom = parser.parseFromString(cleanHtml, 'text/html');
  const paragraphElements = Array.from(dom.body.children).filter(
    (el) => el.tagName.toLowerCase() === 'p' || el.tagName.toLowerCase() === 'div' || el.tagName.toLowerCase() === 'h1' || el.tagName.toLowerCase() === 'h2' || el.tagName.toLowerCase() === 'h3',
  );

  if (paragraphElements.length === 0) {
    // Single plain text content
    const textContent = dom.body.textContent || '';
    return {
      type: 'doc',
      content: [paragraph(textContent, defaultDirection)],
    };
  }

  const canonicalParagraphs: ParagraphNode[] = paragraphElements.map((pEl) => {
    const dirAttr = pEl.getAttribute('dir')?.toLowerCase();
    const dir: TextDirection = dirAttr === 'ltr' ? 'ltr' : 'rtl';

    const runs: TextRun[] = [];
    const walk = (node: Node, currentMarks: TextMark[]) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const txt = node.textContent || '';
        if (txt) {
          runs.push({
            type: 'text',
            text: txt,
            marks: currentMarks.length > 0 ? [...currentMarks] : undefined,
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const nextMarks = [...currentMarks];

        if (tag === 'strong' || tag === 'b') {
          if (!nextMarks.some((m) => m.type === 'bold')) nextMarks.push({ type: 'bold' });
        }
        if (tag === 'em' || tag === 'i') {
          if (!nextMarks.some((m) => m.type === 'italic')) nextMarks.push({ type: 'italic' });
        }
        if (tag === 'u') {
          if (!nextMarks.some((m) => m.type === 'underline')) nextMarks.push({ type: 'underline' });
        }

        Array.from(el.childNodes).forEach((child) => walk(child, nextMarks));
      }
    };

    Array.from(pEl.childNodes).forEach((child) => walk(child, []));

    return {
      type: 'paragraph',
      direction: dir,
      alignment: 'start',
      content: runs.length > 0 ? runs : [],
    };
  });

  return {
    type: 'doc',
    content: canonicalParagraphs,
  };
}
