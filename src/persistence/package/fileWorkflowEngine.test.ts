import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { checkFileConflict } from './conflictDetector';
import {
  atomicSavePackage,
  openDocumentWorkflow,
  saveAsDocumentWorkflow,
  saveDocumentWorkflow,
} from './fileWorkflowEngine';
import { addRecentFile, clearRecentFiles, getRecentFiles } from './recentFiles';
import { browserPlatform } from '../../platform/browser/browserPlatform';

describe('fileWorkflowEngine (M4.2)', () => {
  it('manages recent files list with limit and duplicate deduplication', () => {
    clearRecentFiles();
    expect(getRecentFiles()).toHaveLength(0);

    addRecentFile('Doc 1', 'path1.urdup');
    addRecentFile('Doc 2', 'path2.urdup');
    addRecentFile('Doc 1', 'path1.urdup'); // Re-opening Doc 1

    const list = getRecentFiles();
    expect(list).toHaveLength(2);
    expect(list[0]?.title).toBe('Doc 1'); // Most recent first
    clearRecentFiles();
  });

  it('detects external file modification conflicts', () => {
    const lastKnown = 10000;
    expect(checkFileConflict(lastKnown, 10500).hasConflict).toBe(false); // <= 1s difference
    expect(checkFileConflict(lastKnown, 15000).hasConflict).toBe(true); // > 1s difference
  });

  it('atomically generates package bytes without throwing', async () => {
    const doc = createStarterDocument();
    const result = await atomicSavePackage(doc, browserPlatform);
    expect(result.bytes).toBeInstanceOf(Uint8Array);
    expect(result.bytes.length).toBeGreaterThan(0);
  });

  it('handles save and save-as workflows gracefully', async () => {
    const doc = createStarterDocument();
    const initialRef = { filePath: undefined, isDirty: true };

    const savedRef = await saveDocumentWorkflow(doc, initialRef, browserPlatform);
    expect(savedRef.isDirty).toBe(false);
    expect(savedRef.filePath).toBeDefined();

    const saveAsRef = await saveAsDocumentWorkflow(doc, browserPlatform);
    expect(saveAsRef.isDirty).toBe(false);
  });

  it('opens dropped file in open workflow', async () => {
    const doc = createStarterDocument();
    const result = await atomicSavePackage(doc, browserPlatform);
    const buffer = result.bytes.buffer.slice(result.bytes.byteOffset, result.bytes.byteOffset + result.bytes.byteLength) as ArrayBuffer;

    const opened = await openDocumentWorkflow(browserPlatform, buffer);
    expect(opened).not.toBeNull();
    expect(opened?.document.metadata.title).toBe(doc.metadata.title);
    expect(opened?.fileRef.isDirty).toBe(false);
  });
});
