import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import { addPage } from '../editor/commands/documentCommands';
import {
  applyPageSetupCommand,
  insertSectionBreakCommand,
  setPageBackgroundCommand,
  setPageBleedCommand,
  toggleGridCommand,
  toggleRulersCommand,
  toggleSnapToGuidesCommand,
  updateGuidesCommand,
  updateSectionColumnsCommand,
} from '../editor/commands/pageLayoutCommands';
import { getSectionPageNumberString } from '../domain/unicode/pageNumbering';
import { applyMasterToPages, createMasterPage, resolvePageCompositeObjects } from '../domain/layout/masterPageEngine';
import { getExportReadinessReport, runPreflightCheck } from '../domain/diagnostics/preflightEngine';
import { TransactionHistory } from '../editor/history/transactionHistory';
import { createUrdupPackage, readUrdupPackage } from '../persistence/package/urdupPackage';
import { createId } from '../domain/document/ids';
import type { PageGuide } from '../domain/document/types';

describe('Milestone 8 Page Layout & Section Model Release Exit Gate', () => {
  it('1. Verifies canonical Page Setup, Section Breaks, and Columns commands', () => {
    let doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    // Add page 2
    doc = addPage(doc);
    const p2 = doc.pageOrder[1]!;

    // Apply A4 landscape setup to page 1
    doc = applyPageSetupCommand(doc, { kind: 'current-page', pageId: p1 }, {
      width: 841.89,
      height: 595.28,
      orientation: 'landscape',
      margins: { top: 36, right: 36, bottom: 36, left: 36 },
    });

    expect(doc.pages[p1]?.width).toBe(841.89);
    expect(doc.pages[p1]?.height).toBe(595.28);

    // Insert Section Break at page 2
    doc = insertSectionBreakCommand(doc, p2, 'next-page');
    expect(doc.sections).toBeDefined();
    expect(doc.sections!.length).toBe(2);

    const sec2 = doc.sections![1]!;
    // Update section 2 columns to 2 columns
    doc = updateSectionColumnsCommand(doc, sec2.id, 2, 18, true);
    expect(doc.sections![1]?.columns).toBe(2);
    expect(doc.sections![1]?.rtlColumnOrder).toBe(true);
  });

  it('2. Verifies Bleed, Backgrounds, Rulers, Grid, Guidelines, and Snap-to-Guides', () => {
    let doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    doc = setPageBleedCommand(doc, { kind: 'current-page', pageId: p1 }, { top: 9, right: 9, bottom: 9, left: 9 });
    doc = setPageBackgroundCommand(doc, { kind: 'current-page', pageId: p1 }, '#f8fafc');
    doc = toggleRulersCommand(doc, true);
    doc = toggleGridCommand(doc, true);
    doc = toggleSnapToGuidesCommand(doc, true);

    const guides: PageGuide[] = [
      { id: 'g1', orientation: 'vertical', position: 100 },
      { id: 'g2', orientation: 'horizontal', position: 200 },
    ];
    doc = updateGuidesCommand(doc, p1, guides);

    expect(doc.pages[p1]?.bleed).toEqual({ top: 9, right: 9, bottom: 9, left: 9 });
    expect(doc.pages[p1]?.background).toBe('#f8fafc');
    expect(doc.settings.showRulers).toBe(true);
    expect(doc.settings.showGrid).toBe(true);
    expect(doc.settings.snapToGuides).toBe(true);
    expect(doc.pages[p1]?.guides).toEqual(guides);
  });

  it('3. Verifies Undo/Redo transaction history for Page Layout mutations', () => {
    const history = new TransactionHistory();
    let doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    history.push(doc, 'Initial state');

    // Apply layout change
    doc = setPageBackgroundCommand(doc, { kind: 'current-page', pageId: p1 }, '#e0f2fe');
    expect(doc.pages[p1]?.background).toBe('#e0f2fe');

    // Undo
    const undoneDoc = history.undo(doc);
    expect(undoneDoc).not.toBeNull();
    expect(undoneDoc?.pages[p1]?.background).toBe('#ffffff');

    // Redo
    const redoneDoc = history.redo(undoneDoc!);
    expect(redoneDoc).not.toBeNull();
    expect(redoneDoc?.pages[p1]?.background).toBe('#e0f2fe');
  });

  it('4. Verifies Master Page object compositing and Urdu section page numbering', () => {
    let doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    // Localized Urdu section page numbering
    const numStr = getSectionPageNumberString(doc, p1);
    expect(numStr).toBe('۱');

    // Create Master Page with a background shape
    const master = createMasterPage('A-Master');
    const bgObjId = createId('object');
    master.objects[bgObjId] = {
      id: bgObjId,
      name: 'Master Header BG',
      pageId: master.id,
      type: 'rectangle',
      frame: { x: 0, y: 0, width: 595.28, height: 40, rotation: 0 },
      shapeKind: 'rectangle',
      fill: '#0284c7',
      stroke: '#000000',
      strokeWidth: 0,
      cornerRadius: 0,
      locked: true,
      hidden: false,
      opacity: 1,
    };
    master.objectOrder.push(bgObjId);

    doc = {
      ...doc,
      masterPages: {
        [master.id]: master,
      },
    };

    doc = applyMasterToPages(doc, master.id, [p1]);
    const compositeObjects = resolvePageCompositeObjects(doc, p1);

    expect(compositeObjects.some((o) => o.id === bgObjId)).toBe(true);
  });

  it('5. Verifies .urdup package save/reload roundtrip and PDF Export Readiness', async () => {
    let doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    doc = addPage(doc);
    const p2 = doc.pageOrder[1]!;

    // Setup multi-section layout
    doc = insertSectionBreakCommand(doc, p2, 'next-page');
    doc = updateSectionColumnsCommand(doc, doc.sections![1]!.id, 2, 18, true);
    doc = setPageBleedCommand(doc, { kind: 'whole-document' }, { top: 9, right: 9, bottom: 9, left: 9 });
    doc = toggleSnapToGuidesCommand(doc, true);

    const guides: PageGuide[] = [{ id: 'g1', orientation: 'vertical', position: 120 }];
    doc = updateGuidesCommand(doc, p1, guides);

    // Save package
    const packageBuffer = await createUrdupPackage(doc);

    // Reopen package
    const reloadedDoc = await readUrdupPackage(packageBuffer);

    expect(reloadedDoc.sections?.length).toBe(2);
    expect(reloadedDoc.sections![1]?.columns).toBe(2);
    expect(reloadedDoc.pages[p1]?.bleed).toEqual({ top: 9, right: 9, bottom: 9, left: 9 });
    expect(reloadedDoc.settings.snapToGuides).toBe(true);
    expect(reloadedDoc.pages[p1]?.guides).toEqual(guides);

    // Preflight check
    const preflight = runPreflightCheck(reloadedDoc);
    expect(preflight.errorCount).toBe(0);

    // Export readiness check
    const readiness = getExportReadinessReport(reloadedDoc);
    expect(readiness.isPdfReady).toBe(true);
    expect(readiness.score).toBe(100);
    expect(readiness.isPrintReady).toBe(true);
  });
});
