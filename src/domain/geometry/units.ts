export const POINTS_PER_INCH = 72;
export const MILLIMETRES_PER_INCH = 25.4;
export const CSS_PIXELS_PER_INCH = 96;

export function millimetresToPoints(value: number): number {
  return (value / MILLIMETRES_PER_INCH) * POINTS_PER_INCH;
}

export function pointsToMillimetres(value: number): number {
  return (value / POINTS_PER_INCH) * MILLIMETRES_PER_INCH;
}

export function pointsToCssPixels(value: number, zoom = 1): number {
  return (value / POINTS_PER_INCH) * CSS_PIXELS_PER_INCH * zoom;
}

export function cssPixelsToPoints(value: number, zoom = 1): number {
  if (!Number.isFinite(zoom) || zoom <= 0) {
    throw new RangeError('Zoom must be a finite positive number.');
  }

  return (value / zoom / CSS_PIXELS_PER_INCH) * POINTS_PER_INCH;
}

export function inchesToPoints(value: number): number {
  return value * POINTS_PER_INCH;
}

export function pointsToInches(value: number): number {
  return value / POINTS_PER_INCH;
}

export const PAGE_PRESETS = {
  a4: {
    name: 'A4',
    width: millimetresToPoints(210),
    height: millimetresToPoints(297),
  },
  a5: {
    name: 'A5',
    width: millimetresToPoints(148),
    height: millimetresToPoints(210),
  },
  a3: {
    name: 'A3',
    width: millimetresToPoints(297),
    height: millimetresToPoints(420),
  },
  letter: {
    name: 'Letter',
    width: POINTS_PER_INCH * 8.5,
    height: POINTS_PER_INCH * 11,
  },
  legal: {
    name: 'Legal',
    width: POINTS_PER_INCH * 8.5,
    height: POINTS_PER_INCH * 14,
  },
  book6x9: {
    name: '6×9 inch Book',
    width: POINTS_PER_INCH * 6,
    height: POINTS_PER_INCH * 9,
  },
} as const;
