import { describe, expect, it } from 'vitest';
import {
  NEUTRAL_IMAGE_ADJUSTMENTS,
  clampImageAdjustments,
  imageCssFilter,
  imageFabricFilterOffsets,
  imageFlipScale,
  isImageAdjustmentsNeutral,
} from './imageAdjustments';

describe('imageAdjustments helpers', () => {
  it('treats 100/100 with no flips as neutral', () => {
    expect(isImageAdjustmentsNeutral(undefined)).toBe(true);
    expect(isImageAdjustmentsNeutral(NEUTRAL_IMAGE_ADJUSTMENTS)).toBe(true);
    expect(isImageAdjustmentsNeutral({ ...NEUTRAL_IMAGE_ADJUSTMENTS, flipH: true })).toBe(false);
    expect(isImageAdjustmentsNeutral({ ...NEUTRAL_IMAGE_ADJUSTMENTS, brightness: 90 })).toBe(false);
  });

  it('clamps percentages into 0..200', () => {
    expect(clampImageAdjustments({ brightness: -5, contrast: 250, flipH: true, flipV: false })).toEqual({
      brightness: 0,
      contrast: 200,
      flipH: true,
      flipV: false,
    });
    // Non-finite input falls back to neutral rather than poisoning the model.
    expect(clampImageAdjustments({ brightness: Number.NaN, contrast: 100, flipH: false, flipV: false }).brightness).toBe(100);
  });

  it('builds a CSS filter only when tone values are non-neutral', () => {
    expect(imageCssFilter(undefined)).toBeUndefined();
    expect(imageCssFilter(NEUTRAL_IMAGE_ADJUSTMENTS)).toBeUndefined();
    expect(
      imageCssFilter({ brightness: 80, contrast: 150, flipH: false, flipV: false }),
    ).toBe('brightness(0.8) contrast(1.5)');
  });

  it('builds flip scale factors for transforms', () => {
    expect(imageFlipScale(undefined)).toEqual({ scaleX: 1, scaleY: 1 });
    expect(imageFlipScale(NEUTRAL_IMAGE_ADJUSTMENTS)).toEqual({ scaleX: 1, scaleY: 1 });
    expect(imageFlipScale({ ...NEUTRAL_IMAGE_ADJUSTMENTS, flipH: true })).toEqual({ scaleX: -1, scaleY: 1 });
    expect(imageFlipScale({ ...NEUTRAL_IMAGE_ADJUSTMENTS, flipV: true })).toEqual({ scaleX: 1, scaleY: -1 });
    expect(
      imageFlipScale({ brightness: 100, contrast: 100, flipH: true, flipV: true }),
    ).toEqual({ scaleX: -1, scaleY: -1 });
  });

  it('converts percentages to Fabric filter offsets', () => {
    expect(imageFabricFilterOffsets(undefined)).toEqual({ brightness: 0, contrast: 0 });
    expect(
      imageFabricFilterOffsets({ brightness: 130, contrast: 70, flipH: false, flipV: false }),
    ).toEqual({ brightness: 0.3, contrast: -0.3 });
  });
});
