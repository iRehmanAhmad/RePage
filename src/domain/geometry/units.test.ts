import { describe, expect, it } from 'vitest';
import {
  cssPixelsToPoints,
  millimetresToPoints,
  pointsToCssPixels,
  pointsToMillimetres,
} from './units';

describe('document unit conversion', () => {
  it('round-trips millimetres and points', () => {
    const value = 210;
    expect(pointsToMillimetres(millimetresToPoints(value))).toBeCloseTo(value, 10);
  });

  it('round-trips CSS pixels at a given zoom', () => {
    const points = 144;
    expect(cssPixelsToPoints(pointsToCssPixels(points, 1.75), 1.75)).toBeCloseTo(points, 10);
  });

  it('rejects invalid zoom', () => {
    expect(() => cssPixelsToPoints(96, 0)).toThrow('Zoom must be a finite positive number.');
  });
});
