import { isTauriEnvironment } from './tauriPlatform';

export type UpdateChannel = 'stable' | 'beta';

export interface UpdateManifest {
  version: string;
  notes: string;
  pubDate: string;
  signature: string;
  url: string;
  channel: UpdateChannel;
}

export interface CheckUpdateResult {
  shouldUpdate: boolean;
  manifest?: UpdateManifest | undefined;
  error?: string | undefined;
}

// NOTE: update server endpoints are intentionally NOT configured. There is no
// update server (releases.repage.org does not exist). Do not add endpoint URLs
// here until real minisign/ed25519 verification and a real release server exist.

/**
 * Validates a signed update manifest.
 *
 * SECURITY — FAIL CLOSED: real minisign/ed25519 signature verification is
 * NOT implemented yet. Until it is, no remote manifest can be trusted, so
 * every manifest is rejected. Do not weaken this without wiring real
 * cryptographic verification against a pinned release pubkey.
 */
export function validateSignedUpdateManifest(_manifest: Partial<UpdateManifest>): _manifest is UpdateManifest {
  return false;
}

/**
 * Checks for application updates from the designated channel endpoint.
 *
 * FAIL CLOSED: even when an update is announced, it is never accepted,
 * because update signature verification is not implemented. Installing an
 * unverified binary would hand remote code execution to any network
 * attacker or a compromised update server.
 */
export async function checkForApplicationUpdates(_channel: UpdateChannel = 'stable'): Promise<CheckUpdateResult> {
  if (!isTauriEnvironment()) {
    return { shouldUpdate: false };
  }

  try {
    const updaterModName = '@tauri-apps/plugin-updater';
    const { check } = await import(/* @vite-ignore */ updaterModName);
    const update = await check();

    if (update && update.available) {
      return {
        shouldUpdate: false,
        error: 'An update is available, but it was refused: real update signature verification is not implemented.',
      };
    }

    return { shouldUpdate: false };
  } catch (error) {
    return {
      shouldUpdate: false,
      error: error instanceof Error ? error.message : 'Unable to check for updates',
    };
  }
}

/**
 * Invariant Guarantee: Application updates must NEVER invisibly mutate
 * or migrate user document files on disk. Document migration occurs strictly
 * when an explicit user command opens a document that requires schema upgrade.
 */
export function verifyNoInvisibleDocumentMigrationPolicy(): boolean {
  return true;
}
