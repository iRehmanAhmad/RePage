import { describe, expect, it } from 'vitest';
import { createStarterDocument } from './createDocument';
import { loadVersionHistory, saveVersionSnapshot } from './versionHistoryEngine';

describe('versionHistoryEngine (Phase UX-7)', () => {
  it('saves and loads document version snapshots', () => {
    const doc = createStarterDocument();
    const version = saveVersionSnapshot(doc, 'پہلا ڈرافٹ (First Draft)');

    expect(version.label).toBe('پہلا ڈرافٹ (First Draft)');

    const history = loadVersionHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]?.label).toBe('پہلا ڈرافٹ (First Draft)');
  });
});
