import { describe, expect, it } from 'vitest';
import { importHtml } from './htmlImporter';

describe('htmlImporter', () => {
  it('strips script tags and converts paragraph markup to canonical story', () => {
    const html = '<p dir="rtl"><b>اردو</b> عنوان</p><script>alert("XSS")</script><p>دوسری سطر</p>';
    const result = importHtml(html);

    expect(result.type).toBe('story');
    expect(result.detectedFormat).toBe('html');
    expect(result.paragraphCount).toBeGreaterThanOrEqual(1);

    // Verify script was stripped
    const fullText = JSON.stringify(result.story);
    expect(fullText).not.toContain('alert');
    expect(fullText).not.toContain('script');
  });
});
