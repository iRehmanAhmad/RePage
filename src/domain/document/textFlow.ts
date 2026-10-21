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

export interface StoryBreak {
  /** Offset in getStoryPlainText coordinates (text chars before the break). */
  offset: number;
  breakType: 'page' | 'column';
}

/**
 * Locates every explicit break node in a story, in document order, using
 * the same plain-text coordinates as getStoryPlainText (text runs count
 * their characters; zero-width nodes — hard breaks and breaks — count 0;
 * paragraphs are joined by one '\n').
 */
export function getStoryBreaks(story: TextStory | undefined): StoryBreak[] {
  if (!story?.content?.content) return [];
  const breaks: StoryBreak[] = [];
  let offset = 0;
  story.content.content.forEach((para, paraIndex) => {
    if (paraIndex > 0) offset += 1; // '\n' separator
    for (const node of para.content) {
      if (node.type === 'text') offset += node.text.length;
      else if (node.type === 'break') breaks.push({ offset, breakType: node.breakType });
    }
  });
  return breaks;
}

type FlowItem =
  | { kind: 'token'; text: string }
  | { kind: 'break'; breakType: 'page' | 'column' };

/**
 * Builds the token/break item stream for a text blob: the text is chunked
 * at each break offset and every chunk is tokenized with the given regex,
 * so a break can split even a single word token in two. Break offsets are
 * relative to `text`. Concatenating all token items reproduces `text`.
 */
function buildFlowItems(
  text: string,
  breaks: StoryBreak[],
  tokenize: (chunk: string) => string[],
): FlowItem[] {
  const items: FlowItem[] = [];
  let cursor = 0;
  for (const b of breaks) {
    const at = Math.max(cursor, Math.min(b.offset, text.length));
    for (const tokenText of tokenize(text.slice(cursor, at))) {
      items.push({ kind: 'token', text: tokenText });
    }
    items.push({ kind: 'break', breakType: b.breakType });
    cursor = at;
  }
  for (const tokenText of tokenize(text.slice(cursor))) {
    items.push({ kind: 'token', text: tokenText });
  }
  return items;
}

/** Concatenates the token items from `fromIndex` onward (breaks carry no text). */
function joinFlowTokens(items: FlowItem[], fromIndex: number): string {
  let out = '';
  for (let i = fromIndex; i < items.length; i++) {
    const item = items[i]!;
    if (item.kind === 'token') out += item.text;
  }
  return out;
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

  const breaks = getStoryBreaks(doc.stories[storyId]);
  // Physical order of each frame's page, for page-break jumps: a page
  // break moves following text to the next frame that sits on a LATER page.
  const pagePosition = new Map(doc.pageOrder.map((id, index) => [id, index]));
  const framePagePosition = (frame: TextFrameObject): number =>
    pagePosition.get(frame.pageId) ?? 0;

  if (measurer) return layoutMeasuredChain(chain, fullText, breaks, framePagePosition, measurer, slices);
  return layoutHeuristicChain(chain, fullText, breaks, framePagePosition, slices);
}

/**
 * Resolves a break to a target frame index in the chain.
 * - 'column': the next frame in the chain (the next column slot).
 * - 'page': the first later frame that sits on a later page than the
 *   current frame (frames on the same page in between receive nothing).
 * Returns -1 when the chain has no such frame — the caller overflows.
 */
function resolveBreakTarget(
  chain: TextFrameObject[],
  framePagePosition: (frame: TextFrameObject) => number,
  currentFrameIndex: number,
  breakType: 'page' | 'column',
): number {
  if (breakType === 'column') {
    return currentFrameIndex + 1 < chain.length ? currentFrameIndex + 1 : -1;
  }
  const currentPosition = framePagePosition(chain[currentFrameIndex]!);
  for (let j = currentFrameIndex + 1; j < chain.length; j++) {
    if (framePagePosition(chain[j]!) > currentPosition) return j;
  }
  return -1;
}

/**
 * Deterministic heuristic layout: average glyph width, no live measurement.
 * The reference implementation every headless path relies on. Explicit
 * break nodes in the story are honored (see resolveBreakTarget): text
 * after a break starts in the target frame, or overflows when the chain
 * has no such frame — it is never silently dropped.
 */
function layoutHeuristicChain(
  chain: TextFrameObject[],
  fullText: string,
  breaks: StoryBreak[],
  framePagePosition: (frame: TextFrameObject) => number,
  slices: Record<ObjectId, string>,
): ChainTextSlices {
  const capacities = chain.map((frame) => estimateFrameCharCapacity(frame));
  const items = buildFlowItems(fullText, breaks, (chunk) => chunk.match(/[^\s]+|\s+/g) ?? []);

  let frameIndex = 0;
  let fill = 0;
  let overflowBeyondLast = false;
  let overflowText = '';
  const buffers: string[] = chain.map(() => '');

  // Whitespace immediately after a break is the separator of the text
  // BEFORE the break: it is appended to the pre-break frame so the
  // post-break frame does not open with an invisible empty line. Slice
  // concatenation still reproduces the story text exactly.
  let afterBreak = false;
  let preBreakFrame = -1;

  for (let t = 0; t < items.length; t++) {
    const item = items[t]!;

    if (item.kind === 'break') {
      if (!afterBreak) preBreakFrame = frameIndex;
      const target = resolveBreakTarget(chain, framePagePosition, frameIndex, item.breakType);
      if (target === -1) {
        overflowBeyondLast = true;
        overflowText = joinFlowTokens(items, t + 1);
        break;
      }
      frameIndex = target;
      fill = 0;
      afterBreak = true;
      continue;
    }

    const token = item.text;
    if (afterBreak && /^\s+$/.test(token) && preBreakFrame >= 0) {
      buffers[preBreakFrame] += token;
      afterBreak = false;
      continue;
    }
    afterBreak = false;

    // Advance past exhausted frames.
    while (frameIndex < chain.length && fill >= capacities[frameIndex]!) {
      frameIndex++;
      fill = 0;
    }
    if (frameIndex >= chain.length) {
      overflowBeyondLast = true;
      overflowText = joinFlowTokens(items, t);
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
          overflowText = joinFlowTokens(items, t);
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
    overflowText,
  };
}

/**
 * Measured layout: greedy word wrap with real advance widths.
 * Paragraph breaks (`\n`) force line breaks; original inter-word whitespace is
 * preserved inside slices so words are never lost or duplicated.
 * Explicit break nodes are honored with the same targeting rules as the
 * heuristic layout (see resolveBreakTarget); following text overflows
 * when the chain has no target frame.
 */
function layoutMeasuredChain(
  chain: TextFrameObject[],
  fullText: string,
  breaks: StoryBreak[],
  framePagePosition: (frame: TextFrameObject) => number,
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

  // Break bookkeeping, mirroring the heuristic layout: whitespace right
  // after a break (including a paragraph separator) attaches to the frame
  // that held the pre-break text, so the target frame opens cleanly.
  let lastWasBreak = false;
  let preBreakFrame = -1;

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

  /** Applies a break; false when the chain has no target frame for it. */
  const applyBreak = (breakType: 'page' | 'column'): boolean => {
    const target = resolveBreakTarget(chain, framePagePosition, frameIndex, breakType);
    if (target === -1) return false;
    if (!lastWasBreak) preBreakFrame = frameIndex;
    frameIndex = target;
    linesUsed = 0;
    lineWidthPx = 0;
    atLineStart = true;
    lastWasBreak = true;
    return true;
  };

  const paragraphs = fullText.split('\n');
  // Global start offset of each paragraph in fullText coordinates.
  const paragraphStarts: number[] = [];
  {
    let acc = 0;
    for (const para of paragraphs) {
      paragraphStarts.push(acc);
      acc += para.length + 1;
    }
  }
  const restAfter = (p: number): string =>
    p + 1 < paragraphs.length ? '\n' + paragraphs.slice(p + 1).join('\n') : '';

  for (let p = 0; p < paragraphs.length; p++) {
    const paraText = paragraphs[p]!;
    const paraStart = paragraphStarts[p]!;
    const relBreaks = breaks
      .filter((b) => b.offset >= paraStart && b.offset <= paraStart + paraText.length)
      .map((b) => ({ offset: b.offset - paraStart, breakType: b.breakType }));
    // Word tokens keep their trailing whitespace; a leading-whitespace token
    // can only match at a chunk start. Chunks are split at break offsets, so
    // a break can divide a word across frames.
    let items = buildFlowItems(
      paraText,
      relBreaks,
      (chunk) => chunk.match(/^\s+|[^\s]+(\s+|$)/g) ?? [],
    );

    if (p > 0) {
      // Leading breaks of this paragraph resolve BEFORE the paragraph
      // separator: the separator belongs to the pre-break text.
      let lead = 0;
      while (lead < items.length && items[lead]!.kind === 'break') {
        const breakItem = items[lead]!;
        if (breakItem.kind === 'break' && !applyBreak(breakItem.breakType)) {
          overflowBeyondLast = true;
          overflowText = '\n' + joinFlowTokens(items, lead + 1) + restAfter(p);
          break;
        }
        lead++;
      }
      if (overflowBeyondLast) break;
      items = items.slice(lead);

      if (lastWasBreak) {
        if (preBreakFrame >= 0) buffers[preBreakFrame] += '\n';
      } else {
        if (!ensureFrame()) {
          overflowBeyondLast = true;
          overflowText = '\n' + paragraphs.slice(p).join('\n');
          break;
        }
        buffers[frameIndex] += '\n';
        endLine();
      }
    }

    for (let t = 0; t < items.length; t++) {
      const item = items[t]!;

      if (item.kind === 'break') {
        if (!applyBreak(item.breakType)) {
          overflowBeyondLast = true;
          overflowText = joinFlowTokens(items, t + 1) + restAfter(p);
          break;
        }
        continue;
      }

      if (!ensureFrame()) {
        overflowBeyondLast = true;
        overflowText = joinFlowTokens(items, t) + restAfter(p);
        break;
      }
      const frame = chain[frameIndex]!;
      const token = item.text;
      if (/^\s+$/.test(token)) {
        // Whitespace: invisible, kept for exactness. Right after a break
        // it attaches to the pre-break frame (see note above).
        if (lastWasBreak && preBreakFrame >= 0) buffers[preBreakFrame] += token;
        else buffers[frameIndex] += token;
        continue;
      }
      lastWasBreak = false;
      const tokenPx = measurer.measureTokenPx(token, frame);
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
          overflowText = joinFlowTokens(items, t) + restAfter(p);
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
