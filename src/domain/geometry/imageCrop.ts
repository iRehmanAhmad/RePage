import type { ImageCropInsets } from '../document/types';

/**
 * Shared crop math for image frames. The document model stores crop as
 * insets — fractions of the source image trimmed from each edge. Every
 * renderer (Fabric canvas, print DOM, DOCX) derives its native crop
 * representation from the helpers here so the visible region is identical
 * everywhere: the source region left after trimming the insets, stretched
 * into the frame. Cropping is non-destructive — asset bytes never change.
 */

/** Maximum inset per edge, per the document schema. */
export const MAX_IMAGE_CROP_INSET = 0.45;

const NO_CROP: ImageCropInsets = { left: 0, top: 0, right: 0, bottom: 0 };

function clampInset(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_IMAGE_CROP_INSET, Math.max(0, value));
}

/** Clamps arbitrary input into schema-valid insets (0–0.45 per edge). */
export function clampImageCropInsets(crop: ImageCropInsets): ImageCropInsets {
  return {
    left: clampInset(crop.left),
    top: clampInset(crop.top),
    right: clampInset(crop.right),
    bottom: clampInset(crop.bottom),
  };
}

/** True when no crop is stored or every inset is zero. */
export function isImageCropEmpty(crop: ImageCropInsets | undefined): boolean {
  if (!crop) return true;
  return crop.left === 0 && crop.top === 0 && crop.right === 0 && crop.bottom === 0;
}

/** The visible source region as fractions of the source image (0–1). */
export interface CropSourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cropSourceRect(crop: ImageCropInsets | undefined): CropSourceRect {
  const c = crop ? clampImageCropInsets(crop) : NO_CROP;
  return {
    x: c.left,
    y: c.top,
    width: 1 - c.left - c.right,
    height: 1 - c.top - c.bottom,
  };
}

/** The visible source region in pixels, for a natural (intrinsic) image size. */
export function cropSourceRectPx(
  naturalWidth: number,
  naturalHeight: number,
  crop: ImageCropInsets | undefined,
): CropSourceRect {
  const rect = cropSourceRect(crop);
  return {
    x: rect.x * naturalWidth,
    y: rect.y * naturalHeight,
    width: rect.width * naturalWidth,
    height: rect.height * naturalHeight,
  };
}

/**
 * DOM layout for rendering a cropped image inside a frame-sized clipping
 * box: the full image is scaled up so the visible region exactly fills the
 * frame, then shifted by the negative inset offsets. Sizes/offsets are in
 * the same unit as the frame (points in the print exporter).
 */
export interface CropFrameLayout {
  imageWidth: number;
  imageHeight: number;
  offsetX: number;
  offsetY: number;
}

export function cropFrameLayout(
  frameWidth: number,
  frameHeight: number,
  crop: ImageCropInsets | undefined,
): CropFrameLayout {
  const rect = cropSourceRect(crop);
  const imageWidth = frameWidth / rect.width;
  const imageHeight = frameHeight / rect.height;
  return {
    imageWidth,
    imageHeight,
    offsetX: -rect.x * imageWidth,
    offsetY: -rect.y * imageHeight,
  };
}

/**
 * DrawingML `a:srcRect` values (integers, thousandths of a percent:
 * fraction × 100000), or null when there is no crop to express.
 */
export function cropSrcRectValues(
  crop: ImageCropInsets | undefined,
): { l: number; t: number; r: number; b: number } | null {
  if (isImageCropEmpty(crop)) return null;
  const c = clampImageCropInsets(crop!);
  const toSrcRect = (fraction: number): number => Math.round(fraction * 100000);
  return {
    l: toSrcRect(c.left),
    t: toSrcRect(c.top),
    r: toSrcRect(c.right),
    b: toSrcRect(c.bottom),
  };
}
