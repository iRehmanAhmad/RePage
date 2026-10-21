import type { JustificationMode, ParagraphNode } from '../rich-text/types';

export type { JustificationMode } from '../rich-text/types';
import {
  isArabicCombiningMark,
  isArabicScriptLetter,
  isRightJoiningLetter,
  TATWEEL,
  ZWJ,
  ZWNJ,
} from '../unicode/arabicJoining';

/**
 * Kashida (کشیدہ) justification — the InPage-style Arabic justification
 * where a justified line absorbs its slack by STRETCHING joinable
 * letters (tatweel U+0640 inserted at valid joining points) instead of
 * only widening the spaces between words.
 *
 * HARD INVARIANT: kashida is a layout/rendering effect ONLY. The stored
 * document text never changes — no tatweel is ever written into the
 * story model, the clipboard, spellcheck input, or exported text
 * content (DOCX export maps the mode to Word's native kashida
 * justification instead). This module only computes WHERE tatweels
 * would go for a line being rendered, and builds throwaway render
 * strings from the stored text.
 *
 * Mode resolution: a paragraph carries an optional
 * `justificationMode: 'space' | 'kashida'`. When absent, RTL paragraphs
 * default to 'kashida' (the desktop-publishing behavior Urdu readers
 * expect) and LTR paragraphs to 'space'. The mode only takes effect
 * when the paragraph is justified.
 */

/** Measures advance width of a string in the caller's layout units. */
export type KashidaMeasurer = (text: string) => number;

/** Upper bound of tatweels inserted at a single joining point. */
export const MAX_TATWEELS_PER_POINT = 3;

/** Resolves the effective mode from the explicit setting + direction. */
export function resolveJustificationMode(
  explicit: JustificationMode | undefined,
  direction: 'rtl' | 'ltr',
): JustificationMode {
  if (explicit) return explicit;
  return direction === 'ltr' ? 'space' : 'kashida';
}

/** Effective justification mode of a canonical paragraph. */
export function effectiveJustificationMode(paragraph: ParagraphNode): JustificationMode {
  return resolveJustificationMode(
    paragraph.justificationMode,
    paragraph.direction === 'ltr' ? 'ltr' : 'rtl',
  );
}

/** True when this paragraph's justified lines should stretch letters. */
export function paragraphUsesKashida(paragraph: ParagraphNode): boolean {
  return paragraph.alignment === 'justify' && effectiveJustificationMode(paragraph) === 'kashida';
}

// ---------------------------------------------------------------------------
// Joining-point analysis
// ---------------------------------------------------------------------------

interface TextUnit {
  ch: string;
  cp: number;
  /** UTF-16 offset of this unit in the source string. */
  offset: number;
}

function splitUnits(text: string): TextUnit[] {
  const units: TextUnit[] = [];
  let offset = 0;
  for (const ch of text) {
    units.push({ ch, cp: ch.codePointAt(0)!, offset });
    offset += ch.length;
  }
  return units;
}

function unitJoinsForward(unit: TextUnit): boolean {
  if (unit.ch === TATWEEL || unit.ch === ZWJ) return true;
  return isArabicScriptLetter(unit.cp) && !isRightJoiningLetter(unit.cp);
}

function unitJoinsBackward(unit: TextUnit): boolean {
  if (unit.ch === TATWEEL) return true;
  return isArabicScriptLetter(unit.cp);
}

/**
 * Returns the UTF-16 offsets in `text` at which a tatweel may be
 * inserted (a tatweel goes BEFORE text[offset]). A point is valid when:
 * - the preceding letter cluster's base letter joins forward (never a
 *   right-joining letter: ا آ د ڈ ذ ر ڑ ز ژ و ے …), and
 * - the following character joins backward (an Arabic-script letter —
 *   so never inside Latin/digit runs and never at a word boundary,
 *   where either side is a space or punctuation), and
 * - no ZWNJ sits on either side of the point (a ZWNJ explicitly severs
 *   the connection), and the point is not inside a combining-mark
 *   cluster (marks stay glued to their base letter; the point lands
 *   after the whole cluster).
 */
export function findKashidaPoints(text: string): number[] {
  const units = splitUnits(text);
  const points: number[] = [];

  for (let j = 1; j < units.length; j++) {
    const next = units[j]!;
    // Points are only evaluated before a base character: a combining
    // mark belongs to the previous cluster, and ZWNJ severs the join.
    if (isArabicCombiningMark(next.cp) || next.ch === ZWNJ) continue;
    if (!unitJoinsBackward(next)) continue;

    // Find the base of the preceding cluster (skip combining marks).
    let k = j - 1;
    while (k >= 0 && isArabicCombiningMark(units[k]!.cp)) k--;
    if (k < 0) continue;
    const base = units[k]!;
    if (base.ch === ZWNJ) continue;
    if (!unitJoinsForward(base)) continue;

    points.push(next.offset);
  }
  return points;
}

// ---------------------------------------------------------------------------
// Line planning
// ---------------------------------------------------------------------------

export interface KashidaInsertion {
  /** UTF-16 offset in the line text; tatweels go before this offset. */
  index: number;
  count: number;
}

export interface KashidaLinePlan {
  insertions: KashidaInsertion[];
  /** Slack (same units as input) left for word spacing after kashida. */
  residualSlack: number;
}

/**
 * Distributes a line's slack over its kashida points: as many whole
 * tatweels as fit (bounded per point), spread round-robin so the
 * stretch evens out along the line; the remainder is reported back for
 * word spacing. Pure: the input text is never modified.
 */
export function planLineKashida(
  lineText: string,
  slack: number,
  tatweelWidth: number,
  maxPerPoint: number = MAX_TATWEELS_PER_POINT,
): KashidaLinePlan {
  if (slack <= 0 || tatweelWidth <= 0) return { insertions: [], residualSlack: Math.max(0, slack) };
  const points = findKashidaPoints(lineText);
  if (points.length === 0) return { insertions: [], residualSlack: slack };

  const wanted = Math.floor(slack / tatweelWidth);
  const total = Math.min(wanted, points.length * Math.max(0, maxPerPoint));
  if (total <= 0) return { insertions: [], residualSlack: slack };

  const counts = new Array<number>(points.length).fill(0);
  for (let i = 0; i < total; i++) {
    counts[i % points.length] = counts[i % points.length]! + 1;
  }
  const insertions: KashidaInsertion[] = [];
  points.forEach((index, i) => {
    if (counts[i]! > 0) insertions.push({ index, count: counts[i]! });
  });
  return { insertions, residualSlack: slack - total * tatweelWidth };
}

/** Builds the RENDER string for a line: stored text + planned tatweels. */
export function applyKashidaInsertions(text: string, insertions: KashidaInsertion[]): string {
  if (insertions.length === 0) return text;
  const sorted = [...insertions].sort((a, b) => b.index - a.index);
  let out = text;
  for (const ins of sorted) {
    out = out.slice(0, ins.index) + TATWEEL.repeat(ins.count) + out.slice(ins.index);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Line layout (wrap + justify), shared by canvas and print renderers
// ---------------------------------------------------------------------------

export interface KashidaLayoutLine {
  /** The stored (unmodified) line text. */
  text: string;
  /** Render text: `text` plus tatweels when the line was kashida-justified. */
  renderText: string;
  /** Extra word spacing (layout units) absorbing the residual slack. */
  wordSpacing: number;
  /** True for the last line of a hard-break segment (never justified). */
  isFinal: boolean;
}

export interface KashidaLayoutOptions {
  /** Width of one tatweel in layout units (default: measured). */
  tatweelWidth?: number | undefined;
  /** Width of a space in layout units (default: measured). */
  spaceWidth?: number | undefined;
  maxPerPoint?: number | undefined;
}

/**
 * Wraps a paragraph's plain text into lines of at most `maxWidth` and,
 * for every non-final line, justifies it with kashida: tatweels take
 * the slack first, residual goes to word spacing. Words are split on
 * single spaces (runs of spaces collapse — this is a render layout,
 * the stored text is untouched). Lines are broken at hard newlines
 * first; the last line of each hard segment is left unjustified, as in
 * real composition.
 */
export function layoutKashidaLines(
  text: string,
  maxWidth: number,
  measure: KashidaMeasurer,
  options: KashidaLayoutOptions = {},
): KashidaLayoutLine[] {
  const spaceWidth = options.spaceWidth ?? measure(' ');
  const tatweelWidth = options.tatweelWidth ?? measure(TATWEEL);
  const lines: KashidaLayoutLine[] = [];

  const pushJustified = (words: string[], isFinal: boolean) => {
    const lineText = words.join(' ');
    if (isFinal || words.length === 0) {
      lines.push({ text: lineText, renderText: lineText, wordSpacing: 0, isFinal });
      return;
    }
    const natural =
      words.reduce((sum, w) => sum + measure(w), 0) + spaceWidth * (words.length - 1);
    const slack = maxWidth - natural;
    if (slack <= 0) {
      lines.push({ text: lineText, renderText: lineText, wordSpacing: 0, isFinal });
      return;
    }
    const plan = planLineKashida(lineText, slack, tatweelWidth, options.maxPerPoint);
    lines.push({
      text: lineText,
      renderText: applyKashidaInsertions(lineText, plan.insertions),
      wordSpacing: words.length > 1 ? plan.residualSlack / (words.length - 1) : 0,
      isFinal,
    });
  };

  for (const hardSegment of text.split('\n')) {
    const words = hardSegment.split(' ').filter((w) => w.length > 0);
    if (words.length === 0) {
      lines.push({ text: '', renderText: '', wordSpacing: 0, isFinal: true });
      continue;
    }
    let current: string[] = [];
    let currentWidth = 0;
    const flush = (isFinal: boolean) => {
      if (current.length > 0) pushJustified(current, isFinal);
      current = [];
      currentWidth = 0;
    };
    for (const word of words) {
      const wordWidth = measure(word);
      const candidate =
        current.length === 0 ? wordWidth : currentWidth + spaceWidth + wordWidth;
      if (current.length > 0 && candidate > maxWidth) {
        flush(false);
        current = [word];
        currentWidth = wordWidth;
      } else {
        current.push(word);
        currentWidth = candidate;
      }
    }
    flush(true);
  }
  return lines;
}

/** Plain text of one paragraph (hard breaks become '\n'; break atoms vanish). */
export function paragraphPlainText(paragraph: ParagraphNode): string {
  return paragraph.content
    .map((node) => {
      if (node.type === 'text') return node.text;
      if (node.type === 'hardBreak') return '\n';
      return '';
    })
    .join('');
}

/**
 * Canvas/print shared entry: when the paragraph qualifies for kashida,
 * returns its lines as one '\n'-joined RENDER string (tatweels
 * inserted); otherwise returns null so the caller keeps its normal
 * rendering. The paragraph and its text are never modified.
 */
export function buildKashidaDisplayText(
  paragraph: ParagraphNode,
  maxWidth: number,
  measure: KashidaMeasurer,
): string | null {
  if (!paragraphUsesKashida(paragraph)) return null;
  const text = paragraphPlainText(paragraph);
  if (!text.trim()) return null;
  return layoutKashidaLines(text, maxWidth, measure)
    .map((line) => line.renderText)
    .join('\n');
}
