import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, remove, rename, writeFile } from '@tauri-apps/plugin-fs';
import { browserPlatform } from '../browser/browserPlatform';
import type { FileFilter, OpenFileResult, PlatformServices } from '../platformServices';
import type { RePageDocument } from '../../domain/document/types';
import { createUrdupPackage, readUrdupPackage } from '../../persistence/package/urdupPackage';

/**
 * Checks if application is executing inside Tauri desktop shell.
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export const tauriPlatform: PlatformServices = {
  platformType: 'tauri',

  async saveFile(bytes: Uint8Array, filename: string, mimeType?: string, filters?: FileFilter[]): Promise<string | null> {
    if (!isTauriEnvironment()) {
      return browserPlatform.saveFile(bytes, filename, mimeType, filters);
    }

    try {
      const path = await save({
        defaultPath: filename,
        ...(filters ? { filters: filters.map((f) => ({ name: f.name, extensions: f.extensions })) } : {}),
      });

      if (!path) return null;

      // Atomic save: write to temporary file first, then atomically rename to target
      const tempPath = `${path}.tmp.${Date.now()}`;
      try {
        await writeFile(tempPath, bytes);
        await rename(tempPath, path);
      } catch (err) {
        try {
          await remove(tempPath);
        } catch {
          // ignore cleanup failure
        }
        throw err;
      }

      return path;
    } catch {
      return browserPlatform.saveFile(bytes, filename, mimeType, filters);
    }
  },

  async openFile(filters?: FileFilter[]): Promise<OpenFileResult | null> {
    if (!isTauriEnvironment()) {
      return browserPlatform.openFile(filters);
    }

    try {
      const selected = await open({
        multiple: false,
        ...(filters ? { filters: filters.map((f) => ({ name: f.name, extensions: f.extensions })) } : {}),
      });

      if (!selected || typeof selected !== 'string') return null;

      const bytes = await readFile(selected);
      const filename = selected.split(/[\\/]/).pop() || 'opened_file.urdup';

      return {
        data: bytes.buffer,
        name: filename,
      };
    } catch {
      return browserPlatform.openFile(filters);
    }
  },

  async getSystemFonts(): Promise<string[]> {
    return browserPlatform.getSystemFonts();
  },

  async readPackage(pathOrBuffer: string | ArrayBuffer): Promise<RePageDocument> {
    if (typeof pathOrBuffer === 'string') {
      if (isTauriEnvironment()) {
        const bytes = await readFile(pathOrBuffer);
        try {
          return await readUrdupPackage(bytes.buffer);
        } catch (err) {
          // Corrupt package safety backup
          const backupPath = `${pathOrBuffer}.corrupt.${Date.now()}`;
          try {
            await writeFile(backupPath, bytes);
          } catch {
            // ignore backup failure
          }
          throw new Error(
            `Failed to open "${pathOrBuffer}": The file appears corrupted or invalid. A safety backup has been created at "${backupPath}". Original error: ${(err as Error).message}`,
            { cause: err },
          );
        }
      }
      throw new Error('Direct filesystem paths are not supported in web browser mode.');
    }
    return readUrdupPackage(pathOrBuffer);
  },

  async writePackage(doc: RePageDocument, path?: string): Promise<Uint8Array> {
    const bytes = await createUrdupPackage(doc);
    if (path && isTauriEnvironment()) {
      // Atomic save: write to temporary file first, then atomically rename
      const tempPath = `${path}.tmp.${Date.now()}`;
      try {
        await writeFile(tempPath, bytes);
        await rename(tempPath, path);
      } catch (err) {
        try {
          await remove(tempPath);
        } catch {
          // ignore cleanup failure
        }
        throw err;
      }
    }
    return bytes;
  },
};
