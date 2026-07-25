import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import {
  applyMasterToPages,
  createMasterPage,
  overrideMasterObject,
  resolvePageCompositeObjects,
} from './masterPageEngine';
import type { RectangleObject } from '../document/types';

describe('masterPageEngine (M3.3)', () => {
  it('creates and attaches a MasterPage definition to a document', () => {
    const doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    const master = createMasterPage('A-Master');

    const docWithMaster = {
      ...doc,
      masterPages: { [master.id]: master },
    };

    const updatedDoc = applyMasterToPages(docWithMaster, master.id, [pageId]);
    expect(updatedDoc.pages[pageId]?.masterPageId).toBe(master.id);
  });

  it('resolves composite page objects inheriting master page objects and local objects', () => {
    const doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    const master = createMasterPage('A-Master');

    const masterRect: RectangleObject = {
      id: 'master-rect-header',
      pageId: 'master',
      name: 'Running Header Box',
      type: 'rectangle',
      frame: { x: 0, y: 0, width: 500, height: 40, rotation: 0 },
      locked: true,
      hidden: false,
      opacity: 1,
      fill: '#0f172a',
      stroke: '#000000',
      strokeWidth: 0,
      cornerRadius: 0,
    };

    master.objectOrder = [masterRect.id];
    master.objects = { [masterRect.id]: masterRect };

    const docWithMaster = {
      ...doc,
      masterPages: { [master.id]: master },
    };

    const updatedDoc = applyMasterToPages(docWithMaster, master.id, [pageId]);
    const composite = resolvePageCompositeObjects(updatedDoc, pageId);

    expect(composite.length).toBeGreaterThan(0);
    expect(composite[0]?.id).toBe('master-rect-header');
  });

  it('merges per-page master overrides during composite object resolution', () => {
    const doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    const master = createMasterPage('A-Master');

    const masterRect: RectangleObject = {
      id: 'master-rect-header',
      pageId: 'master',
      name: 'Running Header Box',
      type: 'rectangle',
      frame: { x: 0, y: 0, width: 500, height: 40, rotation: 0 },
      locked: true,
      hidden: false,
      opacity: 1,
      fill: '#0f172a',
      stroke: '#000000',
      strokeWidth: 0,
      cornerRadius: 0,
    };

    master.objectOrder = [masterRect.id];
    master.objects = { [masterRect.id]: masterRect };

    const docWithMaster = {
      ...doc,
      masterPages: { [master.id]: master },
    };

    const docWithAppliedMaster = applyMasterToPages(docWithMaster, master.id, [pageId]);
    const docWithOverride = overrideMasterObject(docWithAppliedMaster, pageId, 'master-rect-header', {
      fill: '#dc2626',
    });

    const composite = resolvePageCompositeObjects(docWithOverride, pageId);
    const resolvedMasterRect = composite.find((obj) => obj.id === 'master-rect-header') as RectangleObject;

    expect(resolvedMasterRect?.fill).toBe('#dc2626');
  });
});
