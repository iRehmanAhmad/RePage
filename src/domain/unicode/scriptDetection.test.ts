import { describe, it, expect } from 'vitest';
import { classifyChar, classifyRun, segmentByScript } from './scriptDetection';

describe('scriptDetection', () => {
  describe('classifyChar', () => {
    it('classifies Arabic characters', () => {
      expect(classifyChar('ا'.codePointAt(0)!)).toBe('arabic');   // Alef U+0627
      expect(classifyChar('ب'.codePointAt(0)!)).toBe('arabic');   // Beh U+0628
      expect(classifyChar('ﷺ'.codePointAt(0)!)).toBe('arabic');  // Presentation form U+FDFA
    });

    it('classifies Latin characters', () => {
      expect(classifyChar('A'.codePointAt(0)!)).toBe('latin');
      expect(classifyChar('z'.codePointAt(0)!)).toBe('latin');
      expect(classifyChar('é'.codePointAt(0)!)).toBe('latin');   // U+00E9
    });

    it('classifies Western digits', () => {
      expect(classifyChar('0'.codePointAt(0)!)).toBe('digit');
      expect(classifyChar('9'.codePointAt(0)!)).toBe('digit');
    });

    it('classifies Urdu digits as arabic', () => {
      // Urdu digits are in U+06F0-06F9, which falls within the Arabic block
      expect(classifyChar('۰'.codePointAt(0)!)).toBe('arabic');
      expect(classifyChar('۹'.codePointAt(0)!)).toBe('arabic');
    });

    it('classifies whitespace', () => {
      expect(classifyChar(' '.codePointAt(0)!)).toBe('whitespace');
      expect(classifyChar('\t'.codePointAt(0)!)).toBe('whitespace');
    });

    it('classifies punctuation', () => {
      expect(classifyChar('.'.codePointAt(0)!)).toBe('punctuation');
      expect(classifyChar('؟'.codePointAt(0)!)).toBe('punctuation');  // Arabic question mark U+061F
      expect(classifyChar('،'.codePointAt(0)!)).toBe('punctuation');  // Arabic comma U+060C
    });

    it('classifies bidi controls as other', () => {
      expect(classifyChar(0x200c)).toBe('other');  // ZWNJ
      expect(classifyChar(0x200d)).toBe('other');  // ZWJ
      expect(classifyChar(0x200e)).toBe('other');  // LRM
    });
  });

  describe('classifyRun', () => {
    it('returns arabic for pure Urdu text', () => {
      expect(classifyRun('اردو صفحہ')).toBe('arabic');
    });

    it('returns latin for pure English text', () => {
      expect(classifyRun('Hello World')).toBe('latin');
    });

    it('returns the first strong script for mixed text', () => {
      expect(classifyRun('123 RePage')).toBe('latin');
      expect(classifyRun('  اردو')).toBe('arabic');
    });

    it('returns other for neutral-only text', () => {
      expect(classifyRun('123 ...')).toBe('other');
    });
  });

  describe('segmentByScript', () => {
    it('returns empty array for empty string', () => {
      expect(segmentByScript('')).toEqual([]);
    });

    it('returns single segment for pure Urdu text', () => {
      const result = segmentByScript('اردو صفحہ');
      expect(result).toHaveLength(1);
      expect(result[0]!.script).toBe('arabic');
      expect(result[0]!.text).toBe('اردو صفحہ');
    });

    it('returns single segment for pure English text', () => {
      const result = segmentByScript('Hello World');
      expect(result).toHaveLength(1);
      expect(result[0]!.script).toBe('latin');
    });

    it('segments mixed Urdu/English text correctly', () => {
      const result = segmentByScript('یہ RePage سافٹ ویئر ہے');
      // Expected: [arabic("یہ "), latin("RePage "), arabic("سافٹ ویئر ہے")]
      // Note: space after "یہ" inherits arabic (preceding), space after "RePage" inherits...
      // Actually the space between "یہ" and "RePage" — preceded by arabic, followed by latin
      // Forward pass: space inherits arabic. Then R is latin.
      // Space after "RePage" — preceded by latin, followed by arabic.
      // Forward pass: space inherits latin.
      expect(result.length).toBeGreaterThanOrEqual(2);

      // First segment should be arabic
      expect(result[0]!.script).toBe('arabic');
      // Should contain "یہ " (with trailing space)
      expect(result[0]!.text).toContain('یہ');

      // Find the latin segment
      const latinSeg = result.find((s) => s.script === 'latin');
      expect(latinSeg).toBeDefined();
      expect(latinSeg!.text).toContain('RePage');

      // Last segment should be arabic
      expect(result[result.length - 1]!.script).toBe('arabic');
    });

    it('handles digits between Urdu words as arabic', () => {
      const result = segmentByScript('صفحہ 123 اردو');
      // Digits should inherit arabic from surrounding context
      expect(result).toHaveLength(1);
      expect(result[0]!.script).toBe('arabic');
    });

    it('handles version numbers in Latin context', () => {
      const result = segmentByScript('RePage 0.1.0');
      // "RePage" is latin, "0.1.0" digits/punct inherit latin
      expect(result).toHaveLength(1);
      expect(result[0]!.script).toBe('latin');
    });

    it('preserves ZWNJ and ZWJ in segments', () => {
      const text = 'بے\u200Cلگام';  // ZWNJ between characters
      const result = segmentByScript(text);
      expect(result).toHaveLength(1);
      expect(result[0]!.script).toBe('arabic');
      // Verify ZWNJ is preserved
      expect(result[0]!.text).toBe(text);
    });
  });
});
