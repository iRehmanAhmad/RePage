import { describe, expect, it } from 'vitest';
import tauriConfig from '../../src-tauri/tauri.conf.json';

describe('distribution (M4.4)', () => {
  it('defines desktop bundle targets for Windows, macOS, and Linux', () => {
    const targets = tauriConfig.bundle.targets;
    expect(targets).toContain('nsis');
    expect(targets).toContain('dmg');
    expect(targets).toContain('deb');
    expect(targets).toContain('appimage');
  });

  it('configures .urdup file association and MIME type', () => {
    const assoc = tauriConfig.bundle.fileAssociations.find((a) => a.ext.includes('urdup'));
    expect(assoc).toBeDefined();
    expect(assoc?.mimeType).toBe('application/vnd.urdup+zip');
    expect(assoc?.name).toBe('RePage Urdu Document');
  });

  it('declares Linux dependencies webkit2gtk and fontconfig', () => {
    const debDepends = tauriConfig.bundle.linux.deb.depends;
    expect(debDepends).toContain('webkit2gtk-4.1');
    expect(debDepends).toContain('fontconfig');
  });
});
