import JSZip from 'jszip';
import { parseDocument } from '../../domain/document/schema';
import type { UrduPageDocument } from '../../domain/document/types';

const DOCUMENT_ENTRY = 'document.json';
const MANIFEST_ENTRY = 'manifest.json';
const MAX_PACKAGE_BYTES = 100 * 1024 * 1024;
const MAX_ENTRIES = 1_000;

interface PackageManifest {
  format: 'application/vnd.urdup+zip';
  schemaVersion: 1;
  documentId: string;
  createdBy: 'UrduPage';
  createdWithVersion: string;
  modifiedAt: string;
  documentEntry: 'document.json';
  assetCount: number;
}

export async function createUrdupPackage(document: UrduPageDocument): Promise<Uint8Array> {
  const validDocument = parseDocument(document);
  const manifest: PackageManifest = {
    format: 'application/vnd.urdup+zip',
    schemaVersion: 1,
    documentId: validDocument.id,
    createdBy: 'UrduPage',
    createdWithVersion: '0.1.0-foundation',
    modifiedAt: validDocument.metadata.modifiedAt,
    documentEntry: DOCUMENT_ENTRY,
    assetCount: Object.keys(validDocument.assets).length,
  };
  const zip = new JSZip();
  zip.file(MANIFEST_ENTRY, JSON.stringify(manifest, null, 2));
  zip.file(DOCUMENT_ENTRY, JSON.stringify(validDocument, null, 2));

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export async function readUrdupPackage(input: ArrayBuffer | Uint8Array): Promise<UrduPageDocument> {
  if (input.byteLength > MAX_PACKAGE_BYTES) {
    throw new Error('The package exceeds the current 100 MB safety limit.');
  }

  const zip = await JSZip.loadAsync(input);
  const entries = Object.values(zip.files);
  if (entries.length > MAX_ENTRIES) {
    throw new Error('The package contains too many entries.');
  }

  for (const entry of entries) {
    const normalized = entry.name.replaceAll('\\', '/');
    if (
      normalized.startsWith('/') ||
      /^[a-z]:/i.test(normalized) ||
      normalized.split('/').includes('..')
    ) {
      throw new Error(`Unsafe package path: ${entry.name}`);
    }
  }

  const manifestFile = zip.file(MANIFEST_ENTRY);
  const documentFile = zip.file(DOCUMENT_ENTRY);
  if (!manifestFile || !documentFile) {
    throw new Error('Invalid .urdup package: required entries are missing.');
  }

  const manifest = JSON.parse(await manifestFile.async('string')) as Partial<PackageManifest>;
  if (
    manifest.format !== 'application/vnd.urdup+zip' ||
    manifest.schemaVersion !== 1 ||
    manifest.documentEntry !== DOCUMENT_ENTRY
  ) {
    throw new Error('Unsupported or invalid .urdup manifest.');
  }

  const documentJson: unknown = JSON.parse(await documentFile.async('string'));
  return parseDocument(documentJson);
}
