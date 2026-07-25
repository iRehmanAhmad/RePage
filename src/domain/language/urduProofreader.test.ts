import { describe, expect, it } from 'vitest';
import { proofreadUrduText } from './urduProofreader';

describe('urduProofreader', () => {
  it('detects missing spaces before auxiliary verbs', () => {
    const issues = proofreadUrduText('کیاحال ہے');
    expect(issues.some((i) => i.type === 'missing-space')).toBe(true);
    expect(issues[0]!.replacementSuggestion).toBe('کیا حال');
  });

  it('detects Arabic/Farsi character confusion', () => {
    const issues = proofreadUrduText('كتاب يہ ہے');
    expect(issues.some((i) => i.type === 'character-confusion')).toBe(true);
  });
});
