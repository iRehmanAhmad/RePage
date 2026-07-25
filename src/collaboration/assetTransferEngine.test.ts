import { describe, expect, it } from 'vitest';
import {
  AssetTransferQueue,
  MAX_ASSET_SIZE_BYTES,
  computeAssetHash,
} from './assetTransferEngine';

describe('assetTransferEngine (M5.3)', () => {
  it('computes content-addressed SHA-256 hash for binary buffer', async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode('RePage Urdu Image Binary Payload');
    const hash = await computeAssetHash(data.buffer);

    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');
  });

  it('rejects assets exceeding 50 MB size limit', () => {
    const queue = new AssetTransferQueue();
    const oversizedMeta = {
      id: 'asset-1',
      hash: 'sha256-oversized',
      mimeType: 'image/png',
      size: MAX_ASSET_SIZE_BYTES + 1000,
    };

    const progress = queue.registerAssetMetadata(oversizedMeta);
    expect(progress.status).toBe('failed');
    expect(progress.error).toContain('exceeds maximum limit of 50 MB');
  });

  it('tracks missing-asset status and simulates resumable chunk transfer', () => {
    const queue = new AssetTransferQueue();
    const meta = {
      id: 'asset-2',
      hash: 'sha256-valid-image',
      mimeType: 'image/jpeg',
      size: 128 * 1024, // 128 KB -> 2 chunks of 64 KB
    };

    const initial = queue.registerAssetMetadata(meta);
    expect(initial.status).toBe('missing');
    expect(initial.totalChunks).toBe(2);

    const chunk1 = queue.simulateChunkTransfer(meta.hash, 0);
    expect(chunk1.status).toBe('transferring');
    expect(chunk1.chunksCompleted).toBe(1);

    const chunk2 = queue.simulateChunkTransfer(meta.hash, 1);
    expect(chunk2.status).toBe('available');
    expect(chunk2.chunksCompleted).toBe(2);
  });

  it('stores and retrieves binary data outside Yjs maps', () => {
    const queue = new AssetTransferQueue();
    const hash = 'sha256-local-asset';
    const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;

    queue.storeLocalAsset(hash, buffer);
    expect(queue.getLocalAsset(hash)).toBe(buffer);
    expect(queue.getAssetProgress(hash)?.status).toBe('available');
  });
});
