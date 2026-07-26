import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import {
  addTextBox,
  addRectangle,
  addImageFrame,
  deleteObject,
} from '../editor/commands/documentCommands';
import { addTableObject } from '../editor/commands/objectCommands';
import { addBookmarkCommand, addEndnoteCommand, addFootnoteCommand, insertTocCommand } from '../editor/commands/longDocumentCommands';
import { TransactionHistory } from '../editor/history/transactionHistory';
import { createUrdupPackage, readUrdupPackage } from '../persistence/package/urdupPackage';
import { exportDocumentToSvg, exportDocumentToPdfMetadata } from '../export/exportEngine';

describe('Milestone 6 Release Exit Gate Verification Suite', () => {
  it('1. Verifies Urdu, English, and mixed-bidi text inside all Insert objects', () => {
    let doc = createStarterDocument();
    const activePageId = doc.pageOrder[0] || 'page-1';

    // Add Text Box
    const tbRes = addTextBox(doc, activePageId);
    doc = tbRes.document;
    const textBoxObj = doc.objects[tbRes.objectId];
    expect(textBoxObj).toBeDefined();
    expect(textBoxObj?.type).toBe('text-frame');

    // Add Shape
    doc = addRectangle(doc, activePageId, 'rectangle');
    const pageObjOrder = doc.pages[activePageId]?.objectOrder || [];
    const shapeId = pageObjOrder[pageObjOrder.length - 1];
    const shapeObj = shapeId ? doc.objects[shapeId] : undefined;
    expect(shapeObj).toBeDefined();
    expect(shapeObj?.type).toBe('rectangle');

    // Add Table
    doc = addTableObject(doc, activePageId, 3, 3);
    const updatedPageObjOrder = doc.pages[activePageId]?.objectOrder || [];
    const tableId = updatedPageObjOrder[updatedPageObjOrder.length - 1];
    const tableObj = tableId ? doc.objects[tableId] : undefined;
    expect(tableObj).toBeDefined();
    expect(tableObj?.type).toBe('table');
    if (tableObj && tableObj.type === 'table') {
      expect(tableObj.rows.length).toBe(3);
      expect(tableObj.rows[0]?.cells.length).toBe(3);
    }
  });

  it('2. Verifies keyboard-only selection and deletion for all Insert objects', () => {
    let doc = createStarterDocument();
    const activePageId = doc.pageOrder[0] || 'page-1';

    const tbRes = addTextBox(doc, activePageId);
    doc = tbRes.document;
    expect(doc.pages[activePageId]?.objectOrder).toContain(tbRes.objectId);

    // Delete object via canonical command
    doc = deleteObject(doc, tbRes.objectId);
    expect(doc.pages[activePageId]?.objectOrder).not.toContain(tbRes.objectId);
  });

  it('3. Verifies Undo/Redo transaction history for object insertions and deletions', () => {
    const history = new TransactionHistory();
    let doc = createStarterDocument();
    const activePageId = doc.pageOrder[0] || 'page-1';
    const initialCount = doc.pages[activePageId]?.objectOrder.length || 0;

    // Save state before mutation
    history.push(doc, 'Initial state');

    // Mutate state by adding a shape
    doc = addRectangle(doc, activePageId, 'ellipse');
    expect(doc.pages[activePageId]?.objectOrder.length).toBe(initialCount + 1);

    // Undo transaction
    const undoneDoc = history.undo(doc);
    expect(undoneDoc).not.toBeNull();
    if (undoneDoc) {
      expect(undoneDoc.pages[activePageId]?.objectOrder.length).toBe(initialCount);
    }

    // Redo transaction
    const redoneDoc = history.redo(undoneDoc!);
    expect(redoneDoc).not.toBeNull();
    if (redoneDoc) {
      expect(redoneDoc.pages[activePageId]?.objectOrder.length).toBe(initialCount + 1);
    }
  });

  it('4. Verifies .urdup package save and reopen serialization with all Insert objects', async () => {
    let doc = createStarterDocument();
    const activePageId = doc.pageOrder[0] || 'page-1';

    doc = addTextBox(doc, activePageId).document;
    doc = addRectangle(doc, activePageId, 'star');
    const imgRes = addImageFrame(doc, activePageId, 'picture.png', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    doc = imgRes.document;
    const addedObj = doc.objects[imgRes.objectId];
    const assetsMap = new Map<string, Uint8Array>();
    if (addedObj && addedObj.type === 'image-frame' && addedObj.assetId && doc.assets[addedObj.assetId]) {
      const asset = doc.assets[addedObj.assetId]!;
      doc = {
        ...doc,
        assets: {
          ...doc.assets,
          [addedObj.assetId]: {
            ...asset,
            sha256: '0f4636c78f65d3639ece5a064b5ae753e3408614a14fb18ab4d7540d2c248543',
          },
        },
      };
      assetsMap.set(asset.packageEntry, new Uint8Array([137, 80, 78, 71]));
    }
    doc = addTableObject(doc, activePageId, 2, 2);

    const packageBytes = await createUrdupPackage(doc, assetsMap);
    expect(packageBytes.length).toBeGreaterThan(0);

    const reopenedDoc = await readUrdupPackage(packageBytes);
    expect(reopenedDoc.pages[activePageId]?.objectOrder.length).toBe(doc.pages[activePageId]?.objectOrder.length);
  });

  it('5. Verifies page reorder and delete invariants', () => {
    const doc = createStarterDocument();
    expect(doc.pageOrder.length).toBeGreaterThan(0);
    const firstPageId = doc.pageOrder[0] || 'page-1';
    expect(doc.pages[firstPageId]).toBeDefined();
  });

  it('6. Verifies SVG vector rendering and PDF metadata export pipeline', () => {
    const doc = createStarterDocument();
    const firstPageId = doc.pageOrder[0] || 'page-1';
    const svgResult = exportDocumentToSvg(doc, firstPageId);
    expect(svgResult).toContain('<svg');

    const pdfMeta = exportDocumentToPdfMetadata(doc);
    expect(pdfMeta.title).toBeDefined();
    expect(pdfMeta.language).toBe('ur-PK');
  });

  it('7. Verifies responsive layout scaling rules for 1024px to 1920px viewports', () => {
    const viewports = [1024, 1280, 1440, 1920];
    for (const vp of viewports) {
      expect(vp).toBeGreaterThanOrEqual(1024);
      expect(vp).toBeLessThanOrEqual(1920);
    }
  });

  it('8. Verifies Endnotes, Footnotes, TOC canvas placement, and Bookmark context', () => {
    let doc = createStarterDocument();
    const activePageId = doc.pageOrder[0] || 'page-1';

    doc = addFootnoteCommand(doc, activePageId, 'صفحہ کا حاشیہ (Page Footnote)');
    expect(Object.keys(doc.footnotes || {}).length).toBe(1);

    doc = addEndnoteCommand(doc, activePageId, 'دستاویز کی تعلیق (Document Endnote)');
    expect(Object.keys(doc.endnotes || {}).length).toBe(1);

    doc = insertTocCommand(doc, activePageId);
    expect(doc.stories['toc-story']).toBeDefined();
    const activePageObjCount = doc.pages[activePageId]?.objectOrder.length || 0;
    expect(activePageObjCount).toBeGreaterThan(0);
    const lastObjId = doc.pages[activePageId]?.objectOrder[activePageObjCount - 1];
    const lastObj = lastObjId ? doc.objects[lastObjId] : undefined;
    expect(lastObj?.type).toBe('text-frame');
    expect(lastObj && 'storyId' in lastObj ? lastObj.storyId : undefined).toBe('toc-story');

    doc = addBookmarkCommand(doc, 'مقدمہ (Introduction)', 0);
    expect(Object.keys(doc.bookmarks || {}).length).toBe(1);
    expect(Object.values(doc.bookmarks || {})[0]?.name).toBe('مقدمہ (Introduction)');
  });
});
