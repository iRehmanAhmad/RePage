import type { Insets, Rect } from '../document/types';

export interface ColumnLayoutResult {
  columns: Rect[];
  columnWidth: number;
  usableWidth: number;
  usableHeight: number;
}

/**
 * Computes bounding rectangles for multi-column text frames with RTL / LTR order support.
 */
export function computeColumnRects(
  frameWidth: number,
  frameHeight: number,
  padding: Insets,
  columnsCount = 1,
  columnGap = 12,
  isRtl = true,
): ColumnLayoutResult {
  const count = Math.max(1, columnsCount);
  const usableWidth = Math.max(1, frameWidth - padding.left - padding.right);
  const usableHeight = Math.max(1, frameHeight - padding.top - padding.bottom);

  const totalGaps = Math.max(0, count - 1) * columnGap;
  const columnWidth = Math.max(1, (usableWidth - totalGaps) / count);

  const columns: Rect[] = [];

  for (let i = 0; i < count; i++) {
    // For RTL column order, column 0 starts at the rightmost position
    const colX = isRtl
      ? frameWidth - padding.right - (i + 1) * columnWidth - i * columnGap
      : padding.left + i * (columnWidth + columnGap);

    columns.push({
      x: colX,
      y: padding.top,
      width: columnWidth,
      height: usableHeight,
      rotation: 0,
    });
  }

  return {
    columns,
    columnWidth,
    usableWidth,
    usableHeight,
  };
}

/**
 * Calculates top Y-offset for top, middle, or bottom vertical alignment.
 */
export function computeVerticalTextOffset(
  totalTextHeight: number,
  frameHeight: number,
  padding: Insets,
  alignment: 'top' | 'middle' | 'bottom' = 'top',
): number {
  const usableHeight = Math.max(0, frameHeight - padding.top - padding.bottom);
  const availableSpace = Math.max(0, usableHeight - totalTextHeight);

  if (alignment === 'middle') {
    return padding.top + availableSpace / 2;
  }
  if (alignment === 'bottom') {
    return padding.top + availableSpace;
  }
  return padding.top;
}

export interface ColumnSeparatorGuide {
  x: number;
  startY: number;
  endY: number;
}

/**
 * Computes X coordinates for visual column separators (gutter rules) in multi-column layouts.
 */
export function computeColumnSeparatorGuides(
  frameWidth: number,
  frameHeight: number,
  padding: Insets,
  columnsCount = 1,
  columnGap = 12,
  isRtl = true,
): ColumnSeparatorGuide[] {
  const result = computeColumnRects(frameWidth, frameHeight, padding, columnsCount, columnGap, isRtl);
  if (result.columns.length <= 1) return [];

  const guides: ColumnSeparatorGuide[] = [];
  const startY = padding.top;
  const endY = frameHeight - padding.bottom;

  for (let i = 0; i < result.columns.length - 1; i++) {
    const colA = result.columns[i]!;
    const colB = result.columns[i + 1]!;
    const gapX = (colA.x + colA.width + colB.x) / 2;
    guides.push({ x: gapX, startY, endY });
  }

  return guides;
}

/**
 * Convenience helper to calculate column rects for a document page based on page dimensions and section settings.
 */
export function getSectionColumnGeometry(
  pageWidth: number,
  pageHeight: number,
  margins: Insets,
  columnsCount = 1,
  columnGap = 18,
  isRtl = true,
): ColumnLayoutResult {
  return computeColumnRects(pageWidth, pageHeight, margins, columnsCount, columnGap, isRtl);
}
