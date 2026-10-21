import type { ImageAdjustments } from '../document/types';

/**
 * Shared math for non-destructive image adjustments. The document model
 * stores percentages (100 = untouched) and mirror flags on the frame;
 * every renderer derives its native representation from the helpers here
 * (Fabric filters + flipX/flipY on canvas, CSS filter + scale transform
 * in print, DrawingML flipH/flipV in DOCX), so the picture looks the same
 * everywhere. Asset bytes are never modified — same rule as image crop.
 *
 * One composition rule, shared by all renderers: flips mirror the
 * CROPPED result (the visible region flips as a whole), matching how
 * DrawingML applies flipH/flipV to a picture with a srcRect.
 */

export const NEUTRAL_IMAGE_ADJUSTMENTS: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  flipH: false,
  flipV: false,
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(200, Math.max(0, value));
}

/** Clamps arbitrary input into schema-valid adjustments (0–200 percent). */
export function clampImageAdjustments(adj: ImageAdjustments): ImageAdjustments {
  return {
    brightness: clampPercent(adj.brightness),
    contrast: clampPercent(adj.contrast),
    flipH: adj.flipH === true,
    flipV: adj.flipV === true,
  };
}

/** True when nothing is stored or every value sits at its default. */
export function isImageAdjustmentsNeutral(adj: ImageAdjustments | undefined): boolean {
  if (!adj) return true;
  return (
    adj.brightness === 100 && adj.contrast === 100 && !adj.flipH && !adj.flipV
  );
}

/**
 * CSS `filter` value for brightness/contrast, or undefined when both are
 * neutral (so renderers can omit the property entirely).
 */
export function imageCssFilter(adj: ImageAdjustments | undefined): string | undefined {
  if (!adj || (adj.brightness === 100 && adj.contrast === 100)) return undefined;
  return `brightness(${adj.brightness / 100}) contrast(${adj.contrast / 100})`;
}

/** Scale factors (-1 mirrors) for DOM transforms / Fabric flip flags. */
export function imageFlipScale(adj: ImageAdjustments | undefined): { scaleX: 1 | -1; scaleY: 1 | -1 } {
  return {
    scaleX: adj?.flipH ? -1 : 1,
    scaleY: adj?.flipV ? -1 : 1,
  };
}

/**
 * Fabric filter offsets: Fabric's Brightness/Contrast filters take a
 * -1..1 offset where 0 is unchanged, so percent maps linearly
 * (120% -> +0.2). Fabric applies the same standard transfer functions as
 * CSS filters, keeping canvas and print in agreement.
 */
export function imageFabricFilterOffsets(adj: ImageAdjustments | undefined): {
  brightness: number;
  contrast: number;
} {
  return {
    brightness: ((adj?.brightness ?? 100) - 100) / 100,
    contrast: ((adj?.contrast ?? 100) - 100) / 100,
  };
}
