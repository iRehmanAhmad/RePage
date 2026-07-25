import * as Y from 'yjs';
import type { TextStory } from '../domain/document/types';

export interface ObjectTransformMutation {
  objectId: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  timestamp: number;
  author: string;
}

export const DEFAULT_STYLE_FALLBACK_ID = 'default-paragraph-style';

/**
 * Resolves concurrent movement conflicts between multiple users using Last-Writer-Wins (LWW).
 */
export function resolveConcurrentMovement(
  current: { x: number; y: number },
  mutationA: ObjectTransformMutation,
  mutationB: ObjectTransformMutation,
): { x: number; y: number } {
  const winner = mutationA.timestamp >= mutationB.timestamp ? mutationA : mutationB;
  return {
    x: winner.x ?? current.x,
    y: winner.y ?? current.y,
  };
}

/**
 * Resolves concurrent resize conflicts enforcing minimum frame bounds (10pt).
 */
export function resolveConcurrentResize(
  current: { width: number; height: number },
  mutationA: ObjectTransformMutation,
  mutationB: ObjectTransformMutation,
): { width: number; height: number } {
  const winner = mutationA.timestamp >= mutationB.timestamp ? mutationA : mutationB;
  return {
    width: Math.max(10, winner.width ?? current.width),
    height: Math.max(10, winner.height ?? current.height),
  };
}

/**
 * Resolves Delete vs Edit conflict: If object is deleted by peer, pending edit is safely dropped.
 */
export function resolveDeleteVsEdit<T>(
  objectExists: boolean,
  pendingEdit: T,
): T | null {
  if (!objectExists) {
    return null;
  }
  return pendingEdit;
}

/**
 * Resolves Page Delete vs Object Edit: Page deletion cascadingly invalidates object edits targeting deleted page.
 */
export function resolvePageDeleteVsObjectEdit(
  pageExists: boolean,
  objectId: string,
  objectsOnPage: string[],
): { isDeleted: boolean; objectId: string } {
  if (!pageExists || objectsOnPage.includes(objectId)) {
    return { isDeleted: !pageExists, objectId };
  }
  return { isDeleted: false, objectId };
}

/**
 * Resolves Style Deletion while in use by substituting default fallback style.
 */
export function resolveStyleDeletionInUse(
  targetStyleId: string,
  isDeleted: boolean,
): string {
  if (isDeleted) {
    return DEFAULT_STYLE_FALLBACK_ID;
  }
  return targetStyleId;
}

/**
 * Recomputes linked-story text reflow deterministically across collaborators.
 */
export function resolveLinkedStoryReflow(
  story: TextStory,
  frameIds: string[],
): { storyId: string; frameCount: number; isOverflowed: boolean } {
  const contentText = (story.content as unknown as { text?: string }).text;
  const textLength = contentText?.length ?? JSON.stringify(story.content).length;
  const capacityPerFrame = 250;
  const totalCapacity = frameIds.length * capacityPerFrame;

  return {
    storyId: story.id,
    frameCount: frameIds.length,
    isOverflowed: textLength > totalCapacity,
  };
}

/**
 * Creates a local Y.UndoManager scoped exclusively to the local client's transaction origin,
 * preventing local Undo (Ctrl+Z) from rewinding remote collaborators' changes.
 */
export function createCollaborativeUndoManager(
  _ydoc: Y.Doc,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scopeType: Y.AbstractType<any> | Y.AbstractType<any>[],
  localOrigin: unknown,
): Y.UndoManager {
  return new Y.UndoManager(scopeType, {
    trackedOrigins: new Set([localOrigin]),
    captureTimeout: 500,
  });
}
