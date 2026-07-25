import { describe, expect, it } from 'vitest';
import { browserPlatform } from './browser/browserPlatform';
import { isTauriEnvironment, tauriPlatform } from './tauri/tauriPlatform';
import { createStarterDocument } from '../domain/document/createDocument';

describe('platformServices (M4.1)', () => {
  it('provides platform services type identifier for browser and tauri', () => {
    expect(browserPlatform.platformType).toBe('browser');
    expect(tauriPlatform.platformType).toBe('tauri');
  });

  it('detects tauri desktop shell environment correctly', () => {
    expect(isTauriEnvironment()).toBe(false); // Running under node/vitest JSDOM
  });

  it('falls back cleanly to browser file package writer in non-tauri environment', async () => {
    const doc = createStarterDocument();
    const bytes = await tauriPlatform.writePackage(doc);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});
