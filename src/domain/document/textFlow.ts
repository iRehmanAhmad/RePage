import type { ObjectId, RePageDocument, StoryId, TextFrameObject } from './types';

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
