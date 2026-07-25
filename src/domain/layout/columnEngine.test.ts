import { describe, expect, it } from 'vitest';
import { computeColumnRects, computeVerticalTextOffset } from './columnEngine';

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
});
