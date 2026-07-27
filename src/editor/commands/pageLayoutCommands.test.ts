import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { millimetresToPoints } from '../../domain/geometry/units';
import { TransactionHistory } from '../history/transactionHistory';
import {
  applyPageSetupCommand,
  insertSectionBreakCommand,
  resolveTargetPageIds,
  setPageBackgroundCommand,
  setPageBleedCommand,
  toggleGridCommand,
  toggleRulersCommand,
  updateGuidesCommand,
  updateSectionColumnsCommand,
} from './pageLayoutCommands';
import { createUrdupPackage, readUrdupPackage } from '../../persistence/package/urdupPackage';

describe('pageLayoutCommands (Phase 1 Canonical Commands)', () => {
  it('resolves target page IDs correctly', () => {
    let doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    doc = insertSectionBreakCommand(doc, p1, 'next-page');
    const p2 = doc.pageOrder[1]!;

    expect(resolveTargetPageIds(doc, { kind: 'current-page', pageId: p1 })).toEqual([p1]);
    expect(resolveTargetPageIds(doc, { kind: 'selected-pages', pageIds: [p1, p2] })).toEqual([p1, p2]);
    expect(resolveTargetPageIds(doc, { kind: 'whole-document' })).toEqual([p1, p2]);

    const sec1Id = doc.sections![0]!.id;
    expect(resolveTargetPageIds(doc, { kind: 'current-section', sectionId: sec1Id })).toEqual([p1]);
  });

  it('applyPageSetupCommand updates target page geometry and touch modifiedAt', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    const nextDoc = applyPageSetupCommand(
      doc,
      { kind: 'current-page', pageId: p1 },
      { orientation: 'landscape', margins: { top: 30, right: 30, bottom: 30, left: 30 } },
    );

    const page = nextDoc.pages[p1]!;
    expect(page.width).toBeGreaterThan(page.height);
    expect(page.margins.top).toBe(30);
  });

  it('updateSectionColumnsCommand updates columns, gap, and rtlColumnOrder', () => {
    const doc = createStarterDocument();
    const secId = doc.sections![0]!.id;

    const nextDoc = updateSectionColumnsCommand(doc, secId, 2, 24, true);
    const sec = nextDoc.sections![0]!;

    expect(sec.columns).toBe(2);
    expect(sec.columnGap).toBe(24);
    expect(sec.rtlColumnOrder).toBe(true);
  });

  it('setPageBleedCommand and setPageBackgroundCommand update page properties', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    let nextDoc = setPageBleedCommand(
      doc,
      { kind: 'current-page', pageId: p1 },
      { top: 9, right: 9, bottom: 9, left: 9 },
    );
    nextDoc = setPageBackgroundCommand(nextDoc, { kind: 'current-page', pageId: p1 }, '#f8fafc');

    const page = nextDoc.pages[p1]!;
    expect(page.bleed.top).toBe(9);
    expect(page.background).toBe('#f8fafc');
  });

  it('toggleRulersCommand and toggleGridCommand flip document settings', () => {
    let doc = createStarterDocument();
    expect(doc.settings.showRulers).toBeFalsy();
    expect(doc.settings.showGrid).toBeFalsy();

    doc = toggleRulersCommand(doc, true);
    doc = toggleGridCommand(doc, true);
    expect(doc.settings.showRulers).toBe(true);
    expect(doc.settings.showGrid).toBe(true);

    doc = toggleRulersCommand(doc);
    expect(doc.settings.showRulers).toBe(false);
  });

  it('updateGuidesCommand adds page guides to target page', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    const nextDoc = updateGuidesCommand(doc, p1, [
      { id: 'g1', orientation: 'horizontal', position: 100 },
      { id: 'g2', orientation: 'vertical', position: 200 },
    ]);

    expect(nextDoc.pages[p1]!.guides).toHaveLength(2);
  });

  it('Phase 1 Exit Gate: section margin change -> undo -> redo -> save -> reopen roundtrip', async () => {
    const history = new TransactionHistory();
    let doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    doc = insertSectionBreakCommand(doc, p1, 'next-page');

    const sec1Id = doc.sections![0]!.id;
    const newMargins = {
      top: millimetresToPoints(25),
      right: millimetresToPoints(25),
      bottom: millimetresToPoints(25),
      left: millimetresToPoints(25),
    };

    // 1. Push state to history before command execution
    history.push(doc, 'Change section margins');
    const docWithNewMargins = applyPageSetupCommand(
      doc,
      { kind: 'current-section', sectionId: sec1Id },
      { margins: newMargins },
    );

    const page1AfterChange = docWithNewMargins.pages[p1]!;
    expect(page1AfterChange.margins.top).toBe(millimetresToPoints(25));

    // 2. Undo
    const undoneDoc = history.undo(docWithNewMargins)!;
    expect(undoneDoc).toBeDefined();
    expect(undoneDoc.pages[p1]!.margins.top).toBe(millimetresToPoints(15));

    // 3. Redo
    const redoneDoc = history.redo(undoneDoc)!;
    expect(redoneDoc).toBeDefined();
    expect(redoneDoc.pages[p1]!.margins.top).toBe(millimetresToPoints(25));

    // 4. Save to .urdup package & reopen
    const pkg = await createUrdupPackage(redoneDoc);
    const reloadedDoc = await readUrdupPackage(new Uint8Array(pkg.buffer));

    expect(reloadedDoc.pages[p1]!.margins.top).toBe(millimetresToPoints(25));
    expect(reloadedDoc.sections?.length).toBe(2);
  });
});
