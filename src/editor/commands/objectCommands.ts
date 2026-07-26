import type { CropBounds, PageId, PageObject, RePageDocument, TableCell, TableObject, TableRow, TextWrapMode, AssetReference } from '../../domain/document/types';
import { createId } from '../../domain/document/ids';
import { paragraph } from '../../domain/rich-text/types';
import type { OcrPageResult } from '../../domain/ocr/ocrEngine';
import { convertOcrResultToDocumentObjects } from '../../domain/ocr/ocrCorrection';

export type ReorderAction = 'forward' | 'backward' | 'front' | 'back';
export type AlignmentAction = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionAction = 'horizontal' | 'vertical';

/**
 * Reorders an object in the page objectOrder array (Z-ordering: Bring Forward, Send Backward, etc.).
 */
export function reorderPageObject(
  doc: RePageDocument,
  pageId: PageId,
  objectId: string,
  action: ReorderAction,
): RePageDocument {
  const page = doc.pages[pageId];
  if (!page) return doc;

  const currentOrder = [...page.objectOrder];
  const idx = currentOrder.indexOf(objectId);
  if (idx === -1) return doc;

  currentOrder.splice(idx, 1);

  if (action === 'front') {
    currentOrder.push(objectId);
  } else if (action === 'back') {
    currentOrder.unshift(objectId);
  } else if (action === 'forward') {
    const targetIdx = Math.min(currentOrder.length, idx + 1);
    currentOrder.splice(targetIdx, 0, objectId);
  } else if (action === 'backward') {
    const targetIdx = Math.max(0, idx - 1);
    currentOrder.splice(targetIdx, 0, objectId);
  }

  return {
    ...doc,
    pages: {
      ...doc.pages,
      [pageId]: {
        ...page,
        objectOrder: currentOrder,
      },
    },
  };
}

/**
 * Aligns selected objects on a page.
 */
export function alignPageObjects(
  doc: RePageDocument,
  pageId: PageId,
  objectIds: string[],
  alignment: AlignmentAction,
): RePageDocument {
  const page = doc.pages[pageId];
  if (!page || objectIds.length === 0) return doc;

  const objectsToAlign = objectIds.map((id) => doc.objects[id]).filter(Boolean) as PageObject[];
  if (objectsToAlign.length === 0) return doc;

  const updatedObjects = { ...doc.objects };
  const isSingle = objectsToAlign.length === 1;

  if (alignment === 'left') {
    const targetX = isSingle ? 0 : Math.min(...objectsToAlign.map((o) => o.frame.x));
    for (const obj of objectsToAlign) {
      updatedObjects[obj.id] = { ...obj, frame: { ...obj.frame, x: targetX } };
    }
  } else if (alignment === 'right') {
    const targetRight = isSingle ? page.width : Math.max(...objectsToAlign.map((o) => o.frame.x + o.frame.width));
    for (const obj of objectsToAlign) {
      updatedObjects[obj.id] = { ...obj, frame: { ...obj.frame, x: targetRight - obj.frame.width } };
    }
  } else if (alignment === 'center') {
    const pageCenterX = page.width / 2;
    for (const obj of objectsToAlign) {
      updatedObjects[obj.id] = { ...obj, frame: { ...obj.frame, x: pageCenterX - obj.frame.width / 2 } };
    }
  } else if (alignment === 'top') {
    const targetY = isSingle ? 0 : Math.min(...objectsToAlign.map((o) => o.frame.y));
    for (const obj of objectsToAlign) {
      updatedObjects[obj.id] = { ...obj, frame: { ...obj.frame, y: targetY } };
    }
  } else if (alignment === 'bottom') {
    const targetBottom = isSingle ? page.height : Math.max(...objectsToAlign.map((o) => o.frame.y + o.frame.height));
    for (const obj of objectsToAlign) {
      updatedObjects[obj.id] = { ...obj, frame: { ...obj.frame, y: targetBottom - obj.frame.height } };
    }
  } else if (alignment === 'middle') {
    const pageCenterY = page.height / 2;
    for (const obj of objectsToAlign) {
      updatedObjects[obj.id] = { ...obj, frame: { ...obj.frame, y: pageCenterY - obj.frame.height / 2 } };
    }
  }

  return {
    ...doc,
    objects: updatedObjects,
  };
}

/**
 * Updates text wrap mode and optional wrap distances for a page object.
 */
export function setObjectWrapping(
  doc: RePageDocument,
  objectId: string,
  wrapMode: TextWrapMode,
  wrapDistance?: { top: number; right: number; bottom: number; left: number },
): RePageDocument {
  const obj = doc.objects[objectId];
  if (!obj) return doc;

  const updatedObj: PageObject = {
    ...obj,
    wrapMode,
    wrapDistance: wrapDistance ? { ...wrapDistance } : obj.wrapDistance,
  };

  return {
    ...doc,
    objects: {
      ...doc.objects,
      [objectId]: updatedObj,
    },
  };
}

/**
 * Updates crop bounds for an image object.
 */
export function setObjectCrop(
  doc: RePageDocument,
  objectId: string,
  crop: CropBounds,
): RePageDocument {
  const obj = doc.objects[objectId];
  if (!obj || obj.type !== 'image-frame') return doc;

  return {
    ...doc,
    objects: {
      ...doc.objects,
      [objectId]: {
        ...obj,
        crop,
      },
    },
  };
}

/**
 * Adds a new TableObject to the canonical page.
 */
export function addTableObject(
  doc: RePageDocument,
  pageId: PageId,
  rowCount: number = 3,
  colCount: number = 3,
): RePageDocument {
  const page = doc.pages[pageId];
  if (!page) return doc;

  const tableId = createId('table');
  const rows: TableRow[] = [];

  for (let r = 0; r < rowCount; r++) {
    const cells: TableCell[] = [];
    for (let c = 0; c < colCount; c++) {
      cells.push({
        id: `cell_${r}_${c}`,
        content: { type: 'doc', content: [paragraph(`خانہ ${r + 1},${c + 1}`, 'rtl')] },
        backgroundColor: '#ffffff',
      });
    }
    rows.push({ id: `row_${r}`, cells });
  }

  const tableObj: TableObject = {
    id: tableId,
    pageId,
    name: `جدول ${page.objectOrder.length + 1}`,
    type: 'table',
    frame: {
      x: page.margins.left,
      y: page.margins.top + 50,
      width: page.width - page.margins.left - page.margins.right,
      height: rowCount * 32,
      rotation: 0,
    },
    locked: false,
    hidden: false,
    opacity: 1,
    rows,
    cellPadding: { top: 6, right: 8, bottom: 6, left: 8 },
    borderColor: '#cbd5e1',
    borderWidth: 1,
  };

  return {
    ...doc,
    pages: {
      ...doc.pages,
      [pageId]: {
        ...page,
        objectOrder: [...page.objectOrder, tableId],
      },
    },
    objects: {
      ...doc.objects,
      [tableId]: tableObj,
    },
  };
}

/**
 * Inserts a row above or below a specified row index in a TableObject.
 */
export function insertTableRow(
  doc: RePageDocument,
  tableId: string,
  targetRowIndex: number = 0,
  position: 'above' | 'below' = 'below',
): RePageDocument {
  const table = doc.objects[tableId];
  if (!table || table.type !== 'table') return doc;

  const colCount = table.rows[0]?.cells.length || 3;
  const insertIndex = position === 'above' ? targetRowIndex : targetRowIndex + 1;
  const newRowId = createId('row');

  const newCells: TableCell[] = [];
  for (let c = 0; c < colCount; c++) {
    newCells.push({
      id: `cell_${newRowId}_${c}`,
      content: { type: 'doc', content: [paragraph(`خانہ ${insertIndex + 1},${c + 1}`, 'rtl')] },
      backgroundColor: '#ffffff',
    });
  }

  const updatedRows = [...table.rows];
  updatedRows.splice(insertIndex, 0, { id: newRowId, cells: newCells });

  return {
    ...doc,
    objects: {
      ...doc.objects,
      [tableId]: {
        ...table,
        rows: updatedRows,
        frame: {
          ...table.frame,
          height: updatedRows.length * 32,
        },
      },
    },
  };
}

/**
 * Deletes a row at a specified row index in a TableObject.
 */
export function deleteTableRow(
  doc: RePageDocument,
  tableId: string,
  rowIndex: number = 0,
): RePageDocument {
  const table = doc.objects[tableId];
  if (!table || table.type !== 'table' || table.rows.length <= 1) return doc;

  const updatedRows = table.rows.filter((_, idx) => idx !== rowIndex);

  return {
    ...doc,
    objects: {
      ...doc.objects,
      [tableId]: {
        ...table,
        rows: updatedRows,
        frame: {
          ...table.frame,
          height: updatedRows.length * 32,
        },
      },
    },
  };
}

/**
 * Inserts a column to the left or right of a specified column index in a TableObject.
 */
export function insertTableColumn(
  doc: RePageDocument,
  tableId: string,
  targetColIndex: number = 0,
  position: 'left' | 'right' = 'right',
): RePageDocument {
  const table = doc.objects[tableId];
  if (!table || table.type !== 'table') return doc;

  const insertIndex = position === 'left' ? targetColIndex : targetColIndex + 1;

  const updatedRows = table.rows.map((row, rIdx) => {
    const newCell: TableCell = {
      id: `cell_${rIdx}_${createId('col')}`,
      content: { type: 'doc', content: [paragraph(`خانہ ${rIdx + 1},${insertIndex + 1}`, 'rtl')] },
      backgroundColor: '#ffffff',
    };
    const nextCells = [...row.cells];
    nextCells.splice(insertIndex, 0, newCell);
    return { ...row, cells: nextCells };
  });

  return {
    ...doc,
    objects: {
      ...doc.objects,
      [tableId]: {
        ...table,
        rows: updatedRows,
      },
    },
  };
}

/**
 * Deletes a column at a specified column index in a TableObject.
 */
export function deleteTableColumn(
  doc: RePageDocument,
  tableId: string,
  colIndex: number = 0,
): RePageDocument {
  const table = doc.objects[tableId];
  if (!table || table.type !== 'table') return doc;
  if ((table.rows[0]?.cells.length || 0) <= 1) return doc;

  const updatedRows = table.rows.map((row) => ({
    ...row,
    cells: row.cells.filter((_, idx) => idx !== colIndex),
  }));

  return {
    ...doc,
    objects: {
      ...doc.objects,
      [tableId]: {
        ...table,
        rows: updatedRows,
      },
    },
  };
}

/**
 * Updates properties of a specific cell in a TableObject.
 */
export function updateTableCell(
  doc: RePageDocument,
  tableId: string,
  rowIndex: number,
  colIndex: number,
  updatedProps: Partial<TableCell>,
): RePageDocument {
  const table = doc.objects[tableId];
  if (!table || table.type !== 'table') return doc;
  if (!table.rows[rowIndex] || !table.rows[rowIndex].cells[colIndex]) return doc;

  const updatedRows = table.rows.map((row, rIdx) => {
    if (rIdx !== rowIndex) return row;
    const updatedCells = row.cells.map((cell, cIdx) => {
      if (cIdx !== colIndex) return cell;
      return { ...cell, ...updatedProps };
    });
    return { ...row, cells: updatedCells };
  });

  return {
    ...doc,
    objects: {
      ...doc.objects,
      [tableId]: {
        ...table,
        rows: updatedRows,
      },
    },
  };
}

/**
 * Canonical command for OCR placement.
 * Converts an OCR result into document objects (image frame + text frame + story),
 * optionally persists the source asset, and adds everything to the page immutably.
 * Routes through updateDocument for undo/redo/autosave participation.
 */
export function addOcrResultCommand(
  doc: RePageDocument,
  pageId: PageId,
  ocrResult: OcrPageResult,
  sourceAsset?: AssetReference,
): RePageDocument {
  const page = doc.pages[pageId];
  if (!page) return doc;

  const { imageFrame, textFrame, story } = convertOcrResultToDocumentObjects(ocrResult, pageId);

  const nextAssets = { ...doc.assets };
  if (sourceAsset) {
    nextAssets[sourceAsset.id] = sourceAsset;
  }

  return {
    ...doc,
    objects: {
      ...doc.objects,
      [imageFrame.id]: imageFrame,
      [textFrame.id]: textFrame,
    },
    stories: {
      ...doc.stories,
      [story.id]: story,
    },
    pages: {
      ...doc.pages,
      [pageId]: {
        ...page,
        objectOrder: [...page.objectOrder, imageFrame.id, textFrame.id],
      },
    },
    assets: nextAssets,
  };
}
