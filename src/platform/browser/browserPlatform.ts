import { createUrdupPackage, readUrdupPackage } from '../../persistence/package/urdupPackage';
import type { FileFilter, OpenFileResult, PlatformServices } from '../platformServices';
import type { RePageDocument } from '../../domain/document/types';

export const browserPlatform: PlatformServices & {
  download(bytes: Uint8Array, filename: string, mediaType: string): void;
} = {
  platformType: 'browser',

  download(bytes, filename, mediaType) {
    const copy = new Uint8Array(bytes);
    const blob = new Blob([copy.buffer], { type: mediaType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  async saveFile(bytes, filename, mimeType = 'application/octet-stream') {
    this.download(bytes, filename, mimeType);
    return filename;
  },

  async openFile(filters?: FileFilter[]): Promise<OpenFileResult | null> {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve(null);
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      if (filters?.[0]?.extensions) {
        input.accept = filters[0].extensions.map((ext) => `.${ext}`).join(',');
      }

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const data = await file.arrayBuffer();
        resolve({
          data,
          name: file.name,
        });
      };

      input.click();
    });
  },

  async getSystemFonts(): Promise<string[]> {
    if (typeof document !== 'undefined' && 'queryLocalFonts' in window) {
      try {
        const localFonts = await (window as any).queryLocalFonts();
        return localFonts.map((f: any) => f.family);
      } catch {
        return ['Noto Nastaliq Urdu', 'Gulzar', 'Noto Naskh Arabic', 'serif'];
      }
    }
    return ['Noto Nastaliq Urdu', 'Gulzar', 'Noto Naskh Arabic', 'serif'];
  },

  async readPackage(pathOrBuffer: string | ArrayBuffer): Promise<RePageDocument> {
    if (typeof pathOrBuffer === 'string') {
      throw new Error('Browser platform cannot open direct filesystem paths without user picker.');
    }
    return readUrdupPackage(pathOrBuffer);
  },

  async writePackage(doc: RePageDocument): Promise<Uint8Array> {
    return createUrdupPackage(doc);
  },
};
