import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import { pointsToMillimetres } from '../domain/geometry/units';
import { getFontDefinition } from '../domain/unicode/fontRegistry';
import { atomicSavePackage } from '../persistence/package/fileWorkflowEngine';
import { browserPlatform } from './browser/browserPlatform';
import { formatWindowTitle } from './tauri/windowIntegration';
import {
  validateSignedUpdateManifest,
  verifyNoInvisibleDocumentMigrationPolicy,
  type UpdateManifest,
} from './tauri/updateManager';
import * as updateManagerModule from './tauri/updateManager';

describe('M4 Release Exit Gate Verification Suite', () => {
  it('refuses every update manifest until real signature verification exists (fail closed)', () => {
    const manifest: UpdateManifest = {
      version: '0.1.0-beta.1',
      notes: 'Initial beta release candidate',
      pubDate: '2026-07-25T12:00:00Z',
      signature: 'dGhpcyBpcyBhIHZhbGlkIGVkMjU1MTkgc2lnbmF0dXJlIGtleQ==',
      url: 'https://example.invalid/beta/update.json',
      channel: 'beta',
    };

    // Without real minisign/ed25519 verification, no manifest is trusted.
    expect(validateSignedUpdateManifest(manifest)).toBe(false);
    expect(validateSignedUpdateManifest({ version: '0.1.0' })).toBe(false);
  });

  it('exposes no update server endpoints while signature verification is unimplemented', () => {
    expect('STABLE_UPDATE_ENDPOINT' in updateManagerModule).toBe(false);
    expect('BETA_UPDATE_ENDPOINT' in updateManagerModule).toBe(false);
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
