import { describe, expect, it } from 'vitest';
import { createCanvasTextMeasurer } from './canvasTextMeasurer';
import type { TextFrameObject } from '../../domain/document/types';

const frame = {
  fontSize: 16,
  lineHeight: 1.5,
  fontFamily: 'Noto Nastaliq Urdu',
} as TextFrameObject;

describe('createCanvasTextMeasurer', () => {
  it('returns null or a working measurer (never throws)', () => {
    const measurer = createCanvasTextMeasurer();
    if (measurer === null) return; // headless/SSR: caller falls back to heuristic
    const w = measurer.measureTokenPx('hello', frame);
    expect(Number.isFinite(w)).toBe(true);
    expect(w).toBeGreaterThanOrEqual(0);
    // Cached: same input measures identically.
    expect(measurer.measureTokenPx('hello', frame)).toBe(w);
    expect(measurer.lineHeightPx(frame)).toBe(16 * 1.5);
    expect(measurer.measureTokenPx('', frame)).toBe(0);
  });
});
