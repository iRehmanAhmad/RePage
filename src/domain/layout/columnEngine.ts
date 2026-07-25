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
