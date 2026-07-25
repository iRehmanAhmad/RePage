import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ACCESSIBILITY_SETTINGS,
  loadAccessibilitySettings,
  saveAccessibilitySettings,
} from './accessibilitySettings';

describe('accessibilitySettings (Phase UX-8)', () => {
  it('saves and loads accessibility settings from storage', () => {
    const settings = {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      uiScale: 150,
      isTouchMode: true,
    };

    saveAccessibilitySettings(settings);
    const loaded = loadAccessibilitySettings();

    expect(loaded.uiScale).toBe(150);
    expect(loaded.isTouchMode).toBe(true);
  });
});
