import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { addPage, addRectangle } from '../commands/documentCommands';
import { TransactionHistory } from './transactionHistory';

describe('TransactionHistory', () => {
  it('supports pushing states, undoing, and redoing changes', () => {
    const history = new TransactionHistory();
    let doc = createStarterDocument();
    const initialDoc = doc;

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);

    // Command 1: Add Page
    history.push(doc, 'Before add page');
    doc = addPage(doc, doc.pageOrder[0]!);

    expect(history.canUndo()).toBe(true);
    expect(doc.pageOrder.length).toBe(2);

    // Command 2: Add Rectangle
    history.push(doc, 'Before add rectangle');
    doc = addRectangle(doc, doc.pageOrder[0]!);

    expect(doc.pages[doc.pageOrder[0]!]!.objectOrder.length).toBe(1);

    // Undo Add Rectangle
    const undoneRectangle = history.undo(doc);
    expect(undoneRectangle).not.toBeNull();
    doc = undoneRectangle!;
    expect(doc.pages[doc.pageOrder[0]!]!.objectOrder.length).toBe(0);
    expect(history.canRedo()).toBe(true);

    // Undo Add Page
    const undonePage = history.undo(doc);
    expect(undonePage).not.toBeNull();
    doc = undonePage!;
    expect(doc).toEqual(initialDoc);

    // Redo Add Page
    const redonePage = history.redo(doc);
    expect(redonePage).not.toBeNull();
    doc = redonePage!;
    expect(doc.pageOrder.length).toBe(2);
  });

  it('clears redo stack when pushing a new state after undo', () => {
    const history = new TransactionHistory();
    let doc = createStarterDocument();

    history.push(doc);
    doc = addPage(doc, doc.pageOrder[0]!);

    history.undo(doc);
    expect(history.canRedo()).toBe(true);

    history.push(doc, 'Branch edit');
    expect(history.canRedo()).toBe(false);
  });

  it('respects maximum depth limits', () => {
    const history = new TransactionHistory({ maxDepth: 2 });
    const doc = createStarterDocument();

    history.push(doc, 'State 1');
    history.push(doc, 'State 2');
    history.push(doc, 'State 3');

    expect(history.undoCount).toBe(2);
  });
});
