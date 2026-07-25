import { describe, expect, it } from 'vitest';
import {
  createDefaultCustomLayout,
  loadCustomKeyboardLayouts,
  saveCustomKeyboardLayout,
} from './customKeyboardEngine';

describe('customKeyboardEngine (Phase UX-6)', () => {
  it('creates default custom keyboard layout template', () => {
    const layout = createDefaultCustomLayout('Test Phonetic');
    expect(layout.name).toBe('Test Phonetic');
    expect(layout.mappings['a']?.normal).toBe('ا');
  });

  it('saves and loads custom keyboard layouts from storage', () => {
    const layout = createDefaultCustomLayout('Saved Layout');
    saveCustomKeyboardLayout(layout);

    const loaded = loadCustomKeyboardLayouts();
    expect(loaded.length).toBeGreaterThan(0);
    expect(loaded.some((l) => l.name === 'Saved Layout')).toBe(true);
  });
});
