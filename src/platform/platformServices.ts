import type { RePageDocument } from '../domain/document/types';

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface OpenFileResult {
  data: ArrayBuffer;
  name: string;
}

export interface PlatformServices {
  platformType: 'browser' | 'tauri';
  saveFile(
    data: Uint8Array,
    defaultName: string,
    mimeType?: string,
    filters?: FileFilter[],
  ): Promise<string | null>;
  openFile(filters?: FileFilter[]): Promise<OpenFileResult | null>;
  getSystemFonts(): Promise<string[]>;
  readPackage(pathOrBuffer: string | ArrayBuffer): Promise<RePageDocument>;
  writePackage(doc: RePageDocument, path?: string): Promise<Uint8Array>;
}
