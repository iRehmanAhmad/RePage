import { describe, expect, it } from 'vitest';
import { BUILTIN_URDU_PARAGRAPH_STYLES, paragraphStyleSchema } from './styles';

describe('Urdu Typography Styles', () => {
  it('validates all built-in Urdu paragraph style presets', () => {
    for (const style of Object.values(BUILTIN_URDU_PARAGRAPH_STYLES)) {
      const result = paragraphStyleSchema.safeParse(style);
      expect(result.success).toBe(true);
    }
  });

  it('contains headline, subheading, body, and poetry presets', () => {
    const keys = Object.keys(BUILTIN_URDU_PARAGRAPH_STYLES);
    expect(keys).toContain('headline');
    expect(keys).toContain('subheading');
    expect(keys).toContain('body');
    expect(keys).toContain('poetry');
  });
});
