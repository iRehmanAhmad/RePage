import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import { addPage } from '../../editor/commands/documentCommands';
import { insertSectionBreakCommand } from '../../editor/commands/pageLayoutCommands';
import { getSectionPageNumberString } from '../unicode/pageNumbering';
import { applyMasterToPages, createMasterPage, resolvePageCompositeObjects } from './masterPageEngine';
import { createId } from '../document/ids';

describe('Phase 5 Header, Footer, Master Page & Numbering Engine', () => {
  it('formats Urdu page numbers for section pages', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    const pageNumStr = getSectionPageNumberString(doc, p1);
    expect(pageNumStr).toBe('۱');
  });

  it('handles restartAtSection true vs false across section breaks', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const doc2 = addPage(doc);
    const p2 = doc2.pageOrder[1]!;

    // Section break creates section 2 at pSection2
    const doc3 = insertSectionBreakCommand(doc2, p2, 'next-page');
    const sec2 = doc3.sections![1]!;

    // Case A: Default sequential numbering (restartAtSection = false)
    const numPage1 = getSectionPageNumberString(doc3, p1);
    const numSection2 = getSectionPageNumberString(doc3, sec2.startPageId);
    expect(numPage1).toBe('۱');
    expect(numSection2).toBe('۳');

    // Case B: Restart numbering at section start (restartAtSection = true)
    const docRestartNumbering = {
      ...doc3,
      sections: [
        doc3.sections![0]!,
        {
          ...sec2,
          pageNumbering: {
            ...sec2.pageNumbering,
            restartAtSection: true,
          },
        },
      ],
    };

    const numSection2Restart = getSectionPageNumberString(docRestartNumbering, sec2.startPageId);
    expect(numSection2Restart).toBe('۱');
  });

  it('composites master page objects onto linked pages', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    // Create a master page with a logo object
    const master = createMasterPage('A-Master');
    const logoObjId = createId('object');
    master.objects[logoObjId] = {
      id: logoObjId,
      name: 'Logo Box',
      pageId: master.id,
      type: 'rectangle',
      frame: { x: 50, y: 50, width: 100, height: 100, rotation: 0 },
      shapeKind: 'rectangle',
      fill: '#0284c7',
      stroke: '#000000',
      strokeWidth: 1,
      cornerRadius: 0,
      locked: false,
      hidden: false,
      opacity: 1,
    };
    master.objectOrder.push(logoObjId);

    const docWithMaster = {
      ...doc,
      masterPages: {
        [master.id]: master,
      },
    };

    const linkedDoc = applyMasterToPages(docWithMaster, master.id, [p1]);
    const compositeObjects = resolvePageCompositeObjects(linkedDoc, p1);

    expect(compositeObjects.length).toBeGreaterThan(0);
    expect(compositeObjects.some((o) => o.id === logoObjId)).toBe(true);
  });
});
