import { InlineNode, ParagraphNode, paragraph, RichTextDocument, TextMark } from '../../domain/rich-text/types';
import { DEFAULT_RESOURCE_LIMITS, ImportOptions, ImportTextResult, validateResourceLimits } from './importEngine';
import { detectTextDirection } from './textImporter';

/**
 * OpenXML / DOCX Importer for Urdu Manuscripts
 *
 * Extracts paragraphs (<w:p>) and text runs (<w:r>) from word/document.xml,
 * parsing formatting (bold <w:b>, italic <w:i>, underline <w:u>, bidi <w:bidi>, font size <w:sz>, color <w:color>).
 */
export function importDocxXml(
  xmlContent: string,
  options: ImportOptions = {},
): ImportTextResult {
  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  validateResourceLimits(new Blob([xmlContent]).size, limits);

  const paragraphs: ParagraphNode[] = [];

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    const pNodes = xmlDoc.getElementsByTagName('w:p');

    Array.from(pNodes).forEach((pEl) => {
      const inlineNodes: InlineNode[] = [];

      // Check bidi / direction properties
      const pPr = pEl.getElementsByTagName('w:pPr')[0];
      let pBidi = false;
      if (pPr) {
        pBidi = pPr.getElementsByTagName('w:bidi').length > 0 || pPr.getElementsByTagName('w:rtl').length > 0;
      }

      const rNodes = pEl.getElementsByTagName('w:r');
      Array.from(rNodes).forEach((rEl) => {
        const textNode = rEl.getElementsByTagName('w:t')[0];
        if (!textNode) return;

        const text = textNode.textContent ?? '';
        if (!text) return;

        const marks: TextMark[] = [];
        const rPr = rEl.getElementsByTagName('w:rPr')[0];

        if (rPr) {
          if (rPr.getElementsByTagName('w:b').length > 0) marks.push({ type: 'bold' });
          if (rPr.getElementsByTagName('w:i').length > 0) marks.push({ type: 'italic' });
          if (rPr.getElementsByTagName('w:u').length > 0) marks.push({ type: 'underline' });

          const colorEl = rPr.getElementsByTagName('w:color')[0];
          if (colorEl && colorEl.getAttribute('w:val')) {
            const hexColor = colorEl.getAttribute('w:val');
            if (hexColor && hexColor !== 'auto') {
              marks.push({ type: 'color', color: `#${hexColor}` });
            }
          }

          const szEl = rPr.getElementsByTagName('w:sz')[0];
          if (szEl && szEl.getAttribute('w:val')) {
            const halfPoints = parseInt(szEl.getAttribute('w:val')!, 10);
            if (!isNaN(halfPoints)) {
              marks.push({ type: 'fontSize', size: halfPoints / 2 });
            }
          }

          const fontEl = rPr.getElementsByTagName('w:rFonts')[0];
          if (fontEl) {
            const family = fontEl.getAttribute('w:cs') || fontEl.getAttribute('w:ascii');
            if (family) {
              marks.push({ type: 'fontFamily', family });
            }
          }
        }

        inlineNodes.push({
          type: 'text',
          text,
          marks: marks.length > 0 ? marks : undefined,
        });
      });

      const fullPText = inlineNodes
        .filter((n): n is { type: 'text'; text: string } => n.type === 'text')
        .map((n) => n.text)
        .join('');

      if (fullPText.trim() || inlineNodes.length > 0) {
        const dir = pBidi ? 'rtl' : detectTextDirection(fullPText, options.defaultDirection ?? 'rtl');
        paragraphs.push({
          type: 'paragraph',
          direction: dir,
          alignment: 'start',
          content: inlineNodes,
        });
      }
    });
  } else {
    // Regex fallback for node environment without DOMParser
    const pMatches = xmlContent.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
    for (const pStr of pMatches) {
      const tMatches = pStr.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const text = tMatches.map((t) => t.replace(/<[^>]+>/g, '')).join('');
      if (text.trim()) {
        const dir = detectTextDirection(text, options.defaultDirection ?? 'rtl');
        paragraphs.push({
          type: 'paragraph',
          direction: dir,
          alignment: 'start',
          content: [{ type: 'text', text }],
        });
      }
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
    detectedFormat: 'docx',
    warnings: [],
  };
}
