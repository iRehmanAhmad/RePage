import { describe, expect, it } from 'vitest';
import { detectTextDirection, importPlainText } from './textImporter';

describe('textImporter', () => {
  it('detects Urdu / Arabic text direction as rtl', () => {
    expect(detectTextDirection('یہ ایک اردو مضمون ہے')).toBe('rtl');
    expect(detectTextDirection('This is English text')).toBe('ltr');
  });

  it('imports valid UTF-8 plain text string into canonical RichTextDocument', () => {
    const text = 'پہلا پیراگراف\nدوسرا پیراگراف';
    const result = importPlainText(text);

    expect(result.type).toBe('story');
    expect(result.detectedFormat).toBe('txt');
    expect(result.paragraphCount).toBe(2);
    expect(result.story.content[0].direction).toBe('rtl');
  });

  it('rejects oversized text exceeding file size resource limit', () => {
    const hugeText = 'A'.repeat(1000);
    expect(() =>
      importPlainText(hugeText, {
        resourceLimits: { maxFileSizeBytes: 500, maxParagraphCount: 50000, maxVectorElements: 10000, parseTimeoutMs: 5000 },
      }),
    ).toThrow(/File size/);
  });
});
