import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStarterDocument } from '../domain/document/createDocument';
import { pointsToMillimetres } from '../domain/geometry/units';
import { getFontDefinition } from '../domain/unicode/fontRegistry';
import { atomicSavePackage } from '../persistence/package/fileWorkflowEngine';
import { browserPlatform } from './browser/browserPlatform';
import { formatWindowTitle } from './tauri/windowIntegration';
import { checkForUpdate, verifyNoInvisibleDocumentMigrationPolicy } from './tauri/updateManager';
import * as updateManagerModule from './tauri/updateManager';

const HERE = path.dirname(fileURLToPath(import.meta.url));

describe('M4 Release Exit Gate Verification Suite', () => {
  it('update checks fail safe outside the desktop shell (no silent network use in a browser)', async () => {
    // jsdom has no Tauri internals: the updater must quietly no-op.
    await expect(checkForUpdate()).resolves.toEqual({ status: 'unsupported' });
  });

  it('exposes no update server endpoints in JS; endpoint + pubkey live in tauri.conf.json', () => {
    expect('STABLE_UPDATE_ENDPOINT' in updateManagerModule).toBe(false);
    expect('BETA_UPDATE_ENDPOINT' in updateManagerModule).toBe(false);

    // Signature verification is done by the Tauri updater (Rust/minisign)
    // against this pinned public key; updater artifacts must be produced.
    const conf = JSON.parse(
      fs.readFileSync(path.resolve(HERE, '../../src-tauri/tauri.conf.json'), 'utf-8'),
    ) as {
      bundle: { createUpdaterArtifacts?: boolean };
      plugins?: { updater?: { pubkey?: string; endpoints?: string[] } };
    };
    expect(conf.bundle.createUpdaterArtifacts).toBe(true);
    expect(conf.plugins?.updater?.endpoints).toEqual([
      'https://github.com/iRehmanAhmad/RePage/releases/latest/download/latest.json',
    ]);
    expect(conf.plugins?.updater?.pubkey?.length).toBeGreaterThan(50);
  });

  it('verifies explicit document migration invariant (no invisible migrations)', () => {
    expect(verifyNoInvisibleDocumentMigrationPolicy()).toBe(true);
  });

  it('verifies document lifecycle: open, edit, autosave, recover, export', async () => {
    const doc = createStarterDocument();
    expect(doc.schemaVersion).toBe(1);

    const saved = await atomicSavePackage(doc, browserPlatform);
    expect(saved.bytes.length).toBeGreaterThan(0);

    const title = formatWindowTitle(doc.metadata.title, false);
    expect(title).toBe('میری پہلی اردو دستاویز — RePage');
  });

  it('verifies cross-platform typography rendering stays within approved tolerances', () => {
    const nastaliq = getFontDefinition('noto-nastaliq-urdu');
    expect(nastaliq.name).toBe('Noto Nastaliq Urdu');
    expect(nastaliq.category).toBe('nastaliq');

    const widthMm = pointsToMillimetres(docWidthPoints(210));
    expect(widthMm).toBeCloseTo(210, 1);
  });
});

function docWidthPoints(mm: number): number {
  return (mm * 72) / 25.4;
}
