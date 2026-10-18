import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCustomUrduPresets,
  createCustomUrduPreset,
  deleteCustomUrduPreset,
} from './customPresets';

describe('customPresets', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads empty array when no presets stored', () => {
    expect(loadCustomUrduPresets()).toEqual([]);
  });

  it('creates and persists a new custom preset', () => {
    const preset = createCustomUrduPreset(
      'میری تحریر',
      'Noto Nastaliq Urdu',
      15,
      1.7,
      'justify',
      'urdu',
    );

    expect(preset.name).toBe('میری تحریر');
    expect(preset.fontFamily).toBe('Noto Nastaliq Urdu');
    expect(preset.fontSize).toBe(15);
    expect(preset.alignment).toBe('justify');

    const loaded = loadCustomUrduPresets();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.id).toBe(preset.id);
  });

  it('deletes a custom preset by id', () => {
    const p1 = createCustomUrduPreset('Preset 1', 'Noto Nastaliq Urdu', 14, 1.5, 'right', 'urdu');
    const p2 = createCustomUrduPreset('Preset 2', 'Amiri', 18, 1.8, 'center', 'urdu');

    expect(loadCustomUrduPresets()).toHaveLength(2);

    const remaining = deleteCustomUrduPreset(p1.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.id).toBe(p2.id);
    expect(loadCustomUrduPresets()).toHaveLength(1);
  });
});
