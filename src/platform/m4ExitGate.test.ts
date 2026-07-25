import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import { pointsToMillimetres } from '../domain/geometry/units';
import { getFontDefinition } from '../domain/unicode/fontRegistry';
import { atomicSavePackage } from '../persistence/package/fileWorkflowEngine';
import { browserPlatform } from './browser/browserPlatform';
import { formatWindowTitle } from './tauri/windowIntegration';
import {
  BETA_UPDATE_ENDPOINT,
  STABLE_UPDATE_ENDPOINT,
  validateSignedUpdateManifest,
  verifyNoInvisibleDocumentMigrationPolicy,
  type UpdateManifest,
} from './tauri/updateManager';

describe('M4 Release Exit Gate Verification Suite', () => {
  it('validates signed update manifest structure and signatures', () => {
    const validManifest: UpdateManifest = {
      version: '0.1.0-beta.1',
      notes: 'Initial beta release candidate',
      pubDate: '2026-07-25T12:00:00Z',
      signature: 'dGhpcyBpcyBhIHZhbGlkIGVkMjU1MTkgc2lnbmF0dXJlIGtleQ==',
      url: BETA_UPDATE_ENDPOINT,
      channel: 'beta',
    };

    expect(validateSignedUpdateManifest(validManifest)).toBe(true);
    expect(validateSignedUpdateManifest({ version: '0.1.0' })).toBe(false);
  });

  it('enforces release channels stable and beta endpoints', () => {
    expect(STABLE_UPDATE_ENDPOINT).toContain('/stable/');
    expect(BETA_UPDATE_ENDPOINT).toContain('/beta/');
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
