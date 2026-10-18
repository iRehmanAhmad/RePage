import type { ObjectId, RePageDocument, StoryId, TextFrameObject, TextStory } from './types';

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
 * Concatenation of all slices equals the story text when overflowBeyondLast is
 * false; when true, the trailing remainder is intentionally undisplayed and the
 * caller should surface an overflow indicator on the last frame.
 */
export function computeChainTextSlices(
  doc: RePageDocument,
  chain: TextFrameObject[],
): ChainTextSlices | null {
  if (chain.length < 2) return null;

  const storyId = chain[0]!.storyId;
  const fullText = getStoryPlainText(doc.stories[storyId]);
  const slices: Record<ObjectId, string> = {};
  if (!fullText) {
    for (const frame of chain) slices[frame.id] = '';
    return { slices, overflowBeyondLast: false };
  }

  const capacities = chain.map((frame) => estimateFrameCharCapacity(frame));
  const tokens = fullText.match(/[^\s]+|\s+/g) ?? [];

  let frameIndex = 0;
  let fill = 0;
  let overflowBeyondLast = false;
  const buffers: string[] = chain.map(() => '');

  for (const token of tokens) {
    // Advance past exhausted frames.
    while (frameIndex < chain.length && fill >= capacities[frameIndex]!) {
      frameIndex++;
      fill = 0;
    }
    if (frameIndex >= chain.length) {
      overflowBeyondLast = true;
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

  return { slices, overflowBeyondLast };
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
 * Unlinks a text frame from its sequence chain.
 */
export function unlinkTextFrame(doc: RePageDocument, frameId: ObjectId): RePageDocument {
  const frameObj = doc.objects[frameId];
  if (!frameObj || frameObj.type !== 'text-frame') return doc;

  const nextId = frameObj.nextFrameId;
  const prevId = frameObj.previousFrameId;

  const updatedObjects = { ...doc.objects };

  if (prevId && updatedObjects[prevId]?.type === 'text-frame') {
    const prevObj = updatedObjects[prevId] as TextFrameObject;
    updatedObjects[prevId] = { ...prevObj, nextFrameId: nextId ?? null };
  }

  if (nextId && updatedObjects[nextId]?.type === 'text-frame') {
    const nextObj = updatedObjects[nextId] as TextFrameObject;
    updatedObjects[nextId] = { ...nextObj, previousFrameId: prevId ?? null };
  }

  updatedObjects[frameId] = {
    ...frameObj,
    nextFrameId: null,
    previousFrameId: null,
    sequenceIndex: 0,
  };

  return {
    ...doc,
    objects: updatedObjects,
  };
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
