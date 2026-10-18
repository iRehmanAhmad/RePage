import type { ObjectId, RePageDocument, StoryId, TextFrameObject, TextStory } from './types';
import type { InlineNode, ParagraphNode } from '../rich-text/types';

/**
 * Extracts the plain editable text of a story (paragraphs joined by newlines).
 * Mirrors the flattening used by the canvas renderer so slices stay consistent.
 */
export function getStoryPlainText(story: TextStory | undefined): string {
  if (!story?.content?.content) return '';
  return story.content.content
    .map((p) => p.content.map((run) => (run.type === 'text' ? run.text : '')).join(''))
    .join('\n');
}

/**
 * Walks a text-frame chain starting at any member frame: first back to the head
 * (via previousFrameId), then forward to the tail (via nextFrameId).
 * Returns the frames in flow order. Guards against malformed cycles.
 */
export function getTextFrameChain(doc: RePageDocument, frameId: ObjectId): TextFrameObject[] {
  const start = doc.objects[frameId];
  if (!start || start.type !== 'text-frame') return [];

  // Walk back to the head of the chain.
  let head: TextFrameObject = start;
  const backSeen = new Set<ObjectId>([head.id]);
  while (head.previousFrameId) {
    const prev = doc.objects[head.previousFrameId];
    if (!prev || prev.type !== 'text-frame' || backSeen.has(prev.id)) break;
    backSeen.add(prev.id);
    head = prev;
  }

  // Walk forward to the tail.
  const chain: TextFrameObject[] = [head];
  const fwdSeen = new Set<ObjectId>([head.id]);
  let current: TextFrameObject = head;
  while (current.nextFrameId) {
    const next = doc.objects[current.nextFrameId];
    if (!next || next.type !== 'text-frame' || fwdSeen.has(next.id)) break;
    fwdSeen.add(next.id);
    chain.push(next);
    current = next;
  }

  return chain;
}

export interface ChainTextSlices {
  /** frameId -> visible text slice, in chain order */
  slices: Record<ObjectId, string>;
  /** true when story text remains beyond the last frame's estimated capacity */
  overflowBeyondLast: boolean;
  /** The story text that did not fit (empty when overflowBeyondLast is false). */
  overflowText: string;
}

/**
 * Optional measured-shaping adapter for chain layout.
 *
 * Implementations measure with the real font (e.g. an offscreen 2D canvas in
 * `editor/canvas/`). The domain never constructs one itself: callers that have no
 * live text engine pass nothing and get the deterministic heuristic instead, which
 * keeps `domain/` viewport-independent and the export path reproducible.
 *
 * Honest limits: words are measured in isolation, so cross-word joining effects
 * (an Urdu word's edge glyphs reshaping against its neighbour) are not captured;
 * treat boundaries as close approximations, not press-certified breaks.
 */
export interface ChainTextMeasurer {
  /** Advance width in px of a token in the given frame's font. */
  measureTokenPx(token: string, frame: TextFrameObject): number;
  /** Line height in px for the given frame's font. */
  lineHeightPx(frame: TextFrameObject): number;
}

/**
 * Estimates how many characters fit inside a text frame.
 * Heuristic (same estimation family as checkFrameOverflow): average Urdu glyph
 * width derived from the frame's font size, NOT measured shaping. Deterministic
 * and viewport-independent by design.
 */
export function estimateFrameCharCapacity(frame: TextFrameObject): number {
  const usableWidth = Math.max(
    1,
    frame.frame.width - frame.padding.left - frame.padding.right,
  );
  const usableHeight = Math.max(
    1,
    frame.frame.height - frame.padding.top - frame.padding.bottom,
  );
  const avgCharWidth = Math.max(1, frame.fontSize * 0.45);
  const charsPerLine = Math.max(1, Math.floor(usableWidth / avgCharWidth));
  const lineHeightPx = Math.max(1, frame.fontSize * frame.lineHeight);
  const maxLines = Math.max(1, Math.floor(usableHeight / lineHeightPx));
  return Math.max(1, maxLines * charsPerLine);
}

/**
 * Splits a story's plain text across a linked frame chain at word boundaries.
 * Returns null for chains shorter than 2 frames (single frames render full text).
 *
 * Without a measurer, uses the deterministic average-glyph heuristic (viewport
 * independent; used by overflow flags, story fork, and all headless paths).
 * With a measurer, lays out with measured advance widths and proper line
 * wrapping (used by on-screen renderers that have a live text engine).
 *
 * Heuristic path: concatenation of all slices equals the story text when
 * overflowBeyondLast is false; when true, the trailing remainder is in
 * overflowText and the caller should surface an overflow indicator.
 */
export function computeChainTextSlices(
  doc: RePageDocument,
  chain: TextFrameObject[],
  measurer?: ChainTextMeasurer,
): ChainTextSlices | null {
  if (chain.length < 2) return null;

  const storyId = chain[0]!.storyId;
  const fullText = getStoryPlainText(doc.stories[storyId]);
  const slices: Record<ObjectId, string> = {};
  if (!fullText) {
    for (const frame of chain) slices[frame.id] = '';
    return { slices, overflowBeyondLast: false, overflowText: '' };
  }

  if (measurer) return layoutMeasuredChain(chain, fullText, measurer, slices);
  return layoutHeuristicChain(chain, fullText, slices);
}

/**
 * Deterministic heuristic layout: average glyph width, no live measurement.
 * Unchanged behavior — the reference implementation every headless path relies on.
 */
function layoutHeuristicChain(
  chain: TextFrameObject[],
  fullText: string,
  slices: Record<ObjectId, string>,
): ChainTextSlices {
  const capacities = chain.map((frame) => estimateFrameCharCapacity(frame));
  const tokens = fullText.match(/[^\s]+|\s+/g) ?? [];

  let frameIndex = 0;
  let fill = 0;
  let overflowBeyondLast = false;
  let overflowAt = -1;
  const buffers: string[] = chain.map(() => '');

  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t]!;
    // Advance past exhausted frames.
    while (frameIndex < chain.length && fill >= capacities[frameIndex]!) {
      frameIndex++;
      fill = 0;
    }
    if (frameIndex >= chain.length) {
      overflowBeyondLast = true;
      overflowAt = t;
      break;
    }

    const capacity = capacities[frameIndex]!;
    if (fill > 0 && fill + token.length > capacity) {
      // Token does not fit: move to the next frame (word-boundary split).
      // A token longer than a whole frame is still placed to avoid stalling.
      if (token.length <= capacity) {
        frameIndex++;
        fill = 0;
        while (frameIndex < chain.length && fill >= capacities[frameIndex]!) {
          frameIndex++;
        }
        if (frameIndex >= chain.length) {
          overflowBeyondLast = true;
          overflowAt = t;
          break;
        }
      }
    }

    buffers[frameIndex] += token;
    fill += token.length;
  }

  chain.forEach((frame, i) => {
    slices[frame.id] = buffers[i] ?? '';
  });

  return {
    slices,
    overflowBeyondLast,
    overflowText: overflowAt >= 0 ? tokens.slice(overflowAt).join('') : '',
  };
}

/**
 * Measured layout: greedy word wrap with real advance widths.
 * Paragraph breaks (`\n`) force line breaks; original inter-word whitespace is
 * preserved inside slices so words are never lost or duplicated.
 */
function layoutMeasuredChain(
  chain: TextFrameObject[],
  fullText: string,
  measurer: ChainTextMeasurer,
  slices: Record<ObjectId, string>,
): ChainTextSlices {
  const buffers: string[] = chain.map(() => '');
  const geom = chain.map((frame) => ({
    usableWidthPx: Math.max(
      1,
      frame.frame.width - frame.padding.left - frame.padding.right,
    ),
    maxLines: Math.max(
      1,
      Math.floor(
        Math.max(1, frame.frame.height - frame.padding.top - frame.padding.bottom) /
          measurer.lineHeightPx(frame),
      ),
    ),
  }));

  let frameIndex = 0;
  let linesUsed = 0;
  let lineWidthPx = 0;
  let atLineStart = true;
  let overflowBeyondLast = false;
  let overflowText = '';

  const endLine = () => {
    linesUsed++;
    lineWidthPx = 0;
    atLineStart = true;
  };

  /** Advances past full frames; false when the chain is exhausted. */
  const ensureFrame = (): boolean => {
    while (frameIndex < chain.length && linesUsed >= geom[frameIndex]!.maxLines) {
      frameIndex++;
      linesUsed = 0;
      lineWidthPx = 0;
      atLineStart = true;
    }
    return frameIndex < chain.length;
  };

  const paragraphs = fullText.split('\n');
  for (let p = 0; p < paragraphs.length; p++) {
    if (p > 0) {
      if (!ensureFrame()) {
        overflowBeyondLast = true;
        overflowText = '\n' + paragraphs.slice(p).join('\n');
        break;
      }
      buffers[frameIndex] += '\n';
      endLine();
    }
    // Word tokens keep their trailing whitespace; a leading-whitespace token
    // can only match at the paragraph start.
    const tokens = paragraphs[p]!.match(/^\s+|[^\s]+(\s+|$)/g) ?? [];
    for (let t = 0; t < tokens.length; t++) {
      if (!ensureFrame()) {
        overflowBeyondLast = true;
        overflowText = tokens.slice(t).join('') + (p + 1 < paragraphs.length ? '\n' + paragraphs.slice(p + 1).join('\n') : '');
        break;
      }
      const frame = chain[frameIndex]!;
      const token = tokens[t]!;
      const tokenPx = measurer.measureTokenPx(token, frame);
      if (/^\s+$/.test(token)) {
        // Paragraph-leading whitespace: invisible, kept for exactness.
        buffers[frameIndex] += token;
        continue;
      }
      if (atLineStart) {
        // Placed even when wider than the line (anti-stall, mirrors heuristic).
        buffers[frameIndex] += token;
        lineWidthPx = tokenPx;
        atLineStart = false;
      } else if (lineWidthPx + tokenPx <= geom[frameIndex]!.usableWidthPx) {
        buffers[frameIndex] += token;
        lineWidthPx += tokenPx;
      } else {
        endLine();
        if (!ensureFrame()) {
          overflowBeyondLast = true;
          overflowText = tokens.slice(t).join('') + (p + 1 < paragraphs.length ? '\n' + paragraphs.slice(p + 1).join('\n') : '');
          break;
        }
        buffers[frameIndex] += token;
        lineWidthPx = measurer.measureTokenPx(token, chain[frameIndex]!);
        atLineStart = false;
      }
    }
    if (overflowBeyondLast) break;
  }

  chain.forEach((frame, i) => {
    slices[frame.id] = buffers[i] ?? '';
  });
  return { slices, overflowBeyondLast, overflowText };
}

/**
 * Recomputes the `overflow` badge flags for every frame of the chain containing
 * the given frame. Single unlinked frames fall back to checkFrameOverflow.
 */
export function applyChainOverflowFlags(doc: RePageDocument, frameId: ObjectId): RePageDocument {
  const chain = getTextFrameChain(doc, frameId);
  if (chain.length === 0) return doc;

  const flow = computeChainTextSlices(doc, chain);
  const story = doc.stories[chain[0]!.storyId];
  const fullText = getStoryPlainText(story);

  const updatedObjects = { ...doc.objects };
  chain.forEach((frame, index) => {
    const isLast = index === chain.length - 1;
    const overflow = flow
      ? isLast && flow.overflowBeyondLast
      : checkFrameOverflow(fullText, frame.fontSize, frame.lineHeight, frame.frame.width, frame.frame.height);
    updatedObjects[frame.id] = { ...frame, overflow };
  });

  return { ...doc, objects: updatedObjects };
}

/**
 * Links a source text frame to a target text frame in a multi-frame story flow chain.
 */
export function linkTextFrames(
  doc: RePageDocument,
  sourceFrameId: ObjectId,
  targetFrameId: ObjectId,
): RePageDocument {
  const sourceObj = doc.objects[sourceFrameId];
  const targetObj = doc.objects[targetFrameId];

  if (!sourceObj || sourceObj.type !== 'text-frame') {
    throw new Error(`Source frame ${sourceFrameId} is not a valid text-frame`);
  }
  if (!targetObj || targetObj.type !== 'text-frame') {
    throw new Error(`Target frame ${targetFrameId} is not a valid text-frame`);
  }

  const updatedSource: TextFrameObject = {
    ...sourceObj,
    nextFrameId: targetFrameId,
    sequenceIndex: sourceObj.sequenceIndex ?? 0,
  };

  const updatedTarget: TextFrameObject = {
    ...targetObj,
    storyId: sourceObj.storyId,
    previousFrameId: sourceFrameId,
    sequenceIndex: (sourceObj.sequenceIndex ?? 0) + 1,
  };

  return {
    ...doc,
    objects: {
      ...doc.objects,
      [sourceFrameId]: updatedSource,
      [targetFrameId]: updatedTarget,
    },
  };
}

/**
 * Detaches a text frame from its chain.
 *
 * - Middle/tail frame (has a previous link): breaks the link to the previous
 *   frame; the frame keeps its downstream chain. A→F→G becomes A and F→G.
 * - Head frame (no previous link, has a next link): breaks the link to the
 *   next frame. A→B→G becomes A and B→G.
 * - Unlinked frame: no-op.
 *
 * (Earlier versions spliced a middle frame out and closed the gap; detach is
 * the less surprising "break the link" semantic and the one story-fork
 * relies on.)
 */
export function unlinkTextFrame(doc: RePageDocument, frameId: ObjectId): RePageDocument {
  const frameObj = doc.objects[frameId];
  if (!frameObj || frameObj.type !== 'text-frame') return doc;

  const prevId = frameObj.previousFrameId;
  const nextId = frameObj.nextFrameId;
  const updatedObjects = { ...doc.objects };

  if (prevId && updatedObjects[prevId]?.type === 'text-frame') {
    // Middle/tail: break the previous link, keep downstream.
    const prevObj = updatedObjects[prevId] as TextFrameObject;
    updatedObjects[prevId] = { ...prevObj, nextFrameId: null };
    updatedObjects[frameId] = { ...frameObj, previousFrameId: null, sequenceIndex: 0 };
  } else if (nextId && updatedObjects[nextId]?.type === 'text-frame') {
    // Head: break the next link; downstream stays chained.
    const nextObj = updatedObjects[nextId] as TextFrameObject;
    updatedObjects[nextId] = { ...nextObj, previousFrameId: null, sequenceIndex: 0 };
    updatedObjects[frameId] = { ...frameObj, nextFrameId: null };
  }
  // else: not linked — no-op.

  return {
    ...doc,
    objects: updatedObjects,
  };
}

/** Plain text of one paragraph (mirrors getStoryPlainText's flattening). */
function paragraphPlainText(paragraph: ParagraphNode): string {
  return paragraph.content.map((run) => (run.type === 'text' ? run.text : '')).join('');
}

/**
 * Splits one paragraph's runs at a character offset (plain-text coordinates).
 * Boundary paragraphs inherit the original's attributes (alignment, styleId…).
 * Either side may be null when the offset falls exactly on a paragraph edge.
 */
function splitParagraphAt(
  paragraph: ParagraphNode,
  offset: number,
): { head: ParagraphNode | null; tail: ParagraphNode | null } {
  const headRuns: InlineNode[] = [];
  const tailRuns: InlineNode[] = [];
  let acc = 0;
  let inTail = false;
  for (const run of paragraph.content) {
    if (run.type !== 'text') {
      // Zero-width nodes (hard breaks…) travel with the current side.
      (inTail ? tailRuns : headRuns).push(run);
      continue;
    }
    const len = run.text.length;
    if (!inTail && acc + len > offset) {
      const cut = Math.max(0, offset - acc);
      if (cut > 0) headRuns.push({ ...run, text: run.text.slice(0, cut) });
      const tailText = run.text.slice(cut);
      if (tailText.length > 0) tailRuns.push({ ...run, text: tailText });
      inTail = true;
    } else {
      (inTail ? tailRuns : headRuns).push(run);
    }
    acc += len;
  }
  return {
    head: headRuns.length > 0 ? { ...paragraph, content: headRuns } : null,
    tail: tailRuns.length > 0 ? { ...paragraph, content: tailRuns } : null,
  };
}

export interface SplitStory {
  /** Paragraphs for text [0, charOffset) — never empty (padded with a blank para). */
  head: ParagraphNode[];
  /** Paragraphs for text [charOffset, end) — never empty (padded with a blank para). */
  tail: ParagraphNode[];
}

/**
 * Splits a story's paragraphs at a plain-text character offset (the same
 * coordinate space as getStoryPlainText / computeChainTextSlices).
 * Run-level split preserves marks and paragraph attributes on both halves.
 */
export function splitStoryAtTextOffset(
  story: TextStory | undefined,
  charOffset: number,
): SplitStory {
  const paras = story?.content?.content ?? [];
  const blank = (): ParagraphNode => ({
    type: 'paragraph',
    direction: 'rtl',
    content: [],
  });
  if (paras.length === 0) return { head: [blank()], tail: [blank()] };

  const total = getStoryPlainText(story).length;
  const clamped = Math.max(0, Math.min(charOffset, total));

  let acc = 0;
  for (let k = 0; k < paras.length; k++) {
    const text = paragraphPlainText(paras[k]!);
    const start = acc;
    const end = acc + text.length;
    if (clamped < end) {
      const { head, tail } = splitParagraphAt(paras[k]!, clamped - start);
      const headParas = [...paras.slice(0, k)];
      const tailParas = [...paras.slice(k + 1)];
      if (head) headParas.push(head);
      if (tail) tailParas.unshift(tail);
      return {
        head: headParas.length > 0 ? headParas : [blank()],
        tail: tailParas.length > 0 ? tailParas : [blank()],
      };
    }
    if (clamped === end) {
      const headParas = paras.slice(0, k + 1);
      const tailParas = paras.slice(k + 1);
      return {
        head: headParas.length > 0 ? headParas : [blank()],
        tail: tailParas.length > 0 ? tailParas : [blank()],
      };
    }
    acc = end + 1; // +1 for the '\n' separator
  }
  // Offset at/past the very end: everything stays in head.
  return { head: [...paras], tail: [blank()] };
}

/**
 * Calculates estimated text frame height vs text lines to detect visual overflow.
 */
export function checkFrameOverflow(
  text: string,
  fontSize: number,
  lineHeightRatio: number,
  frameWidth: number,
  frameHeight: number,
): boolean {
  if (!text || text.trim().length === 0) return false;

  const effectiveLineHeight = fontSize * lineHeightRatio;
  const maxLines = Math.floor(frameHeight / effectiveLineHeight);
  if (maxLines <= 0) return true;

  // Approximate character wrap per line based on average Urdu character width
  const avgCharWidth = fontSize * 0.45;
  const charsPerLine = Math.max(1, Math.floor(frameWidth / avgCharWidth));

  const paragraphs = text.split('\n');
  let estimatedLines = 0;

  for (const para of paragraphs) {
    if (para.length === 0) {
      estimatedLines += 1;
    } else {
      estimatedLines += Math.ceil(para.length / charsPerLine);
    }
  }

  return estimatedLines > maxLines;
}

/**
 * Retrieves all text frames assigned to a story ordered by sequence index.
 */
export function getStoryFramesInSequence(
  doc: RePageDocument,
  storyId: StoryId,
): TextFrameObject[] {
  const frames = Object.values(doc.objects)
    .filter((obj): obj is TextFrameObject => obj.type === 'text-frame' && obj.storyId === storyId)
    .sort((a, b) => (a.sequenceIndex ?? 0) - (b.sequenceIndex ?? 0));

  return frames;
}
