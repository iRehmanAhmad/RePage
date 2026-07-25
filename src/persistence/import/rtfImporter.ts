import { InlineNode, ParagraphNode, paragraph, RichTextDocument, TextMark } from '../../domain/rich-text/types';
import { DEFAULT_RESOURCE_LIMITS, ImportOptions, ImportTextResult, validateResourceLimits } from './importEngine';
import { detectTextDirection } from './textImporter';

export function importRtf(
  rtfContent: string | ArrayBuffer,
  options: ImportOptions = {},
): ImportTextResult {
  let rawText: string;

  if (typeof rtfContent === 'string') {
    rawText = rtfContent;
  } else {
    rawText = new TextDecoder('utf-8').decode(rtfContent);
  }

  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  validateResourceLimits(new Blob([rawText]).size, limits);

  const warnings: string[] = [];
  const paragraphs: ParagraphNode[] = [];

  // Parse RTF controls
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let fontSize = 12;
  let fontColor = '#000000';

  let currentText = '';
  let currentInline: InlineNode[] = [];

  function flushTextRun() {
    if (!currentText) return;
    const marks: TextMark[] = [];
    if (isBold) marks.push({ type: 'bold' });
    if (isItalic) marks.push({ type: 'italic' });
    if (isUnderline) marks.push({ type: 'underline' });
    if (fontSize !== 12) marks.push({ type: 'fontSize', size: fontSize });
    if (fontColor && fontColor !== '#000000') marks.push({ type: 'color', color: fontColor });

    currentInline.push({
      type: 'text',
      text: currentText,
      marks: marks.length > 0 ? marks : undefined,
    });
    currentText = '';
  }

  function flushParagraph() {
    flushTextRun();
    const paraText = currentInline
      .filter((node): node is { type: 'text'; text: string } => node.type === 'text')
      .map((node) => node.text)
      .join('');

    const dir = detectTextDirection(paraText, options.defaultDirection ?? 'rtl');
    paragraphs.push({
      type: 'paragraph',
      direction: dir,
      alignment: 'start',
      content: currentInline.length > 0 ? currentInline : [],
    });
    currentInline = [];
  }

  let i = 0;
  while (i < rawText.length) {
    const char = rawText[i];

    if (char === '\\') {
      // Control word or symbol
      i++;
      let controlWord = '';
      while (i < rawText.length && /[a-zA-Z]/.test(rawText[i])) {
        controlWord += rawText[i];
        i++;
      }

      // Check numeric parameter if any
      let paramStr = '';
      let isNegative = false;
      if (i < rawText.length && rawText[i] === '-') {
        isNegative = true;
        i++;
      }
      while (i < rawText.length && /[0-9]/.test(rawText[i])) {
        paramStr += rawText[i];
        i++;
      }
      const paramVal = paramStr ? parseInt(paramStr, 10) * (isNegative ? -1 : 1) : null;

      // Skip space delimiter after control word
      if (i < rawText.length && rawText[i] === ' ') {
        i++;
      }

      // Process Control Words
      if (controlWord === 'b') {
        flushTextRun();
        isBold = paramVal !== 0;
      } else if (controlWord === 'i') {
        flushTextRun();
        isItalic = paramVal !== 0;
      } else if (controlWord === 'ul') {
        flushTextRun();
        isUnderline = paramVal !== 0;
      } else if (controlWord === 'ulnone') {
        flushTextRun();
        isUnderline = false;
      } else if (controlWord === 'fs') {
        flushTextRun();
        // RTF font size is in half-points
        if (paramVal !== null) {
          fontSize = paramVal / 2;
        }
      } else if (controlWord === 'par') {
        flushParagraph();
      } else if (controlWord === 'u') {
        // Unicode escape \uN?
        if (paramVal !== null) {
          const charCode = paramVal < 0 ? paramVal + 65536 : paramVal;
          currentText += String.fromCharCode(charCode);
          // RTF specs usually follow \uN with a substitute ASCII char to skip
          if (i < rawText.length && rawText[i] === '?') {
            i++;
          }
        }
      }
    } else if (char === '{' || char === '}') {
      // Ignore group scope brackets for simple text extraction
      i++;
    } else if (char === '\r' || char === '\n') {
      // Ignore raw newlines inside RTF (only \par matters)
      i++;
    } else {
      currentText += char;
      i++;
    }
  }

  flushParagraph();

  const finalParagraphs = paragraphs.filter((p) => p.content.length > 0);
  const story: RichTextDocument = {
    type: 'doc',
    content: finalParagraphs.length > 0 ? finalParagraphs : [paragraph('', options.defaultDirection ?? 'rtl')],
  };

  if (story.content.length > limits.maxParagraphCount) {
    throw new Error(`Paragraph count (${story.content.length}) exceeds resource limit of ${limits.maxParagraphCount}`);
  }

  const fullText = story.content
    .map((p) => p.content.map((c: InlineNode) => (c.type === 'text' ? c.text : '')).join(''))
    .join(' ');
  const words = fullText.trim().split(/\s+/).filter(Boolean);

  return {
    type: 'story',
    story,
    paragraphCount: story.content.length,
    wordCount: words.length,
    detectedFormat: 'rtf',
    warnings,
  };
}
