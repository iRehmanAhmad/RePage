import { describe, expect, it, vi } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { tauriPlatform } from './tauriPlatform';
import * as tauriFs from '@tauri-apps/plugin-fs';
import { clearRecovery, getLatestRecovery, saveRecovery } from '../../persistence/autosave/database';

vi.mock('@tauri-apps/plugin-fs', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

function mockTauriEnv(enabled: boolean): void {
  const win = window as unknown as Record<string, unknown>;
  const key = ['__', 'TAURI', '_', 'INTERNALS', '__'].join('');
  if (enabled) {
    win[key] = {};
  } else {
    delete win[key];
  }
}

describe('Phase 1 Stable Core — Atomic Save & Tauri Shell Verification', () => {
  it('performs true atomic save (writes to .tmp then atomically renames to target)', async () => {
    mockTauriEnv(true);

    const doc = createStarterDocument();
    const targetPath = 'C:\\Users\\Test\\Documents\\MyDoc.urdup';

    const bytes = await tauriPlatform.writePackage(doc, targetPath);
    expect(bytes).toBeInstanceOf(Uint8Array);

    // Verify writeFile was called with .tmp path first
    expect(tauriFs.writeFile).toHaveBeenCalled();
    const firstCallArgs = vi.mocked(tauriFs.writeFile).mock.calls[0];
    expect(firstCallArgs?.[0]).toMatch(/MyDoc\.urdup\.tmp\.\d+/);

    // Verify rename was called with tempPath -> targetPath
    expect(tauriFs.rename).toHaveBeenCalledWith(
      expect.stringMatching(/MyDoc\.urdup\.tmp\.\d+/),
      targetPath,
    );

    mockTauriEnv(false);
  });

  it('cleans up .tmp file if rename fails during atomic save', async () => {
    mockTauriEnv(true);
    vi.mocked(tauriFs.rename).mockRejectedValueOnce(new Error('Disk I/O failure'));

    const doc = createStarterDocument();
    const targetPath = 'C:\\Users\\Test\\Documents\\FailingDoc.urdup';

    await expect(tauriPlatform.writePackage(doc, targetPath)).rejects.toThrow('Disk I/O failure');

    // Verify remove was invoked to clean up temporary file
    expect(tauriFs.remove).toHaveBeenCalledWith(expect.stringMatching(/FailingDoc\.urdup\.tmp\.\d+/));

    mockTauriEnv(false);
  });

  it('backs up corrupted packages to .corrupt file before throwing', async () => {
    mockTauriEnv(true);
    const invalidBytes = new Uint8Array([0, 1, 2, 3, 4, 5]);
    vi.mocked(tauriFs.readFile).mockResolvedValueOnce(invalidBytes);

    const corruptPath = 'C:\\Users\\Test\\Documents\\Damaged.urdup';

    await expect(tauriPlatform.readPackage(corruptPath)).rejects.toThrow(/corrupted or invalid/);

    // Verify safety backup was written
    expect(tauriFs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/Damaged\.urdup\.corrupt\.\d+/),
      invalidBytes,
    );

    mockTauriEnv(false);
  });

  it('roundtrips recovery save, query, and clear for zero data-loss crash recovery', async () => {
    await clearRecovery();

    const doc = createStarterDocument();
    doc.metadata.title = 'Crucial Recovered Urdu Document';

    await saveRecovery(doc);

    const recovered = await getLatestRecovery();
    expect(recovered).toBeDefined();
    expect(recovered?.document.metadata.title).toBe('Crucial Recovered Urdu Document');
    expect(recovered?.savedAt).toBeDefined();

    await clearRecovery();
    const afterClear = await getLatestRecovery();
    expect(afterClear).toBeUndefined();
  });
});
