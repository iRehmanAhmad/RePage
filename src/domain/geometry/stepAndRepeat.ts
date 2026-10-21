/**
 * Step-and-repeat geometry (Phase 4 batch 12): the pure math behind the
 * grid duplication command. Given an object's frame and a grid spec
 * (rows × columns with gaps expressed in the document's measurement
 * unit), computes the offset of every copy relative to the ORIGINAL —
 * cell (0,0) is the original itself and is excluded from the result.
 *
 * Copies are placed even when they fall (partly) outside the page: the
 * user asked for a grid, and clipping silently would lose copies. The
 * grid is clamped to sane bounds (99 per axis, at most 500 copies) so a
 * typo in the dialog can't mint a hundred thousand objects.
 */

export type MeasurementUnit = 'pt' | 'mm' | 'in';

export const MAX_STEP_AND_REPEAT_DIMENSION = 99;
export const MAX_STEP_AND_REPEAT_COPIES = 500;

export function measurementToPoints(value: number, unit: MeasurementUnit): number {
  if (unit === 'mm') return (value * 72) / 25.4;
  if (unit === 'in') return value * 72;
  return value;
}

export interface StepAndRepeatSpec {
  rows: number;
  columns: number;
  /** Horizontal gap between columns, in points. */
  horizontalGapPoints: number;
  /** Vertical gap between rows, in points. */
  verticalGapPoints: number;
}

export function clampStepAndRepeatSpec(spec: StepAndRepeatSpec): StepAndRepeatSpec {
  const clampDim = (n: number): number =>
    Math.min(MAX_STEP_AND_REPEAT_DIMENSION, Math.max(1, Math.floor(Math.abs(n) || 1)));
  let rows = clampDim(spec.rows);
  let columns = clampDim(spec.columns);
  // Enforce the total-copies cap by shrinking the larger axis.
  while (rows * columns - 1 > MAX_STEP_AND_REPEAT_COPIES) {
    if (columns >= rows) columns -= 1;
    else rows -= 1;
  }
  return {
    rows,
    columns,
    horizontalGapPoints: Math.max(0, spec.horizontalGapPoints || 0),
    verticalGapPoints: Math.max(0, spec.verticalGapPoints || 0),
  };
}

export interface StepAndRepeatCell {
  row: number;
  column: number;
  /** Offset from the original's position, in points. */
  dx: number;
  dy: number;
}

export function stepAndRepeatCells(
  frameWidth: number,
  frameHeight: number,
  spec: StepAndRepeatSpec,
): StepAndRepeatCell[] {
  const { rows, columns, horizontalGapPoints, verticalGapPoints } = clampStepAndRepeatSpec(spec);
  const cells: StepAndRepeatCell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (row === 0 && column === 0) continue;
      cells.push({
        row,
        column,
        dx: column * (frameWidth + horizontalGapPoints),
        dy: row * (frameHeight + verticalGapPoints),
      });
    }
  }
  return cells;
}
