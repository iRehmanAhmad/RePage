import { describe, expect, it } from 'vitest';
import { applyNormalization, previewNormalization } from './characterNormalization';

describe('characterNormalization', () => {
  it('previews character replacement diffs non-destructively', () => {
    const text = 'كتاب يہ ہے';
    const preview = previewNormalization(text);

    expect(preview.replacementCount).toBe(2);
    expect(preview.normalizedText).toBe('کتاب یہ ہے');
    expect(preview.segments.some((s) => s.type === 'replaced')).toBe(true);
  });

  it('applies normalization correctly', () => {
    expect(applyNormalization('كتاب')).toBe('کتاب');
  });
});
