import { describe, expect, it } from 'vitest';
import {
  applyKashidaInsertions,
  buildKashidaDisplayText,
  effectiveJustificationMode,
  findKashidaPoints,
  layoutKashidaLines,
  paragraphUsesKashida,
  planLineKashida,
} from './kashida';
import type { ParagraphNode } from '../rich-text/types';

const TATWEEL = '\u0640';
const ZWNJ = '\u200c';

/** Deterministic measurer: every code point is 10 units wide. */
const measure10 = (s: string): number => [...s].length * 10;

function para(partial: Partial<ParagraphNode>, text: string): ParagraphNode {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
    ...partial,
  } as ParagraphNode;
}

describe('findKashidaPoints', () => {
  it('finds points inside a fully-joining word', () => {
    // محمد: م joins forward, ح joins forward, م joins forward.
    const text = 'محمد';
    const points = findKashidaPoints(text);
    // Before ح (1), before second م (2), before د (3).
    expect(points).toEqual([1, 2, 3]);
  });

  it('finds no points in اردو (every letter is a non-joiner)', () => {
    expect(findKashidaPoints('اردو')).toEqual([]);
  });

  it('never inserts at word boundaries or inside Latin/digit runs', () => {
    expect(findKashidaPoints('hello world')).toEqual([]);
    expect(findKashidaPoints('۱۲۳۴۵')).toEqual([]);
    const points = findKashidaPoints('abc محمد xyz');
    // Only the three internal points of محمد (offset 4..7 in the string).
    expect(points).toEqual([5, 6, 7]);
  });

  it('respects ZWNJ: no stretch across an explicit non-joiner', () => {
    const text = `نیم${ZWNJ}فاصله`;
    const points = findKashidaPoints(text);
    // فاصله starts at index 4; a point before ف (index 4) would cross
    // the ZWNJ and must not be offered.
    expect(points).not.toContain(4);
    // Points inside فاصله (before ا after ف? ف joins forward → before ا
    // is valid; ا does not join forward so nothing after it).
    expect(points).toContain(5);
  });

  it('keeps combining marks glued to their base letter', () => {
    // م + damma (U+064F) + حمد: the point before ح must come after the mark.
    const text = 'م\u064fحمد';
    const points = findKashidaPoints(text);
    expect(points).toContain(2); // offset of ح, i.e. after م + damma
    expect(points).not.toContain(1); // never between base and its mark
  });
});

describe('planLineKashida', () => {
  it('distributes whole tatweels round-robin and reports residual slack', () => {
    const plan = planLineKashida('محمد محمد', 25, 10);
    expect(plan.insertions.reduce((sum, i) => sum + i.count, 0)).toBe(2);
    expect(plan.residualSlack).toBe(5);
    // Round-robin: the first two points get one each.
    expect(plan.insertions.map((i) => i.count)).toEqual([1, 1]);
  });

  it('caps tatweels per point', () => {
    const plan = planLineKashida('محمد', 10_000, 10);
    // 3 points × cap 3 = 9 tatweels max.
    expect(plan.insertions.reduce((sum, i) => sum + i.count, 0)).toBe(9);
    expect(plan.insertions.every((i) => i.count <= 3)).toBe(true);
  });

  it('returns no insertions without points or slack', () => {
    expect(planLineKashida('اردو', 100, 10).insertions).toEqual([]);
    expect(planLineKashida('محمد', 0, 10).insertions).toEqual([]);
    expect(planLineKashida('محمد', 100, 10).residualSlack).toBeLessThan(100);
  });
});

describe('applyKashidaInsertions', () => {
  it('inserts tatweels at the planned offsets only', () => {
    const out = applyKashidaInsertions('محمد', [{ index: 3, count: 2 }]);
    expect(out).toBe(`محم${TATWEEL}${TATWEEL}د`);
  });
});

describe('layoutKashidaLines', () => {
  it('justifies non-final lines with tatweels and leaves the final line plain', () => {
    // Each word is 4 chars = 40 units; space = 10. Two words = 90.
    // maxWidth 100 → first line holds two words with slack 10 = 1 tatweel.
    const lines = layoutKashidaLines('بببب بببب بببب', 100, measure10);
    expect(lines).toHaveLength(2);
    expect(lines[0]!.isFinal).toBe(false);
    expect(lines[0]!.renderText).toBe(`ب${TATWEEL}ببب بببب`);
    expect(lines[0]!.text).toBe('بببب بببب');
    expect(lines[1]!.isFinal).toBe(true);
    expect(lines[1]!.renderText).toBe('بببب');
  });

  it('treats hard line breaks as segment ends (last line of each is final)', () => {
    const lines = layoutKashidaLines('بببب\nبببب بببب بببب', 100, measure10);
    expect(lines.map((l) => l.isFinal)).toEqual([true, false, true]);
  });

  it('does not stretch lines that already fill or overflow the measure', () => {
    const lines = layoutKashidaLines('بببببببببببب بببب', 100, measure10);
    // First word (12 chars = 120) overflows alone; no kashida applied.
    expect(lines[0]!.renderText).toBe('بببببببببببب');
    expect(lines[0]!.renderText).not.toContain(TATWEEL);
  });
});

describe('mode resolution + stored-text invariant', () => {
  it('defaults RTL justified paragraphs to kashida and LTR to space', () => {
    expect(effectiveJustificationMode(para({ direction: 'rtl' }, 'x'))).toBe('kashida');
    expect(effectiveJustificationMode(para({ direction: 'ltr' }, 'x'))).toBe('space');
    expect(
      effectiveJustificationMode(para({ direction: 'rtl', justificationMode: 'space' }, 'x')),
    ).toBe('space');
    expect(
      effectiveJustificationMode(para({ direction: 'ltr', justificationMode: 'kashida' }, 'x')),
    ).toBe('kashida');
  });

  it('only applies when the paragraph is justified', () => {
    expect(paragraphUsesKashida(para({ direction: 'rtl', alignment: 'justify' }, 'x'))).toBe(true);
    expect(paragraphUsesKashida(para({ direction: 'rtl', alignment: 'start' }, 'x'))).toBe(false);
    expect(paragraphUsesKashida(para({ direction: 'ltr', alignment: 'justify' }, 'x'))).toBe(false);
  });

  it('buildKashidaDisplayText returns null for non-kashida paragraphs', () => {
    expect(
      buildKashidaDisplayText(para({ direction: 'rtl', alignment: 'start' }, 'محمد محمد'), 100, measure10),
    ).toBeNull();
    expect(
      buildKashidaDisplayText(
        para({ direction: 'rtl', alignment: 'justify', justificationMode: 'space' }, 'محمد محمد محمد'),
        100,
        measure10,
      ),
    ).toBeNull();
  });

  it('rendering never mutates the stored paragraph or its text', () => {
    const paragraph = para(
      { direction: 'rtl', alignment: 'justify' },
      'بببب بببب بببب بببب بببب بببب',
    );
    const snapshot = JSON.stringify(paragraph);
    const display = buildKashidaDisplayText(paragraph, 100, measure10);
    expect(display).not.toBeNull();
    expect(display!).toContain(TATWEEL);
    // The stored model is byte-identical after rendering.
    expect(JSON.stringify(paragraph)).toBe(snapshot);
    expect(paragraph.content[0]).toEqual({
      type: 'text',
      text: 'بببب بببب بببب بببب بببب بببب',
    });
  });
});
