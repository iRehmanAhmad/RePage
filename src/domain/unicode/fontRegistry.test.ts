import { describe, expect, it } from 'vitest';
import {
  DEFAULT_URDU_FONT,
  FONT_REGISTRY,
  ensureFontsLoaded,
  getFontDefinition,
  getFontFallbackChain,
} from './fontRegistry';

describe('fontRegistry', () => {
  it('defines Noto Nastaliq Urdu as default font', () => {
    expect(DEFAULT_URDU_FONT.id).toBe('noto-nastaliq-urdu');
    expect(DEFAULT_URDU_FONT.license).toBe('OFL');
    expect(FONT_REGISTRY['noto-nastaliq-urdu']).toBeDefined();
    expect(FONT_REGISTRY['gulzar']).toBeDefined();
  });

  it('retrieves font definitions by ID with default fallback', () => {
    const gulzar = getFontDefinition('gulzar');
    expect(gulzar.name).toBe('Gulzar');
    expect(gulzar.category).toBe('nastaliq');

    const unknown = getFontDefinition('non-existent-font');
    expect(unknown).toEqual(DEFAULT_URDU_FONT);
  });

  it('returns valid fallback chains for supported fonts', () => {
    const chain = getFontFallbackChain('noto-naskh-arabic');
    expect(chain).toContain('Noto Naskh Arabic');
    expect(chain).toContain('sans-serif');
  });

  it('handles font loading check gracefully in mock environment', async () => {
    const loaded = await ensureFontsLoaded(["'Noto Nastaliq Urdu'"]);
    expect(typeof loaded).toBe('boolean');
  });
});
