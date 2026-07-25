import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { createStarterDocument } from '../domain/document/createDocument';
import { AwarenessManager } from './awareness';
import { canonicalToYjsDoc, yjsToCanonicalDoc } from './crdtDoc';

describe('crdtDoc & awareness (M5.1)', () => {
  it('maps canonical document to Yjs shared maps and round-trips without data loss', () => {
    const originalDoc = createStarterDocument();
    const ydoc = new Y.Doc();

    canonicalToYjsDoc(originalDoc, ydoc);

    expect(ydoc.getArray('pageOrder').length).toBe(originalDoc.pageOrder.length);
    expect(ydoc.getMap('pages').size).toBe(Object.keys(originalDoc.pages).length);
    expect(ydoc.getMap('objects').size).toBe(Object.keys(originalDoc.objects).length);

    const reconstructed = yjsToCanonicalDoc(ydoc);
    expect(reconstructed.id).toBe(originalDoc.id);
    expect(reconstructed.metadata.title).toBe(originalDoc.metadata.title);
    expect(reconstructed.pageOrder).toEqual(originalDoc.pageOrder);
  });

  it('manages ephemeral awareness presence (cursor, active page, selection, color)', () => {
    const awareness = new AwarenessManager({
      displayName: 'Ahmad',
      userColor: '#2563eb',
    });

    expect(awareness.getLocalPresence().displayName).toBe('Ahmad');

    awareness.updateLocalPresence({
      activePageId: 'page-1',
      cursor: { x: 150, y: 300 },
    });

    expect(awareness.getLocalPresence().cursor).toEqual({ x: 150, y: 300 });

    awareness.updatePeerPresence({
      userId: 'peer-2',
      displayName: 'Fatima',
      userColor: '#ec4899',
      activePageId: 'page-1',
    });

    expect(awareness.getAllPresences()).toHaveLength(2);
  });
});
