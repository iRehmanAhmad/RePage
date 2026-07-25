import { describe, expect, it } from 'vitest';
import { generateSearchVariants } from './searchVariants';

describe('searchVariants', () => {
  it('generates orthographic variants including Aerab-stripped and normalized forms', () => {
    const variants = generateSearchVariants('كِتاب');

    expect(variants).toContain('كِتاب'); // Exact
    expect(variants).toContain('كتاب');  // Aerab stripped
    expect(variants).toContain('کتاب');  // Normalized Urdu Kaf
  });
});
