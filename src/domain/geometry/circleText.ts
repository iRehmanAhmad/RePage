import {
  isArabicCombiningMark,
  isArabicScriptLetter,
  isRightJoiningLetter,
  TATWEEL,
  ZWJ,
  ZWNJ,
} from '../unicode/arabicJoining';

/**
 * Geometry for text on a circle (stamps, seals, logos, badges).
 *
 * The text is split into arc SEGMENTS — maximal runs that shape
 * correctly in isolation. For Arabic script a segment ends after a
 * space, after a ZWNJ, or after a right-joining letter, so every
 * segment's internal letter joining survives being rendered as one
 * shaped unit (a Fabric Text / DOM span). Latin text segments per
 * character, the classic badge look. Each segment is then placed on
 * the circle with the shared math here, so the canvas renderer and the
 * print exporter agree exactly.
 *
 * Coordinates are screen space (x right, y DOWN); angles are degrees
 * measured clockwise from east, so the top of the circle is -90° and
 * the bottom is +90°. A segment's rotation is its tangent angle:
 * upright-on-top text has rotation θ + 90; flipped (bottom-arc) text
 * has rotation θ - 90 so its "up" points toward the center and it reads
 * without turning the page — the standard badge convention.
 *
 * Reading order: LTR text on the top arc advances clockwise; RTL text
 * on the top arc advances counter-clockwise (first letter at the
 * right). Flipping reverses both. startAngleDeg rotates the ring's
 * anchor (top when not flipped, bottom when flipped) clockwise.
 */

export interface CircleTextSegmentLayout {
  text: string;
  /** Center of the segment on the circle, in frame-local units. */
  x: number;
  y: number;
  /** Clockwise rotation in degrees for the segment's baseline. */
  rotationDeg: number;
}

export interface CircleTextLayoutOptions {
  cx: number;
  cy: number;
  radius: number;
  startAngleDeg?: number | undefined;
  flip?: boolean | undefined;
  rtl?: boolean | undefined;
  /** Advance width of a whole segment string, in the same unit as radius. */
  measure: (segmentText: string) => number;
}

export interface CircleTextLayout {
  segments: CircleTextSegmentLayout[];
  /** Total arc length consumed by the text. */
  arcLength: number;
  /** Angular span in degrees. */
  spanDeg: number;
  /** False when the text needs more than the full circumference. */
  fits: boolean;
}

function joinsForward(cp: number, ch: string): boolean {
  if (ch === TATWEEL || ch === ZWJ) return true;
  if (ch === ZWNJ) return false;
  return isArabicScriptLetter(cp) && !isRightJoiningLetter(cp);
}

function joinsBackward(cp: number, ch: string): boolean {
  if (ch === TATWEEL) return true;
  return isArabicScriptLetter(cp);
}

/**
 * Splits text into shaping-safe arc segments (see module docs). Spaces
 * are segments of their own (measured, never rendered as glyphs by
 * callers that draw visible units — renderers may skip whitespace-only
 * segments visually but they still consume arc).
 */
export function splitIntoArcSegments(text: string): string[] {
  const segments: string[] = [];
  let current = '';
  let lastSignificantCp = -1;
  let lastSignificantCh = '';

  const flush = () => {
    if (current.length > 0) segments.push(current);
    current = '';
    lastSignificantCp = -1;
    lastSignificantCh = '';
  };

  for (const ch of text) {
    const cp = ch.codePointAt(0)!;

    if (ch === ' ' || ch === '\t') {
      flush();
      segments.push(ch);
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      flush();
      continue;
    }

    // Combining marks always stay with their base letter.
    if (isArabicCombiningMark(cp)) {
      current += ch;
      continue;
    }

    if (current.length > 0) {
      const connected =
        joinsForward(lastSignificantCp, lastSignificantCh) && joinsBackward(cp, ch);
      if (!connected) flush();
    }

    current += ch;
    lastSignificantCp = cp;
    lastSignificantCh = ch;
  }
  flush();
  return segments;
}

/**
 * Lays out text along a circular path. Empty text yields no segments
 * (and `fits: true`) so renderers never divide by a zero arc.
 */
export function layoutCircleText(
  text: string,
  options: CircleTextLayoutOptions,
): CircleTextLayout {
  const { cx, cy, radius, measure } = options;
  const flip = options.flip ?? false;
  const rtl = options.rtl ?? false;
  const startAngleDeg = options.startAngleDeg ?? 0;

  const rawSegments = splitIntoArcSegments(text ?? '');
  if (rawSegments.length === 0 || radius <= 0) {
    return { segments: [], arcLength: 0, spanDeg: 0, fits: true };
  }

  const widths = rawSegments.map((seg) => Math.max(0, measure(seg)));
  const arcLength = widths.reduce((sum, w) => sum + w, 0);
  const spanDeg = (arcLength / radius) * (180 / Math.PI);

  const anchorDeg = (flip ? 90 : -90) + startAngleDeg;
  // Reading advances clockwise (+1) for LTR top arc and RTL bottom arc.
  const dirSign = rtl === flip ? 1 : -1;

  const segments: CircleTextSegmentLayout[] = [];
  let cursor = -arcLength / 2;
  rawSegments.forEach((seg, i) => {
    const w = widths[i]!;
    const centerOffset = cursor + w / 2;
    cursor += w;
    if (seg.trim().length === 0) return; // whitespace consumes arc only
    const thetaDeg = anchorDeg + dirSign * (centerOffset / radius) * (180 / Math.PI);
    const thetaRad = (thetaDeg * Math.PI) / 180;
    segments.push({
      text: seg,
      x: cx + radius * Math.cos(thetaRad),
      y: cy + radius * Math.sin(thetaRad),
      rotationDeg: flip ? thetaDeg - 90 : thetaDeg + 90,
    });
  });

  return { segments, arcLength, spanDeg, fits: spanDeg <= 360 };
}
