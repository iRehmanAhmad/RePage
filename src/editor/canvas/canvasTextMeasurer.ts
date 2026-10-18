/**
 * Canvas-measured ChainTextMeasurer adapter.
 *
 * Measures word advance widths with an offscreen 2D canvas in the frame's real
 * font, so linked-frame slice boundaries approximate what the canvas renderer
 * will actually wrap — much closer than the average-glyph heuristic for wide
 * scripts like Nastaleeq.
 *
 * Architecture: this adapter lives in `editor/canvas/` (the layer that owns the
 * live viewport). `domain/` never constructs it; headless paths (export,
 * overflow flags, story fork, tests) keep the deterministic heuristic.
 *
 * Honest limits:
 * - Words are measured in isolation: cross-word joining effects (an Urdu word's
 *   edge glyphs reshaping against its neighbour) are not captured.
 * - If the frame's font is not loaded yet (`document.fonts.check` fails), the
 *   token falls back to the heuristic width instead of measuring with a wrong
 *   fallback font — an honest approximation beats a confidently wrong measure.
 * - Returns null outside a DOM environment (SSR/tests); callers must fall back.
 */
import type { ChainTextMeasurer } from '../../domain/document/textFlow';
import type { TextFrameObject } from '../../domain/document/types';

/** Must match the ratio used by estimateFrameCharCapacity in domain. */
const AVG_CHAR_WIDTH_RATIO = 0.45;

export function createCanvasTextMeasurer(): ChainTextMeasurer | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const widthCache = new Map<string, number>();
  const fontSpec = (frame: TextFrameObject): string =>
    `${frame.fontSize}px "${frame.fontFamily}"`;

  const isFontLoaded = (frame: TextFrameObject): boolean => {
    try {
      const fonts = (document as Document).fonts;
      if (!fonts || typeof fonts.check !== 'function') return true;
      // check() with the exact spec: false means we'd measure a fallback font.
      return fonts.check(fontSpec(frame));
    } catch {
      return true;
    }
  };

  return {
    measureTokenPx(token: string, frame: TextFrameObject): number {
      const key = `${fontSpec(frame)}|${token}`;
      const cached = widthCache.get(key);
      if (cached !== undefined) return cached;
      let width: number;
      if (token.length === 0) {
        width = 0;
      } else if (isFontLoaded(frame)) {
        ctx.font = fontSpec(frame);
        width = ctx.measureText(token).width;
      } else {
        // Honest fallback: same average-glyph math as the domain heuristic.
        width = token.length * frame.fontSize * AVG_CHAR_WIDTH_RATIO;
      }
      widthCache.set(key, width);
      return width;
    },
    lineHeightPx(frame: TextFrameObject): number {
      return Math.max(1, frame.fontSize * frame.lineHeight);
    },
  };
}
