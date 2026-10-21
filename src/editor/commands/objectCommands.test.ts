import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { addRectangle, addTextFrame } from './documentCommands';
import { addTableObject, alignPageObjects, duplicateObjectCommand, reorderPageObject, setObjectWrapping, stepAndRepeatObjectCommand } from './objectCommands';
import { clampStepAndRepeatSpec, measurementToPoints, stepAndRepeatCells } from '../../domain/geometry/stepAndRepeat';

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

describe('duplicate + step-and-repeat (batch 12)', () => {
  it('stepAndRepeatCells computes grid offsets, skipping the original cell', () => {
    const cells = stepAndRepeatCells(100, 50, {
      rows: 2,
      columns: 3,
      horizontalGapPoints: 10,
      verticalGapPoints: 20,
    });
    expect(cells).toHaveLength(5);
    expect(cells[0]).toEqual({ row: 0, column: 1, dx: 110, dy: 0 });
    expect(cells[1]).toEqual({ row: 0, column: 2, dx: 220, dy: 0 });
    expect(cells[2]).toEqual({ row: 1, column: 0, dx: 0, dy: 70 });
    expect(cells[4]).toEqual({ row: 1, column: 2, dx: 220, dy: 70 });
  });

  it('grid spec is clamped: minimum 1x1 (no copies) and the 500-copy cap', () => {
    expect(clampStepAndRepeatSpec({ rows: 0, columns: 0, horizontalGapPoints: 0, verticalGapPoints: 0 }))
      .toMatchObject({ rows: 1, columns: 1 });
    const huge = clampStepAndRepeatSpec({ rows: 99, columns: 99, horizontalGapPoints: 0, verticalGapPoints: 0 });
    expect(huge.rows * huge.columns - 1).toBeLessThanOrEqual(500);
    expect(measurementToPoints(25.4, 'mm')).toBeCloseTo(72);
    expect(measurementToPoints(1, 'in')).toBe(72);
    expect(measurementToPoints(12, 'pt')).toBe(12);
  });

  it('duplicates a rectangle once at +18/+18 with a fresh id, right after the original', () => {
    let doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    doc = addRectangle(doc, pageId);
    const objId = doc.pages[pageId]!.objectOrder[0]!;
    const source = doc.objects[objId]!;

    const { document: next, newObjectId } = duplicateObjectCommand(doc, objId);
    expect(newObjectId).not.toBeNull();
    expect(newObjectId).not.toBe(objId);
    const copy = next.objects[newObjectId!]!;
    expect(copy.frame.x).toBe(source.frame.x + 18);
    expect(copy.frame.y).toBe(source.frame.y + 18);
    expect(next.pages[pageId]!.objectOrder.indexOf(newObjectId!))
      .toBe(next.pages[pageId]!.objectOrder.indexOf(objId) + 1);
  });

  it('step-and-repeat fills the grid with fresh ids at computed offsets', () => {
    let doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    doc = addRectangle(doc, pageId);
    const objId = doc.pages[pageId]!.objectOrder[0]!;
    const source = doc.objects[objId]!;

    const { document: next, newObjectIds } = stepAndRepeatObjectCommand(doc, objId, {
      rows: 2,
      columns: 2,
      horizontalGapPoints: 5,
      verticalGapPoints: 7,
    });
    expect(newObjectIds).toHaveLength(3);
    expect(new Set(newObjectIds).size).toBe(3);
    const positions = newObjectIds.map((id) => {
      const o = next.objects[id]!;
      return [o.frame.x - source.frame.x, o.frame.y - source.frame.y];
    });
    expect(positions).toEqual([
      [source.frame.width + 5, 0],
      [0, source.frame.height + 7],
      [source.frame.width + 5, source.frame.height + 7],
    ]);
  });

  it('text-frame copies get a copied story but are NOT linked into the flow chain', () => {
    let doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    doc = addTextFrame(doc, pageId);
    // Simulate a mid-chain frame by setting chain links on it.
    const frameId = doc.pages[pageId]!.objectOrder.find(
      (id) => doc.objects[id]?.type === 'text-frame',
    )!;
    const frame = doc.objects[frameId]!;
    if (frame.type !== 'text-frame') throw new Error('expected text frame');
    const withLinks = {
      ...doc,
      objects: {
        ...doc.objects,
        [frameId]: { ...frame, nextFrameId: 'frame_next', previousFrameId: 'frame_prev', sequenceIndex: 3 },
      },
    };

    const { document: next, newObjectIds } = stepAndRepeatObjectCommand(withLinks, frameId, {
      rows: 1,
      columns: 2,
      horizontalGapPoints: 0,
      verticalGapPoints: 0,
    });
    expect(newObjectIds).toHaveLength(1);
    const copy = next.objects[newObjectIds[0]!]!;
    if (copy.type !== 'text-frame') throw new Error('expected text frame copy');
    // Fresh, independent story with equal content.
    expect(copy.storyId).not.toBe(frame.storyId);
    expect(next.stories[copy.storyId]?.content).toEqual(next.stories[frame.storyId]?.content);
    expect(next.stories[copy.storyId]).not.toBe(next.stories[frame.storyId]);
    // Not linked: chain fields cleared on the copy...
    expect(copy.nextFrameId ?? null).toBeNull();
    expect(copy.previousFrameId ?? null).toBeNull();
    expect(copy.sequenceIndex).toBeUndefined();
    // ...and the ORIGINAL's chain is untouched.
    const originalAfter = next.objects[frameId]!;
    if (originalAfter.type !== 'text-frame') throw new Error('expected text frame');
    expect(originalAfter.nextFrameId).toBe('frame_next');
    expect(originalAfter.previousFrameId).toBe('frame_prev');
    expect(originalAfter.sequenceIndex).toBe(3);
  });

  it('copies that fall off the page are still created', () => {
    let doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    doc = addRectangle(doc, pageId);
    const objId = doc.pages[pageId]!.objectOrder[0]!;
    const page = doc.pages[pageId]!;
    const source = doc.objects[objId]!;
    // Move the source near the right edge so column 2 lands off-page.
    const nearEdge = {
      ...doc,
      objects: {
        ...doc.objects,
        [objId]: { ...source, frame: { ...source.frame, x: page.width - 10 } },
      },
    };
    const { newObjectIds } = stepAndRepeatObjectCommand(nearEdge, objId, {
      rows: 1,
      columns: 3,
      horizontalGapPoints: 0,
      verticalGapPoints: 0,
    });
    expect(newObjectIds).toHaveLength(2);
  });

  it('unknown object is a no-op', () => {
    const doc = createStarterDocument();
    const { document: next, newObjectIds } = stepAndRepeatObjectCommand(doc, 'missing', {
      rows: 2,
      columns: 2,
      horizontalGapPoints: 0,
      verticalGapPoints: 0,
    });
    expect(next).toBe(doc);
    expect(newObjectIds).toEqual([]);
  });
});
