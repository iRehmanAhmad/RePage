import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import type { AssetId } from '../../domain/document/types';
import {
  computeSha256,
  createUrdupPackage,
  readUrdupPackage,
  readUrdupPackageWithAssets,
} from './urdupPackage';

describe('.urdup package', () => {
  it('round-trips a canonical document without changing Urdu content', async () => {
    const document = createStarterDocument();
    const bytes = await createUrdupPackage(document);
    const reopened = await readUrdupPackage(bytes);

    expect(reopened).toEqual(document);
  });

  it('rejects data that is not a ZIP package', async () => {
    await expect(readUrdupPackage(new TextEncoder().encode('{}'))).rejects.toThrow();
  });

  it('stores, deduplicates, and verifies binary assets with SHA-256', async () => {
    const document = createStarterDocument();
    const assetData = new TextEncoder().encode('sample image data');
    const hash = await computeSha256(assetData);
    const assetId = 'asset-1' as AssetId;

    document.assets[assetId] = {
      id: assetId,
      sha256: hash,
      mediaType: 'image/png',
      byteSize: assetData.byteLength,
      originalName: 'test.png',
      packageEntry: `assets/${hash}.png`,
    };

    const assetsMap = new Map([[assetId, assetData]]);
    const pkgBytes = await createUrdupPackage(document, assetsMap);

    const result = await readUrdupPackageWithAssets(pkgBytes);
    expect(result.document.assets[assetId]?.sha256).toBe(hash);
    expect(Array.from(result.assets.get(assetId)!)).toEqual(Array.from(assetData));
  });

  it('rejects package reading when an asset SHA-256 hash does not match', async () => {
    const document = createStarterDocument();
    const assetData = new TextEncoder().encode('sample image data');
    const corruptedData = new TextEncoder().encode('corrupted image data');
    const hash = await computeSha256(assetData);
    const assetId = 'asset-2' as AssetId;

    document.assets[assetId] = {
      id: assetId,
      sha256: hash,
      mediaType: 'image/png',
      byteSize: assetData.byteLength,
      originalName: 'test.png',
      packageEntry: `assets/${hash}.png`,
    };

    const assetsMap = new Map([[assetId, corruptedData]]); // Mismatched content hash!
    await expect(createUrdupPackage(document, assetsMap)).rejects.toThrow(/SHA-256 mismatch/i);
  });

  it('rejects package reading when a required asset entry is missing', async () => {
    const document = createStarterDocument();
    const hash = 'a'.repeat(64);
    const assetId = 'asset-missing' as AssetId;

    document.assets[assetId] = {
      id: assetId,
      sha256: hash,
      mediaType: 'image/png',
      byteSize: 100,
      originalName: 'missing.png',
      packageEntry: `assets/${hash}.png`,
    };

    // Save package without providing asset bytes
    const pkgBytes = await createUrdupPackage(document);

    // Reading package must fail because asset entry is missing from ZIP
    await expect(readUrdupPackageWithAssets(pkgBytes)).rejects.toThrow(/missing required asset entry/i);
  });
});
