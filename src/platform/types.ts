export interface PlatformServices {
  download(bytes: Uint8Array, filename: string, mediaType: string): void;
}
