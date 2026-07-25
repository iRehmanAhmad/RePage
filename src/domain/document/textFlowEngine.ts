import type { ObjectId, PageObject, RePageDocument, StoryId, TextFrameObject } from './types';
import { checkFrameOverflow, getStoryFramesInSequence } from './textFlow';

/**
 * Checks if linking targetFrameId to sourceFrameId would introduce a circular chain reference.
 */
export function preventCircularLinks(
  doc: RePageDocument,
  sourceFrameId: ObjectId,
  targetFrameId: ObjectId,
): boolean {
  if (sourceFrameId === targetFrameId) return true; // Direct self-link is circular

  let currentId: ObjectId | null | undefined = targetFrameId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === sourceFrameId) return true; // Circular loop detected
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const frameObj: PageObject | undefined = doc.objects[currentId];
    if (frameObj && frameObj.type === 'text-frame') {
      currentId = frameObj.nextFrameId;
    } else {
      break;
    }
  }

  return false;
}

/**
 * Links source text frame to target text frame with strict circular link prevention.
 */
export function linkTextFramesEngine(
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

  if (preventCircularLinks(doc, sourceFrameId, targetFrameId)) {
    throw new Error(`Cannot link ${sourceFrameId} to ${targetFrameId}: Circular link reference detected`);
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

  const updatedDoc: RePageDocument = {
    ...doc,
    objects: {
      ...doc.objects,
      [sourceFrameId]: updatedSource,
      [targetFrameId]: updatedTarget,
    },
  };

  return reflowStoryContentEngine(updatedDoc, sourceObj.storyId);
}

/**
 * Deletes a text frame object while preserving its underlying canonical TextStory in doc.stories.
 */
export function deleteTextFramePreservingStory(
  doc: RePageDocument,
  frameId: ObjectId,
): RePageDocument {
  const frameObj = doc.objects[frameId];
  if (!frameObj || frameObj.type !== 'text-frame') return doc;

  const nextId = frameObj.nextFrameId;
  const prevId = frameObj.previousFrameId;

  const updatedObjects = { ...doc.objects };
  delete updatedObjects[frameId];

  if (prevId && updatedObjects[prevId]?.type === 'text-frame') {
    const prevObj = updatedObjects[prevId] as TextFrameObject;
    updatedObjects[prevId] = { ...prevObj, nextFrameId: nextId ?? null };
  }

  if (nextId && updatedObjects[nextId]?.type === 'text-frame') {
    const nextObj = updatedObjects[nextId] as TextFrameObject;
    updatedObjects[nextId] = { ...nextObj, previousFrameId: prevId ?? null };
  }

  // Remove from page object order
  const pageObj = doc.pages[frameObj.pageId];
  const updatedPages = { ...doc.pages };
  if (pageObj) {
    updatedPages[frameObj.pageId] = {
      ...pageObj,
      objectOrder: pageObj.objectOrder.filter((id) => id !== frameId),
    };
  }

  const resultDoc: RePageDocument = {
    ...doc,
    pages: updatedPages,
    objects: updatedObjects,
  };

  return reflowStoryContentEngine(resultDoc, frameObj.storyId);
}

/**
 * Reflows story text content across all linked frames in sequence.
 */
export function reflowStoryContentEngine(
  doc: RePageDocument,
  storyId: StoryId,
): RePageDocument {
  const story = doc.stories[storyId];
  if (!story) return doc;

  const frames = getStoryFramesInSequence(doc, storyId);
  if (frames.length === 0) return doc;

  const plainText = story.content.content[0]?.content[0]?.type === 'text'
    ? story.content.content[0].content[0].text
    : '';

  const updatedObjects = { ...doc.objects };

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]!;
    const isLast = i === frames.length - 1;

    const isOverflowing = checkFrameOverflow(
      plainText,
      frame.fontSize,
      frame.lineHeight,
      frame.frame.width,
      frame.frame.height,
    );

    updatedObjects[frame.id] = {
      ...frame,
      sequenceIndex: i,
      overflow: isLast ? isOverflowing : false,
    };
  }

  return {
    ...doc,
    objects: updatedObjects,
  };
}
