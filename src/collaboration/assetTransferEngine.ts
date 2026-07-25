export type AssetTransferStatus = 'available' | 'transferring' | 'missing' | 'failed';

export interface AssetMetadata {
  id: string;
  hash: string;
  mimeType: string;
  size: number;
  width?: number | undefined;
  height?: number | undefined;
}

export interface AssetTransferProgress {
  hash: string;
  bytesTransferred: number;
  totalBytes: number;
  status: AssetTransferStatus;
  chunksCompleted: number;
  totalChunks: number;
  error?: string | undefined;
}

export const MAX_ASSET_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_TRANSFER_RATE_BYTES_PER_SEC = 5 * 1024 * 1024; // 5 MB/s
export const ASSET_CHUNK_SIZE_BYTES = 64 * 1024; // 64 KB

/**
 * Computes SHA-256 hash string for a given ArrayBuffer binary.
 */
export async function computeAssetHash(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback hash for test environments
  let hash = 0;
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    hash = (hash << 5) - hash + (bytes[i] || 0);
    hash |= 0;
  }
  return `sha256-fallback-${Math.abs(hash).toString(16)}`;
}

export class AssetTransferQueue {
  private assetStatuses = new Map<string, AssetTransferProgress>();
  private localBlobStore = new Map<string, ArrayBuffer>();

  public registerAssetMetadata(meta: AssetMetadata): AssetTransferProgress {
    const existing = this.assetStatuses.get(meta.hash);
    if (existing) {
      return existing;
    }

    if (meta.size > MAX_ASSET_SIZE_BYTES) {
      const failedProgress: AssetTransferProgress = {
        hash: meta.hash,
        bytesTransferred: 0,
        totalBytes: meta.size,
        status: 'failed',
        chunksCompleted: 0,
        totalChunks: Math.ceil(meta.size / ASSET_CHUNK_SIZE_BYTES),
        error: `Asset size (${meta.size} bytes) exceeds maximum limit of 50 MB`,
      };
      this.assetStatuses.set(meta.hash, failedProgress);
      return failedProgress;
    }

    const hasLocal = this.localBlobStore.has(meta.hash);
    const progress: AssetTransferProgress = {
      hash: meta.hash,
      bytesTransferred: hasLocal ? meta.size : 0,
      totalBytes: meta.size,
      status: hasLocal ? 'available' : 'missing',
      chunksCompleted: hasLocal ? Math.ceil(meta.size / ASSET_CHUNK_SIZE_BYTES) : 0,
      totalChunks: Math.ceil(meta.size / ASSET_CHUNK_SIZE_BYTES),
    };
    this.assetStatuses.set(meta.hash, progress);
    return progress;
  }

  public storeLocalAsset(hash: string, data: ArrayBuffer): void {
    this.localBlobStore.set(hash, data);
    let progress = this.assetStatuses.get(hash);
    if (!progress) {
      const chunks = Math.ceil(data.byteLength / ASSET_CHUNK_SIZE_BYTES) || 1;
      progress = {
        hash,
        bytesTransferred: data.byteLength,
        totalBytes: data.byteLength,
        status: 'available',
        chunksCompleted: chunks,
        totalChunks: chunks,
      };
      this.assetStatuses.set(hash, progress);
    } else {
      progress.status = 'available';
      progress.bytesTransferred = data.byteLength;
      progress.chunksCompleted = progress.totalChunks;
    }
  }

  public getLocalAsset(hash: string): ArrayBuffer | undefined {
    return this.localBlobStore.get(hash);
  }

  public getAssetProgress(hash: string): AssetTransferProgress | undefined {
    return this.assetStatuses.get(hash);
  }

  public simulateChunkTransfer(hash: string, chunkIndex: number): AssetTransferProgress {
    const progress = this.assetStatuses.get(hash);
    if (!progress) {
      throw new Error(`Asset hash ${hash} is not registered`);
    }

    progress.status = 'transferring';
    progress.chunksCompleted = Math.min(progress.totalChunks, chunkIndex + 1);
    progress.bytesTransferred = Math.min(
      progress.totalBytes,
      progress.chunksCompleted * ASSET_CHUNK_SIZE_BYTES,
    );

    if (progress.chunksCompleted === progress.totalChunks) {
      progress.status = 'available';
    }

    return { ...progress };
  }
}
