import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { createStarterDocument } from '../domain/document/createDocument';
import {
  DEFAULT_STYLE_FALLBACK_ID,
  createCollaborativeUndoManager,
  resolveConcurrentMovement,
  resolveConcurrentResize,
  resolveDeleteVsEdit,
  resolveLinkedStoryReflow,
  resolvePageDeleteVsObjectEdit,
  resolveStyleDeletionInUse,
} from './conflictEngine';

describe('conflictEngine (M5.2)', () => {
  it('resolves concurrent movement using Last-Writer-Wins', () => {
    const current = { x: 50, y: 50 };
    const mutationA = { objectId: 'obj-1', x: 100, y: 120, timestamp: 1000, author: 'UserA' };
    const mutationB = { objectId: 'obj-1', x: 200, y: 220, timestamp: 2000, author: 'UserB' };

    const resolved = resolveConcurrentMovement(current, mutationA, mutationB);
    expect(resolved).toEqual({ x: 200, y: 220 });
  });

  it('resolves concurrent resize enforcing minimum frame bounds', () => {
    const current = { width: 100, height: 100 };
    const mutationA = { objectId: 'obj-1', width: 5, height: -20, timestamp: 3000, author: 'UserA' };
    const mutationB = { objectId: 'obj-1', width: 50, height: 40, timestamp: 2000, author: 'UserB' };

    const resolved = resolveConcurrentResize(current, mutationA, mutationB);
    expect(resolved).toEqual({ width: 10, height: 10 });
  });

  it('handles Delete vs Edit precedence safely', () => {
    expect(resolveDeleteVsEdit(false, { text: 'New Text' })).toBeNull();
    expect(resolveDeleteVsEdit(true, { text: 'New Text' })).toEqual({ text: 'New Text' });
  });

  it('cascades page deletion over child object edits', () => {
    const resPageDeleted = resolvePageDeleteVsObjectEdit(false, 'obj-1', ['obj-1']);
    expect(resPageDeleted.isDeleted).toBe(true);

    const resPageActive = resolvePageDeleteVsObjectEdit(true, 'obj-1', ['obj-1']);
    expect(resPageActive.isDeleted).toBe(false);
  });

  it('substitutes default style fallback when in-use style is deleted', () => {
    expect(resolveStyleDeletionInUse('custom-heading', true)).toBe(DEFAULT_STYLE_FALLBACK_ID);
    expect(resolveStyleDeletionInUse('custom-heading', false)).toBe('custom-heading');
  });

  it('recomputes linked story reflow overflow state', () => {
    const doc = createStarterDocument();
    const story = Object.values(doc.stories)[0]!;
    const reflow = resolveLinkedStoryReflow(story, ['frame-1', 'frame-2']);
    expect(reflow.storyId).toBe(story.id);
    expect(reflow.frameCount).toBe(2);
  });

  it('scopes Y.UndoManager strictly to local client transaction origin', () => {
    const ydoc = new Y.Doc();
    const yArray = ydoc.getArray<string>('testArray');
    const localOrigin = 'LOCAL_CLIENT_ORIGIN';

    const undoManager = createCollaborativeUndoManager(ydoc, yArray, localOrigin);

    ydoc.transact(() => {
      yArray.push(['Item A']);
    }, localOrigin);

    expect(yArray.length).toBe(1);

    // Remote edit
    ydoc.transact(() => {
      yArray.push(['Remote B']);
    }, 'REMOTE_CLIENT_ORIGIN');

    expect(yArray.length).toBe(2);

    // Undo local change
    undoManager.undo();
    expect(yArray.toArray()).toEqual(['Remote B']);
  });
});
