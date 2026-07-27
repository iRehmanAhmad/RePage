import { describe, expect, it } from 'vitest';
import {
  computeColumnRects,
  computeColumnSeparatorGuides,
  computeVerticalTextOffset,
  getSectionColumnGeometry,
} from './columnEngine';

describe('columnEngine (M3.2)', () => {
  it('computes 3 columns for RTL Urdu order correctly', () => {
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const result = computeColumnRects(320, 500, padding, 3, 10, true);

    expect(result.columns).toHaveLength(3);
    expect(result.columnWidth).toBeCloseTo(93.33, 1);

    // Column 0 (first RTL column) starts at rightmost position
    expect(result.columns[0]?.x).toBeCloseTo(216.67, 1);
    expect(result.columns[1]?.x).toBeCloseTo(113.33, 1);
    expect(result.columns[2]?.x).toBeCloseTo(10, 1);
  });

  it('computes LTR column ordering correctly', () => {
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const result = computeColumnRects(320, 500, padding, 3, 10, false);

    expect(result.columns[0]?.x).toBeCloseTo(10, 1);
    expect(result.columns[1]?.x).toBeCloseTo(113.33, 1);
    expect(result.columns[2]?.x).toBeCloseTo(216.67, 1);
  });

  it('calculates vertical alignment offsets for top, middle, and bottom', () => {
    const padding = { top: 20, right: 20, bottom: 20, left: 20 };
    const frameHeight = 200; // Usable height = 160
    const textHeight = 60; // Available extra space = 100

    expect(computeVerticalTextOffset(textHeight, frameHeight, padding, 'top')).toBe(20);
    expect(computeVerticalTextOffset(textHeight, frameHeight, padding, 'middle')).toBe(70); // 20 + 50
    expect(computeVerticalTextOffset(textHeight, frameHeight, padding, 'bottom')).toBe(120); // 20 + 100
  });

  it('computes column separator guides (gutter rules)', () => {
    const padding = { top: 20, right: 20, bottom: 20, left: 20 };
    const guides = computeColumnSeparatorGuides(595, 842, padding, 2, 18, true);

    expect(guides).toHaveLength(1);
    expect(guides[0]?.startY).toBe(20);
    expect(guides[0]?.endY).toBe(822);
    expect(guides[0]?.x).toBeCloseTo(297.5, 1);
  });

  it('getSectionColumnGeometry returns column layout for a section page', () => {
    const margins = { top: 40, right: 40, bottom: 40, left: 40 };
    const geom = getSectionColumnGeometry(595, 842, margins, 3, 18, true);

    expect(geom.columns).toHaveLength(3);
    expect(geom.usableWidth).toBe(515);
    expect(geom.usableHeight).toBe(762);
  });
});
