import type { PlatformServices } from '../types';

export const browserPlatform: PlatformServices = {
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
};
