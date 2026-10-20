import { createRichTextFromPlainText, paragraph as makeParagraph, TextDirection, type ParagraphNode } from '../../domain/rich-text/types';
import { DEFAULT_RESOURCE_LIMITS, ImportOptions, ImportTextResult, validateResourceLimits } from './importEngine';
import {
  assembleImportedDocument,
  cleanImportTitle,
  countStoryWords,
  type DocumentImportResult,
} from './storyAssembler';

const URDU_ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function detectTextDirection(text: string, defaultDir: TextDirection = 'rtl'): TextDirection {
  if (!text || text.trim().length === 0) return defaultDir;

  let rtlChars = 0;
  let ltrChars = 0;

  for (const char of text) {
    if (URDU_ARABIC_REGEX.test(char)) {
      rtlChars++;
    } else if (/[a-zA-Z]/.test(char)) {
      ltrChars++;
    }
  }

  if (rtlChars > ltrChars) return 'rtl';
  if (ltrChars > rtlChars) return 'ltr';
  return defaultDir;
}

export function importPlainText(
  rawContent: string | ArrayBuffer,
  options: ImportOptions = {},
): ImportTextResult {
  let contentText: string;

  if (typeof rawContent === 'string') {
    contentText = rawContent;
  } else {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    try {
      contentText = decoder.decode(rawContent);
    } catch {
      throw new Error('Invalid UTF-8 encoding detected in plain text import');
    }
  }

  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  validateResourceLimits(new Blob([contentText]).size, limits);

  const direction = detectTextDirection(contentText, options.defaultDirection ?? 'rtl');
  const story = createRichTextFromPlainText(contentText, direction);

  if (story.content.length > limits.maxParagraphCount) {
    throw new Error(`Paragraph count (${story.content.length}) exceeds resource limit of ${limits.maxParagraphCount}`);
  }

  const words = contentText.trim().split(/\s+/).filter(Boolean);

  return {
    type: 'story',
    story,
    paragraphCount: story.content.length,
    wordCount: words.length,
    detectedFormat: 'txt',
    warnings: [],
  };
}

/**
 * End-to-end plain-text import: text -> validated canonical RePageDocument
 * plus an honest import report (same contract as `importDocxFile`).
 *
 * Paragraph model matches `createRichTextFromPlainText`: every line is a
 * paragraph (blank lines become empty paragraphs so vertical spacing in the
 * source survives); only blank lines at the very start/end of the file are
 * trimmed. Line content is preserved byte-for-byte — lines are split on
 * CRLF / CR / LF solely as line terminators, and no character normalization
 * of any kind is applied (joiners, bidi controls and combining marks stay).
 */
export async function importTextFile(
  data: string | ArrayBuffer | Uint8Array,
  filename = 'document.txt',
  options: ImportOptions = {},
): Promise<DocumentImportResult> {
  let contentText: string;
  if (typeof data === 'string') {
    contentText = data;
  } else {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    try {
      contentText = decoder.decode(data);
    } catch {
      throw new Error('Invalid UTF-8 encoding detected in plain text import');
    }
  }
  // A UTF-8 BOM is an encoding signature, not content (TextDecoder already
  // strips it for byte input; do the same for string input).
  if (contentText.charCodeAt(0) === 0xfeff) {
    contentText = contentText.slice(1);
  }

  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  validateResourceLimits(new Blob([contentText]).size, limits);

  const defaultDir = options.defaultDirection ?? 'rtl';
  const docDirection = detectTextDirection(contentText, defaultDir);

  const lines = contentText.split(/\r\n|\r|\n/);
  // Trim blank lines at the file edges only; interior blanks stay as
  // empty paragraphs (source spacing is content).
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start]!.trim() === '') start++;
  while (end > start && lines[end - 1]!.trim() === '') end--;

  const paragraphs: ParagraphNode[] = [];
  for (let i = start; i < end; i++) {
    const line = lines[i]!;
    if (line === '') {
      paragraphs.push(makeParagraph('', docDirection));
    } else {
      paragraphs.push({
        type: 'paragraph',
        direction: detectTextDirection(line, docDirection),
        alignment: 'start',
        content: [{ type: 'text', text: line }],
      });
    }
  }
  if (paragraphs.length === 0) {
    paragraphs.push(makeParagraph('', docDirection));
  }

  if (paragraphs.length > limits.maxParagraphCount) {
    throw new Error(
      `Paragraph count (${paragraphs.length}) exceeds resource limit of ${limits.maxParagraphCount}`,
    );
  }

  const warnings: string[] = [];
  if (contentText.trim() === '') {
    warnings.push('The text file contained no text; an empty document was created.');
  }

  const { document } = await assembleImportedDocument({
    title: cleanImportTitle(filename, 'Imported text document'),
    storyName: 'Imported text content',
    blocks: paragraphs.map((node) => ({ kind: 'paragraph' as const, node })),
    fallbackParagraph: makeParagraph('', docDirection),
  });

  return {
    document,
    report: {
      filename,
      paragraphCount: paragraphs.length,
      wordCount: countStoryWords(paragraphs),
      headingCount: 0,
      listItemCount: 0,
      tableCount: 0,
      imageCount: 0,
      footnoteCount: 0,
      pageCount: document.pageOrder.length,
      dropped: [],
      warnings,
    },
  };
}
