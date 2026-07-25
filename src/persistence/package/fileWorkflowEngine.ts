import type { RePageDocument } from '../../domain/document/types';
import type { PlatformServices } from '../../platform/platformServices';
import { createUrdupPackage, readUrdupPackage } from './urdupPackage';
import { addRecentFile } from './recentFiles';

export interface DocumentFileRef {
  filePath?: string | undefined;
  lastModifiedMs?: number | undefined;
  isDirty: boolean;
}

export interface OpenWorkflowResult {
  document: RePageDocument;
  fileRef: DocumentFileRef;
}

/**
 * Performs atomic save writing to a temporary buffer before saving to target path.
 */
export async function atomicSavePackage(
  doc: RePageDocument,
  platform: PlatformServices,
  targetPath?: string,
): Promise<{ bytes: Uint8Array; savedPath?: string }> {
  // Generate package buffer atomically
  const bytes = await createUrdupPackage(doc);

  if (targetPath && platform.platformType === 'tauri') {
    const savedPath = await platform.writePackage(doc, targetPath);
    return { bytes: savedPath, savedPath: targetPath };
  }

  return { bytes };
}

export async function openDocumentWorkflow(
  platform: PlatformServices,
  inputData?: ArrayBuffer | File,
): Promise<OpenWorkflowResult | null> {
  let buffer: ArrayBuffer;
  let filename = 'document.urdup';

  if (inputData instanceof File) {
    buffer = await inputData.arrayBuffer();
    filename = inputData.name;
  } else if (inputData instanceof ArrayBuffer) {
    buffer = inputData;
  } else {
    const opened = await platform.openFile([
      { name: 'RePage Document', extensions: ['urdup'] },
    ]);
    if (!opened) return null;
    buffer = opened.data;
    filename = opened.name;
  }

  const document = await readUrdupPackage(buffer);
  addRecentFile(document.metadata.title, filename);

  return {
    document,
    fileRef: {
      filePath: filename,
      lastModifiedMs: Date.now(),
      isDirty: false,
    },
  };
}

export async function saveDocumentWorkflow(
  doc: RePageDocument,
  fileRef: DocumentFileRef,
  platform: PlatformServices,
): Promise<DocumentFileRef> {
  if (fileRef.filePath && platform.platformType === 'tauri') {
    await atomicSavePackage(doc, platform, fileRef.filePath);
    return {
      ...fileRef,
      lastModifiedMs: Date.now(),
      isDirty: false,
    };
  }

  // Fallback to Save As prompt / browser download
  return saveAsDocumentWorkflow(doc, platform);
}

export async function saveAsDocumentWorkflow(
  doc: RePageDocument,
  platform: PlatformServices,
): Promise<DocumentFileRef> {
  const bytes = await createUrdupPackage(doc);
  const defaultName = `${doc.metadata.title || 'RePage-Document'}.urdup`;

  const savedPath = await platform.saveFile(
    bytes,
    defaultName,
    'application/vnd.urdup+zip',
    [{ name: 'RePage Document', extensions: ['urdup'] }],
  );

  const pathName = savedPath || defaultName;
  addRecentFile(doc.metadata.title, pathName);

  return {
    filePath: pathName,
    lastModifiedMs: Date.now(),
    isDirty: false,
  };
}
