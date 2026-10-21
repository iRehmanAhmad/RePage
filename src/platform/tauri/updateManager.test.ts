import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  relaunch: vi.fn(),
  getVersion: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-updater', () => ({ check: mocks.check }));
vi.mock('@tauri-apps/plugin-process', () => ({ relaunch: mocks.relaunch }));
vi.mock('@tauri-apps/api/app', () => ({ getVersion: mocks.getVersion }));

import {
  applyDownloadEvent,
  compareVersions,
  downloadPercent,
  initialDownloadProgress,
  mapCheckResult,
  type UpdateDownloadEvent,
} from './updateManager';

async function loadManager() {
  return import('./updateManager');
}

function setTauri(on: boolean) {
  const w = window as unknown as Record<string, unknown>;
  if (on) {
    w['__TAURI_INTERNALS__'] = {};
  } else {
    delete w['__TAURI_INTERNALS__'];
  }
}

function fakeUpdate(overrides: Record<string, unknown> = {}) {
  return {
    currentVersion: '0.2.0',
    version: '0.3.0',
    body: 'Bug fixes and improvements',
    date: '2026-10-21T00:00:00Z',
    downloadAndInstall: vi.fn(async (cb?: (e: UpdateDownloadEvent) => void) => {
      cb?.({ event: 'Started', data: { contentLength: 200 } });
      cb?.({ event: 'Progress', data: { chunkLength: 50 } });
      cb?.({ event: 'Progress', data: { chunkLength: 150 } });
      cb?.({ event: 'Finished' });
    }),
    close: vi.fn(async () => undefined),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetModules();
  mocks.check.mockReset();
  mocks.relaunch.mockReset();
  mocks.getVersion.mockReset();
  mocks.getVersion.mockResolvedValue('0.2.0');
  setTauri(false);
});

afterEach(() => {
  setTauri(false);
});

describe('compareVersions', () => {
  it('compares dotted versions numerically', () => {
    expect(compareVersions('0.2.0', '0.2.0')).toBe(0);
    expect(compareVersions('0.3.0', '0.2.0')).toBeGreaterThan(0);
    expect(compareVersions('0.1.9', '0.2.0')).toBeLessThan(0);
    expect(compareVersions('0.10.0', '0.9.0')).toBeGreaterThan(0);
    expect(compareVersions('2', '2.0.0')).toBe(0);
  });

  it('tolerates a leading v and ranks prereleases below releases', () => {
    expect(compareVersions('v1.0.0', '0.9.9')).toBeGreaterThan(0);
    expect(compareVersions('1.0.0-alpha', '1.0.0')).toBeLessThan(0);
    expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
    expect(compareVersions('1.0.0-rc.1', '1.0.0-rc.1')).toBe(0);
  });
});

describe('mapCheckResult', () => {
  it('maps no result to up-to-date', () => {
    expect(mapCheckResult(null, '0.2.0')).toEqual({ status: 'up-to-date', currentVersion: '0.2.0' });
  });

  it('maps a strictly newer version to available, carrying notes', () => {
    const state = mapCheckResult(
      { currentVersion: '0.2.0', version: '0.3.0', body: 'Notes', date: '2026-10-21T00:00:00Z' },
      '0.2.0',
    );
    expect(state).toEqual({
      status: 'available',
      update: { currentVersion: '0.2.0', version: '0.3.0', notes: 'Notes', date: '2026-10-21T00:00:00Z' },
    });
  });

  it('never offers an equal or older version (no downgrades)', () => {
    expect(mapCheckResult({ currentVersion: '0.2.0', version: '0.2.0' }, '0.2.0').status).toBe('up-to-date');
    expect(mapCheckResult({ currentVersion: '0.2.0', version: '0.1.0' }, '0.2.0').status).toBe('up-to-date');
  });
});

describe('download progress mapping', () => {
  it('folds Started/Progress/Finished events into percent progress', () => {
    let p = initialDownloadProgress();
    expect(downloadPercent(p)).toBeUndefined();
    p = applyDownloadEvent(p, { event: 'Started', data: { contentLength: 200 } });
    expect(downloadPercent(p)).toBe(0);
    p = applyDownloadEvent(p, { event: 'Progress', data: { chunkLength: 50 } });
    expect(downloadPercent(p)).toBe(25);
    p = applyDownloadEvent(p, { event: 'Progress', data: { chunkLength: 150 } });
    expect(downloadPercent(p)).toBe(100);
    p = applyDownloadEvent(p, { event: 'Finished' });
    expect(p.done).toBe(true);
  });

  it('keeps percent unknown when the server sends no content length', () => {
    let p = initialDownloadProgress();
    p = applyDownloadEvent(p, { event: 'Started', data: {} });
    p = applyDownloadEvent(p, { event: 'Progress', data: { chunkLength: 10 } });
    expect(downloadPercent(p)).toBeUndefined();
    expect(p.downloaded).toBe(10);
  });
});

describe('browser environment', () => {
  it('checkForUpdate quietly reports unsupported outside the desktop shell', async () => {
    const { checkForUpdate } = await loadManager();
    await expect(checkForUpdate()).resolves.toEqual({ status: 'unsupported' });
    expect(mocks.check).not.toHaveBeenCalled();
  });

  it('install refuses outside the desktop shell', async () => {
    const { downloadAndInstallPendingUpdate } = await loadManager();
    await expect(downloadAndInstallPendingUpdate()).rejects.toThrow('desktop app');
    expect(mocks.relaunch).not.toHaveBeenCalled();
  });
});

describe('Tauri environment (plugin mocked)', () => {
  it('surfaces an available update and installs it with progress + relaunch', async () => {
    setTauri(true);
    const update = fakeUpdate();
    mocks.check.mockResolvedValue(update);
    const { checkForUpdate, downloadAndInstallPendingUpdate } = await loadManager();

    const state = await checkForUpdate();
    expect(state.status).toBe('available');
    if (state.status === 'available') {
      expect(state.update.version).toBe('0.3.0');
      expect(state.update.currentVersion).toBe('0.2.0');
      expect(state.update.notes).toBe('Bug fixes and improvements');
    }

    const percents: Array<number | undefined> = [];
    await downloadAndInstallPendingUpdate((p) => percents.push(downloadPercent(p)));
    expect(update.downloadAndInstall).toHaveBeenCalledTimes(1);
    expect(percents).toContain(25);
    expect(percents).toContain(100);
    expect(mocks.relaunch).toHaveBeenCalledTimes(1);

    // The pending update is consumed: a second install attempt refuses.
    await expect(downloadAndInstallPendingUpdate()).rejects.toThrow('Check for updates first');
  });

  it('reports up-to-date and closes the handle when the plugin finds nothing newer', async () => {
    setTauri(true);
    mocks.check.mockResolvedValue(null);
    const { checkForUpdate } = await loadManager();
    await expect(checkForUpdate()).resolves.toEqual({ status: 'up-to-date', currentVersion: '0.2.0' });
  });

  it('refuses a downgrade announcement and closes the handle', async () => {
    setTauri(true);
    const stale = fakeUpdate({ version: '0.1.0' });
    mocks.check.mockResolvedValue(stale);
    const { checkForUpdate } = await loadManager();
    const state = await checkForUpdate();
    expect(state.status).toBe('up-to-date');
    expect(stale.close).toHaveBeenCalledTimes(1);
  });

  it('maps a plugin failure to an honest error state', async () => {
    setTauri(true);
    mocks.check.mockRejectedValue(new Error('network unreachable'));
    const { checkForUpdate } = await loadManager();
    await expect(checkForUpdate()).resolves.toEqual({ status: 'error', message: 'network unreachable' });
  });
});
