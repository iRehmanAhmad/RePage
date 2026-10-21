import { describe, expect, it } from 'vitest';
import { layoutCircleText, splitIntoArcSegments } from './circleText';

/** Deterministic measurer: 10 units per code point. */
const measure10 = (s: string): number => [...s].length * 10;

describe('splitIntoArcSegments', () => {
  it('keeps a joining Arabic word in one segment', () => {
    expect(splitIntoArcSegments('محمد')).toEqual(['محمد']);
    expect(splitIntoArcSegments('کتاب')).toEqual(['کتا', 'ب']);
  });

  it('splits اردو into isolated letters (they never join)', () => {
    expect(splitIntoArcSegments('اردو')).toEqual(['ا', 'ر', 'د', 'و']);
  });

  it('segments Latin text per character and spaces separately', () => {
    expect(splitIntoArcSegments('AB CD')).toEqual(['A', 'B', ' ', 'C', 'D']);
  });

  it('keeps combining marks with their base letter', () => {
    // ب + fatha (U+064B is in the combining range) stays one segment.
    const segments = splitIntoArcSegments('بً');
    expect(segments).toEqual(['بً']);
  });
});

describe('layoutCircleText', () => {
  const base = { cx: 0, cy: 0, radius: 100, measure: measure10 };

  it('centers LTR text on the top anchor, advancing clockwise', () => {
    const layout = layoutCircleText('AB', base);
    expect(layout.segments).toHaveLength(2);
    const [a, b] = layout.segments as [
      (typeof layout.segments)[0],
      (typeof layout.segments)[0],
    ];
    // Total arc 20 on r=100 → half-span ≈ 5.73°. A's center sits at
    // -90° - 2.86°, B's at -90° + 2.86°.
    expect(a.x).toBeCloseTo(100 * Math.cos((-92.86 * Math.PI) / 180), 1);
    expect(a.y).toBeCloseTo(100 * Math.sin((-92.86 * Math.PI) / 180), 1);
    expect(b.x).toBeCloseTo(100 * Math.cos((-87.14 * Math.PI) / 180), 1);
    expect(a.rotationDeg).toBeCloseTo(-2.86, 1);
    expect(b.rotationDeg).toBeCloseTo(2.86, 1);
    expect(layout.fits).toBe(true);
  });

  it('RTL text advances counter-clockwise from the top anchor', () => {
    const layout = layoutCircleText('اب اب', { ...base, rtl: true });
    // Segments: 'ا','ب' (isolated letters), space skipped, 'ا','ب'.
    const visible = layout.segments;
    expect(visible.map((s) => s.text)).toEqual(['ا', 'ب', 'ا', 'ب']);
    // First letter is right of top center (x > 0), last is left (x < 0).
    expect(visible[0]!.x).toBeGreaterThan(0);
    expect(visible[visible.length - 1]!.x).toBeLessThan(0);
  });

  it('flip anchors at the bottom and inverts the rotation', () => {
    const layout = layoutCircleText('AB', { ...base, flip: true });
    const [a] = layout.segments as [(typeof layout.segments)[0]];
    // Bottom anchor ≈ +90°; flipped rotation is θ - 90 (≈ +2.86° here),
    // i.e. the mirror of the top-arc rotation for the same segment.
    expect(a.y).toBeGreaterThan(90);
    expect(a.rotationDeg).toBeCloseTo(2.86, 1);
  });

  it('startAngleDeg rotates the anchor', () => {
    const layout = layoutCircleText('A', { ...base, startAngleDeg: 90 });
    const [a] = layout.segments as [(typeof layout.segments)[0]];
    // Anchor -90 + 90 = 0° → east point.
    expect(a.x).toBeCloseTo(100, 1);
    expect(a.y).toBeCloseTo(0, 1);
  });

  it('reports fits=false when the text exceeds the circumference', () => {
    const layout = layoutCircleText('ABCDEFGHIJKLMNOP', { ...base, radius: 10 });
    expect(layout.fits).toBe(false);
    expect(layout.spanDeg).toBeGreaterThan(360);
  });

  it('handles empty text and a single character', () => {
    expect(layoutCircleText('', base)).toEqual({
      segments: [],
      arcLength: 0,
      spanDeg: 0,
      fits: true,
    });
    const single = layoutCircleText('A', base);
    expect(single.segments).toHaveLength(1);
    expect(single.segments[0]!.x).toBeCloseTo(0, 1);
    expect(single.segments[0]!.y).toBeCloseTo(-100, 1);
  });
});
