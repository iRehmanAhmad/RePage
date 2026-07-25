import { createRichTextFromPlainText, TextDirection } from '../../domain/rich-text/types';
import { DEFAULT_RESOURCE_LIMITS, ImportOptions, ImportTextResult, validateResourceLimits } from './importEngine';

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
