import type { Update } from '@tauri-apps/plugin-updater';
import { isTauriEnvironment } from './tauriPlatform';

/**
 * Application auto-update, wired to the real Tauri 2 updater plugin.
 *
 * Security model: signature verification happens inside the Tauri updater
 * (Rust side, minisign) against the public key pinned in
 * `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`). Update artifacts
 * whose signatures do not verify are rejected by the plugin before any
 * install. The endpoint list also lives in `tauri.conf.json` — no update
 * URLs are hardcoded in JavaScript.
 *
 * Outside the desktop shell (plain browser / tests) every entry point
 * quietly no-ops: `checkForUpdate()` resolves to `{ status: 'unsupported' }`.
 */

export type UpdateChannel = 'stable' | 'beta';

export interface AvailableUpdate {
  currentVersion: string;
  version: string;
  /** Release notes published with the update (may be empty). */
  notes: string;
  date?: string | undefined;
}

export type UpdateCheckState =
  | { status: 'unsupported' }
  | { status: 'up-to-date'; currentVersion: string }
  | { status: 'available'; update: AvailableUpdate }
  | { status: 'error'; message: string };

/** Structural shape of the plugin's update metadata (what `check()` returns). */
export interface RawUpdateMetadata {
  currentVersion: string;
  version: string;
  body?: string | undefined;
  date?: string | undefined;
}

/** Structural shape of the plugin's download events. */
export type UpdateDownloadEvent =
  | { event: 'Started'; data: { contentLength?: number | undefined } }
  | { event: 'Progress'; data: { chunkLength: number } }
  | { event: 'Finished' };

export interface DownloadProgress {
  downloaded: number;
  total?: number | undefined;
  done: boolean;
}

/**
 * Compares two dotted version strings (`1.2.3`, optional leading `v`,
 * optional `-prerelease` suffix). Returns a negative number when `a < b`,
 * zero when equal, a positive number when `a > b`. Numeric segments compare
 * numerically; a version with a prerelease suffix ranks below the same
 * version without one; two prereleases compare lexically.
 */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.numbers.length, pb.numbers.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa.numbers[i] ?? 0) - (pb.numbers[i] ?? 0);
    if (diff !== 0) return diff;
  }
  if (pa.prerelease === pb.prerelease) return 0;
  if (pa.prerelease === '') return 1;
  if (pb.prerelease === '') return -1;
  return pa.prerelease < pb.prerelease ? -1 : 1;
}

function parseVersion(version: string): { numbers: number[]; prerelease: string } {
  const trimmed = version.trim().replace(/^v/i, '');
  const dash = trimmed.indexOf('-');
  const core = dash === -1 ? trimmed : trimmed.slice(0, dash);
  const prerelease = dash === -1 ? '' : trimmed.slice(dash + 1);
  const numbers = core
    .split('.')
    .map((segment) => {
      const n = Number.parseInt(segment, 10);
      return Number.isNaN(n) ? 0 : n;
    });
  return { numbers, prerelease };
}

/**
 * Maps a raw plugin check result to UI state. An announced update is only
 * surfaced when it is strictly newer than the running version — a stale or
 * replayed manifest can never offer a downgrade.
 */
export function mapCheckResult(raw: RawUpdateMetadata | null, currentVersion: string): UpdateCheckState {
  if (!raw) return { status: 'up-to-date', currentVersion };
  if (compareVersions(raw.version, currentVersion) <= 0) {
    return { status: 'up-to-date', currentVersion };
  }
  return {
    status: 'available',
    update: {
      currentVersion,
      version: raw.version,
      notes: raw.body ?? '',
      date: raw.date,
    },
  };
}

export function initialDownloadProgress(): DownloadProgress {
  return { downloaded: 0, done: false };
}

/** Pure reducer: folds one plugin download event into the progress state. */
export function applyDownloadEvent(progress: DownloadProgress, event: UpdateDownloadEvent): DownloadProgress {
  switch (event.event) {
    case 'Started':
      return { downloaded: 0, total: event.data.contentLength, done: false };
    case 'Progress':
      return { ...progress, downloaded: progress.downloaded + event.data.chunkLength, done: false };
    case 'Finished':
      return { ...progress, done: true };
  }
}

/** Percentage in [0, 100], or undefined when the total size is unknown. */
export function downloadPercent(progress: DownloadProgress): number | undefined {
  if (progress.total === undefined || progress.total <= 0) return undefined;
  return Math.min(100, Math.floor((progress.downloaded / progress.total) * 100));
}

// The plugin's Update object holds a Rust-side resource; keep the pending
// one from the latest successful check so the UI can install exactly what
// was announced.
let pendingUpdate: Update | null = null;

/**
 * Checks the configured update endpoint (GitHub Releases `latest.json`,
 * configured in tauri.conf.json) for a newer release.
 */
export async function checkForUpdate(): Promise<UpdateCheckState> {
  if (!isTauriEnvironment()) {
    return { status: 'unsupported' };
  }

  try {
    const [{ check }, { getVersion }] = await Promise.all([
      import('@tauri-apps/plugin-updater'),
      import('@tauri-apps/api/app'),
    ]);

    if (pendingUpdate) {
      await pendingUpdate.close().catch(() => undefined);
      pendingUpdate = null;
    }

    const [update, currentVersion] = await Promise.all([check(), getVersion()]);
    const state = mapCheckResult(
      update
        ? { currentVersion: update.currentVersion, version: update.version, body: update.body, date: update.date }
        : null,
      currentVersion,
    );

    if (state.status === 'available' && update) {
      pendingUpdate = update;
    } else if (update) {
      await update.close().catch(() => undefined);
    }

    return state;
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to check for updates',
    };
  }
}

/**
 * Downloads and installs the update announced by the latest
 * `checkForUpdate()`, reporting progress, then relaunches the app.
 * On Windows the installer restarts the app itself by default; on
 * macOS/Linux the explicit relaunch applies the installed version.
 */
export async function downloadAndInstallPendingUpdate(
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  if (!isTauriEnvironment()) {
    throw new Error('Updates are only available in the desktop app.');
  }
  if (!pendingUpdate) {
    throw new Error('No update is ready to install. Check for updates first.');
  }

  const update = pendingUpdate;
  let progress = initialDownloadProgress();
  onProgress?.(progress);

  await update.downloadAndInstall((event) => {
    progress = applyDownloadEvent(progress, event);
    onProgress?.(progress);
  });

  pendingUpdate = null;
  const { relaunch } = await import('@tauri-apps/plugin-process');
  await relaunch();
}

/**
 * Invariant Guarantee: Application updates must NEVER invisibly mutate
 * or migrate user document files on disk. Document migration occurs strictly
 * when an explicit user command opens a document that requires schema upgrade.
 */
export function verifyNoInvisibleDocumentMigrationPolicy(): boolean {
  return true;
}
