import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import { setPageOrientationCommand, insertSectionBreakCommand, applyPageSetupCommand, updateSectionColumnsCommand } from '../editor/commands/pageLayoutCommands';
import { validateDocumentReferences } from '../domain/document/schema';
import { createUrdupPackage, readUrdupPackage } from '../persistence/package/urdupPackage';

describe('Milestone 8 Audit Fixes Verification', () => {
  it('1. setPageOrientationCommand: selecting Portrait on a portrait page keeps portrait (210x297mm)', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const originalWidth = doc.pages[p1]!.width;
    const originalHeight = doc.pages[p1]!.height;

    expect(originalWidth).toBeLessThan(originalHeight); // portrait A4

    const portraitDoc = setPageOrientationCommand(
      doc,
      { kind: 'current-page', pageId: p1 },
      'portrait',
    );

    const page = portraitDoc.pages[p1]!;
    expect(page.width).toBe(originalWidth);
    expect(page.height).toBe(originalHeight);
    expect(page.width).toBeLessThan(page.height);
  });

  it('2. Continuous Section Breaks: duplicate startPageId is allowed in schema validation & saves/reopens cleanly', async () => {
    let doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    // Insert continuous section break on p1
    doc = insertSectionBreakCommand(doc, p1, 'continuous');

    expect(doc.sections).toHaveLength(2);
    expect(doc.sections![0]!.startPageId).toBe(p1);
    expect(doc.sections![1]!.startPageId).toBe(p1);
    expect(doc.sections![1]!.breakType).toBe('continuous');

    // Schema validation check
    const errors = validateDocumentReferences(doc);
    expect(errors).toEqual([]);

    // .urdup Package save & reopen roundtrip
    const pkgBuffer = await createUrdupPackage(doc);
    const reloadedDoc = await readUrdupPackage(pkgBuffer);

    expect(reloadedDoc.sections).toHaveLength(2);
    expect(reloadedDoc.sections![1]!.breakType).toBe('continuous');
  });

  it('3. Gutter and Mirror Margins: applyPageSetupCommand persists gutter & mirrorMargins', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    const nextDoc = applyPageSetupCommand(
      doc,
      { kind: 'current-page', pageId: p1 },
      {
        gutter: 25,
        gutterPosition: 'right',
        mirrorMargins: true,
      },
    );

    const page = nextDoc.pages[p1]!;
    expect(page.gutter).toBe(25);
    expect(page.gutterPosition).toBe('right');
    expect(page.mirrorMargins).toBe(true);
  });

  it('4. 4-Column Section setup is preserved in document section model', () => {
    const doc = createStarterDocument();
    const secId = doc.sections![0]!.id;

    const nextDoc = updateSectionColumnsCommand(doc, secId, 4, 12, true);
    const sec = nextDoc.sections![0]!;

    expect(sec.columns).toBe(4);
    expect(sec.columnGap).toBe(12);
  });
});
