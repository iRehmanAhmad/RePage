import { describe, expect, it } from 'vitest';
import {
  MAX_IMAGE_CROP_INSET,
  clampImageCropInsets,
  cropFrameLayout,
  cropSourceRect,
  cropSourceRectPx,
  cropSrcRectValues,
  isImageCropEmpty,
} from './imageCrop';

describe('imageCrop helpers', () => {
  it('clamps insets into the schema range (0–0.45 per edge)', () => {
    expect(
      clampImageCropInsets({ left: -0.2, top: 0.1, right: 0.9, bottom: Number.NaN }),
    ).toEqual({ left: 0, top: 0.1, right: MAX_IMAGE_CROP_INSET, bottom: 0 });
  });

  it('detects empty crops', () => {
    expect(isImageCropEmpty(undefined)).toBe(true);
    expect(isImageCropEmpty({ left: 0, top: 0, right: 0, bottom: 0 })).toBe(true);
    expect(isImageCropEmpty({ left: 0.01, top: 0, right: 0, bottom: 0 })).toBe(false);
  });

  it('computes the visible source rect as fractions', () => {
    expect(cropSourceRect(undefined)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    const rect = cropSourceRect({ left: 0.1, top: 0.2, right: 0.3, bottom: 0.05 });
    expect(rect.x).toBeCloseTo(0.1);
    expect(rect.y).toBeCloseTo(0.2);
    expect(rect.width).toBeCloseTo(0.6);
    expect(rect.height).toBeCloseTo(0.75);
  });

  it('computes the visible source rect in pixels', () => {
    expect(
      cropSourceRectPx(200, 100, { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 }),
    ).toEqual({ x: 20, y: 10, width: 160, height: 80 });
  });

  it('scales the full image so the visible region fills the frame', () => {
    // Crop 25% off the left: visible width is 75% of the source, so the
    // image must render at frameWidth / 0.75 and shift left by 25% of that.
    const layout = cropFrameLayout(100, 50, { left: 0.25, top: 0, right: 0, bottom: 0 });
    expect(layout.imageWidth).toBeCloseTo(133.333, 2);
    expect(layout.imageHeight).toBeCloseTo(50);
    expect(layout.offsetX).toBeCloseTo(-33.333, 2);
    expect(layout.offsetY).toBeCloseTo(0);
  });

  it('emits DrawingML srcRect values (thousandths of a percent)', () => {
    expect(cropSrcRectValues(undefined)).toBeNull();
    expect(cropSrcRectValues({ left: 0, top: 0, right: 0, bottom: 0 })).toBeNull();
    expect(
      cropSrcRectValues({ left: 0.1, top: 0.05, right: 0.2, bottom: 0 }),
    ).toEqual({ l: 10000, t: 5000, r: 20000, b: 0 });
  });
});
