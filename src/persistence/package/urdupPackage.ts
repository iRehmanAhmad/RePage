import JSZip from 'jszip';
import { parseDocument } from '../../domain/document/schema';
import type { UrduPageDocument } from '../../domain/document/types';

const DOCUMENT_ENTRY = 'document.json';
const MANIFEST_ENTRY = 'manifest.json';
const MAX_PACKAGE_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_SINGLE_ASSET_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_ENTRIES = 1_000;
const MAX_COMPRESSION_RATIO = 10; // Max 10x uncompressed vs compressed ratio

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

export interface ReadPackageResult {
  document: UrduPageDocument;
  assets: Map<string, Uint8Array>;
}

export async function computeSha256(data: Uint8Array): Promise<string> {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', copy);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createUrdupPackage(
  document: UrduPageDocument,
  assetsData?: Map<string, Uint8Array> | Record<string, Uint8Array>,
): Promise<Uint8Array> {
  const validDocument = parseDocument(document);
  const zip = new JSZip();

  const assetEntries = assetsData instanceof Map
    ? Array.from(assetsData.entries())
    : assetsData
      ? Object.entries(assetsData)
      : [];

  const assetDataMap = new Map(assetEntries);

  for (const [assetId, assetRef] of Object.entries(validDocument.assets)) {
    const rawData = assetDataMap.get(assetId) ?? assetDataMap.get(assetRef.packageEntry);
    if (rawData) {
      if (rawData.byteLength > MAX_SINGLE_ASSET_BYTES) {
        throw new Error(`Asset ${assetRef.originalName} exceeds max asset size of 50MB.`);
      }
      const actualHash = await computeSha256(rawData);
      if (assetRef.sha256 && actualHash !== assetRef.sha256) {
        throw new Error(
          `Asset ${assetRef.originalName} SHA-256 mismatch (expected ${assetRef.sha256}, got ${actualHash}).`
        );
      }
      zip.file(assetRef.packageEntry, rawData);
    }
  }

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

  zip.file(MANIFEST_ENTRY, JSON.stringify(manifest, null, 2));
  zip.file(DOCUMENT_ENTRY, JSON.stringify(validDocument, null, 2));

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export async function readUrdupPackage(input: ArrayBuffer | Uint8Array): Promise<UrduPageDocument> {
  const result = await readUrdupPackageWithAssets(input);
  return result.document;
}

export async function readUrdupPackageWithAssets(
  input: ArrayBuffer | Uint8Array,
): Promise<ReadPackageResult> {
  const byteLength = input.byteLength;
  if (byteLength > MAX_PACKAGE_BYTES) {
    throw new Error('The package exceeds the current 100 MB safety limit.');
  }

  const zip = await JSZip.loadAsync(input);
  const entries = Object.values(zip.files);
  if (entries.length > MAX_ENTRIES) {
    throw new Error('The package contains too many entries.');
  }

  let totalUncompressedSize = 0;

  for (const entry of entries) {
    const normalized = entry.name.replaceAll('\\', '/');
    if (
      normalized.startsWith('/') ||
      /^[a-z]:/i.test(normalized) ||
      normalized.split('/').includes('..')
    ) {
      throw new Error(`Unsafe package path: ${entry.name}`);
    }

    // Protection against zip bomb attacks (compression ratio check)
    const entryRecord = entry as unknown as Record<string, Record<string, number> | undefined>;
    const dataObj = entryRecord['_data'];
    const uncompressed = dataObj?.['uncompressedSize'] ?? 0;
    totalUncompressedSize += uncompressed;
  }

  if (byteLength > 0 && totalUncompressedSize / byteLength > MAX_COMPRESSION_RATIO) {
    throw new Error('Package expansion ratio exceeds safety limit (possible ZIP bomb).');
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
  const document = parseDocument(documentJson);
  const assetsMap = new Map<string, Uint8Array>();

  for (const [assetId, assetRef] of Object.entries(document.assets)) {
    const assetFile = zip.file(assetRef.packageEntry);
    if (!assetFile) {
      throw new Error(`Package is missing required asset entry: ${assetRef.packageEntry}`);
    }
    const assetBytes = await assetFile.async('uint8array');
    if (assetBytes.byteLength > MAX_SINGLE_ASSET_BYTES) {
      throw new Error(`Asset ${assetRef.originalName} exceeds size limit of 50MB.`);
    }
    const actualHash = await computeSha256(assetBytes);
    if (assetRef.sha256 && actualHash !== assetRef.sha256) {
      throw new Error(
        `Asset ${assetRef.originalName} failed SHA-256 integrity check (expected ${assetRef.sha256}, got ${actualHash}).`
      );
    }
    assetsMap.set(assetId, assetBytes);
  }

  return { document, assets: assetsMap };
}
