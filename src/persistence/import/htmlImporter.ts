import { InlineNode, ParagraphNode, RichTextDocument, TextMark } from '../../domain/rich-text/types';
import { DEFAULT_RESOURCE_LIMITS, ImportOptions, ImportTextResult, validateResourceLimits } from './importEngine';
import { sanitizeHtmlMarkup } from './sanitizer';
import { detectTextDirection } from './textImporter';

export function importHtml(
  htmlContent: string,
  options: ImportOptions = {},
): ImportTextResult {
  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  validateResourceLimits(new Blob([htmlContent]).size, limits);

  // 1. Sanitize executable markup
  const sanitizedHtml = sanitizeHtmlMarkup(htmlContent);

  // 2. Parse using DOMParser or regex fallback
  const paragraphs: ParagraphNode[] = [];

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedHtml, 'text/html');

    const blockElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, div');

    blockElements.forEach((blockEl: Element) => {
      const inlineNodes: InlineNode[] = [];

      function traverse(node: Node, activeMarks: TextMark[]) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent ?? '';
          if (text) {
            inlineNodes.push({
              type: 'text',
              text,
              marks: activeMarks.length > 0 ? [...activeMarks] : undefined,
            });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();

          const marks = [...activeMarks];
          if (tag === 'b' || tag === 'strong') marks.push({ type: 'bold' });
          if (tag === 'i' || tag === 'em') marks.push({ type: 'italic' });
          if (tag === 'u') marks.push({ type: 'underline' });

          if (el.style.fontSize) {
            const parsedSize = parseFloat(el.style.fontSize);
            if (!isNaN(parsedSize) && parsedSize > 0) {
              marks.push({ type: 'fontSize', size: parsedSize });
            }
          }
          if (el.style.color) {
            marks.push({ type: 'color', color: el.style.color });
          }
          if (el.style.fontFamily) {
            marks.push({ type: 'fontFamily', family: el.style.fontFamily.replace(/['"]/g, '') });
          }

          if (tag === 'br') {
            inlineNodes.push({ type: 'hardBreak' });
          } else {
            el.childNodes.forEach((child) => traverse(child, marks));
          }
        }
      }

      traverse(blockEl, []);

      const blockText = inlineNodes
        .filter((n): n is { type: 'text'; text: string } => n.type === 'text')
        .map((n) => n.text)
        .join('');

      if (blockText.trim() || inlineNodes.length > 0) {
        const dir = (blockEl.getAttribute('dir') as 'rtl' | 'ltr') || detectTextDirection(blockText, options.defaultDirection ?? 'rtl');
        paragraphs.push({
          type: 'paragraph',
          direction: dir,
          alignment: 'start',
          content: inlineNodes,
        });
      }
    });
  } else {
    // Basic regex fallback for non-DOM environments
    const textOnly = sanitizedHtml.replace(/<[^>]+>/g, '\n');
    const lines = textOnly.split('\n').filter((l) => l.trim().length > 0);

    for (const line of lines) {
      const dir = detectTextDirection(line, options.defaultDirection ?? 'rtl');
      paragraphs.push({
        type: 'paragraph',
        direction: dir,
        alignment: 'start',
        content: [{ type: 'text', text: line }],
      });
    }
  }

  const finalParagraphs = paragraphs.length > 0 ? paragraphs : [paragraph('', options.defaultDirection ?? 'rtl')];

  if (finalParagraphs.length > limits.maxParagraphCount) {
    throw new Error(`Paragraph count (${finalParagraphs.length}) exceeds resource limit of ${limits.maxParagraphCount}`);
  }

  const story: RichTextDocument = {
    type: 'doc',
    content: finalParagraphs,
  };

  const fullText = finalParagraphs
    .map((p) => p.content.map((c) => (c.type === 'text' ? c.text : '')).join(''))
    .join(' ');
  const words = fullText.trim().split(/\s+/).filter(Boolean);

  return {
    type: 'story',
    story,
    paragraphCount: story.content.length,
    wordCount: words.length,
    detectedFormat: 'html',
    warnings: [],
  };
}
