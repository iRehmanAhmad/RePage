import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { addRectangle } from './documentCommands';
import { addTableObject, alignPageObjects, reorderPageObject, setObjectWrapping } from './objectCommands';

describe('objectCommands (Phase UX-4)', () => {
  it('reorders objects forward and backward in page objectOrder', () => {
    let doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;

    doc = addRectangle(doc, pageId);
    doc = addRectangle(doc, pageId);

    const page = doc.pages[pageId]!;
    const firstObjId = page.objectOrder[0]!;
    const secondObjId = page.objectOrder[1]!;

    // Bring first object forward
    const reorderedDoc = reorderPageObject(doc, pageId, firstObjId, 'forward');
    const updatedPage = reorderedDoc.pages[pageId]!;

    expect(updatedPage.objectOrder[0]).toBe(secondObjId);
    expect(updatedPage.objectOrder[1]).toBe(firstObjId);
  });

  it('aligns page objects to page left and center', () => {
    let doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;

    doc = addRectangle(doc, pageId);
    const objId = doc.pages[pageId]!.objectOrder[0]!;

    const alignedDoc = alignPageObjects(doc, pageId, [objId], 'left');
    expect(alignedDoc.objects[objId]?.frame.x).toBe(0);
  });

  it('adds a TableObject to the document', () => {
    let doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;

    doc = addTableObject(doc, pageId, 2, 3);
    const page = doc.pages[pageId]!;
    const tableId = page.objectOrder[page.objectOrder.length - 1]!;
    const tableObj = doc.objects[tableId];

    expect(tableObj?.type).toBe('table');
    if (tableObj && tableObj.type === 'table') {
      expect(tableObj.rows.length).toBe(2);
      expect(tableObj.rows[0]?.cells.length).toBe(3);
    }
  });

  it('sets text wrapping and crop bounds on objects', () => {
    let doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;

    doc = addRectangle(doc, pageId);
    const objId = doc.pages[pageId]!.objectOrder[0]!;

    const wrappedDoc = setObjectWrapping(doc, objId, 'square');
    expect(wrappedDoc.objects[objId]?.wrapMode).toBe('square');
  });
});
