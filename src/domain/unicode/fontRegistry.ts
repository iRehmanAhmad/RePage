export type FontCategory = 'nastaliq' | 'naskh' | 'sans-serif' | 'serif';

export interface FontDefinition {
  id: string;
  name: string;
  family: string;
  category: FontCategory;
  license: 'OFL' | 'System' | 'Proprietary';
  isBundled: boolean;
  upstreamUrl?: string;
  fallbackChain: string[];
}

const NOTO_NASTALIQ: FontDefinition = {
  id: 'noto-nastaliq-urdu',
  name: 'Noto Nastaliq Urdu',
  family: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaliq', 'Urdu Typesetting', serif",
  category: 'nastaliq',
  license: 'OFL',
  isBundled: true,
  upstreamUrl: 'https://fonts.google.com/specimen/Noto+Nastaliq+Urdu',
  fallbackChain: ['Jameel Noori Nastaliq', 'Urdu Typesetting', 'serif'],
};

export const FONT_REGISTRY: Record<string, FontDefinition> = {
  'noto-nastaliq-urdu': NOTO_NASTALIQ,
  'gulzar': {
    id: 'gulzar',
    name: 'Gulzar',
    family: "'Gulzar', 'Noto Nastaliq Urdu', serif",
    category: 'nastaliq',
    license: 'OFL',
    isBundled: true,
    upstreamUrl: 'https://fonts.google.com/specimen/Gulzar',
    fallbackChain: ['Noto Nastaliq Urdu', 'serif'],
  },
  'noto-naskh-arabic': {
    id: 'noto-naskh-arabic',
    name: 'Noto Naskh Arabic',
    family: "'Noto Naskh Arabic', 'Traditional Arabic', sans-serif",
    category: 'naskh',
    license: 'OFL',
    isBundled: true,
    upstreamUrl: 'https://fonts.google.com/specimen/Noto+Naskh+Arabic',
    fallbackChain: ['Traditional Arabic', 'sans-serif'],
  },
  'system-sans': {
    id: 'system-sans',
    name: 'System Sans-Serif',
    family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    category: 'sans-serif',
    license: 'System',
    isBundled: false,
    fallbackChain: ['sans-serif'],
  },
};

export const DEFAULT_URDU_FONT: FontDefinition = NOTO_NASTALIQ;

export function getFontDefinition(fontId: string): FontDefinition {
  return FONT_REGISTRY[fontId] ?? DEFAULT_URDU_FONT;
}

export function getFontFallbackChain(fontId: string): string[] {
  const font = getFontDefinition(fontId);
  return [font.name, ...font.fallbackChain];
}

export async function ensureFontsLoaded(fontFamilies: string[], timeoutMs = 3000): Promise<boolean> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return true;
  }

  try {
    const loadPromises = fontFamilies.map(async (family) => {
      await document.fonts.load(`16px ${family}`);
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Font load timeout')), timeoutMs)
    );

    await Promise.race([Promise.all(loadPromises), timeoutPromise]);
    return true;
  } catch {
    return false;
  }
}
