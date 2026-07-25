import { describe, expect, it } from 'vitest';
import { announceToScreenReader, getHighDpiBackingScale } from '../ui/common/accessibility';
import { getSystemThemePreference } from '../ui/theme/themeIntegration';
import { copyToClipboard } from './clipboard';
import { triggerNativePrintDialog } from './printService';
import { formatWindowTitle } from './tauri/windowIntegration';

describe('desktopIntegration (M4.3)', () => {
  it('formats window title with document name and dirty marker', () => {
    expect(formatWindowTitle('My Document', false)).toBe('My Document — RePage');
    expect(formatWindowTitle('My Document', true)).toBe('My Document * — RePage');
    expect(formatWindowTitle('', true)).toBe('Untitled RePage Document * — RePage');
  });

  it('detects system theme preference', () => {
    const theme = getSystemThemePreference();
    expect(['dark', 'light']).toContain(theme);
  });

  it('returns valid High-DPI backing scale factor', () => {
    const scale = getHighDpiBackingScale();
    expect(scale).toBeGreaterThanOrEqual(1);
  });

  it('handles clipboard fallback gracefully', async () => {
    const success = await copyToClipboard('Test text');
    expect(typeof success).toBe('boolean');
  });

  it('provides native print dialog trigger', () => {
    const triggered = triggerNativePrintDialog();
    expect(typeof triggered).toBe('boolean');
  });

  it('announces screen reader messages without throwing', () => {
    expect(() => announceToScreenReader('Page 1 selected')).not.toThrow();
  });
});
