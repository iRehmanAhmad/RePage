import type { RePageDocument } from '../../domain/document/types';

export interface HistoryEntry {
  document: RePageDocument;
  description?: string | undefined;
  timestamp: number;
}

export interface TransactionHistoryOptions {
  maxDepth?: number;
}

export class TransactionHistory {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private readonly maxDepth: number;

  constructor(options?: TransactionHistoryOptions) {
    this.maxDepth = options?.maxDepth ?? 50;
  }

  public push(document: RePageDocument, description?: string): void {
    this.undoStack.push({
      document,
      description,
      timestamp: Date.now(),
    });

    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }

    this.redoStack = [];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(currentDocument: RePageDocument): RePageDocument | null {
    if (!this.canUndo()) return null;

    const previousEntry = this.undoStack.pop()!;
    this.redoStack.push({
      document: currentDocument,
      timestamp: Date.now(),
    });

    return previousEntry.document;
  }

  public redo(currentDocument: RePageDocument): RePageDocument | null {
    if (!this.canRedo()) return null;

    const nextEntry = this.redoStack.pop()!;
    this.undoStack.push({
      document: currentDocument,
      timestamp: Date.now(),
    });

    return nextEntry.document;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  public get undoCount(): number {
    return this.undoStack.length;
  }

  public get redoCount(): number {
    return this.redoStack.length;
  }
}
