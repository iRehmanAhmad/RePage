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
      const dialogModName = '@tauri-apps/plugin-dialog';
      const fsModName = '@tauri-apps/plugin-fs';
      const { save } = await import(/* @vite-ignore */ dialogModName);
      const { writeFile } = await import(/* @vite-ignore */ fsModName);

      const path = await save({
        defaultPath: filename,
        filters: filters?.map((f) => ({ name: f.name, extensions: f.extensions })),
      });

      if (!path) return null;

      await writeFile(path, bytes);
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
      const dialogModName = '@tauri-apps/plugin-dialog';
      const fsModName = '@tauri-apps/plugin-fs';
      const { open } = await import(/* @vite-ignore */ dialogModName);
      const { readFile } = await import(/* @vite-ignore */ fsModName);

      const selected = await open({
        multiple: false,
        filters: filters?.map((f) => ({ name: f.name, extensions: f.extensions })),
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
        const fsModName = '@tauri-apps/plugin-fs';
        const { readFile } = await import(/* @vite-ignore */ fsModName);
        const bytes = await readFile(pathOrBuffer);
        return readUrdupPackage(bytes.buffer);
      }
      throw new Error('Direct filesystem paths are not supported in web browser mode.');
    }
    return readUrdupPackage(pathOrBuffer);
  },

  async writePackage(doc: RePageDocument, path?: string): Promise<Uint8Array> {
    const bytes = await createUrdupPackage(doc);
    if (path && isTauriEnvironment()) {
      const fsModName = '@tauri-apps/plugin-fs';
      const { writeFile } = await import(/* @vite-ignore */ fsModName);
      await writeFile(path, bytes);
    }
    return bytes;
  },
};
