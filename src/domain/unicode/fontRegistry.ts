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
  'inpage-nastaliq': {
    id: 'inpage-nastaliq',
    name: 'InPage Nastaliq',
    family: "'InPage Nastaliq', 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif",
    category: 'nastaliq',
    license: 'Proprietary',
    isBundled: false,
    fallbackChain: ['Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'serif'],
  },
  'inpage-noori-nastaliq': {
    id: 'inpage-noori-nastaliq',
    name: 'InPage Noori Nastaliq',
    family: "'InPage Noori Nastaliq', 'Noori Nastaliq', 'Noto Nastaliq Urdu', serif",
    category: 'nastaliq',
    license: 'Proprietary',
    isBundled: false,
    fallbackChain: ['Noori Nastaliq', 'Noto Nastaliq Urdu', 'serif'],
  },
  'inpage-ali-nastaliq': {
    id: 'inpage-ali-nastaliq',
    name: 'InPage Ali Nastaliq',
    family: "'InPage Ali Nastaliq', 'Ali Nastaliq', 'Noto Nastaliq Urdu', serif",
    category: 'nastaliq',
    license: 'Proprietary',
    isBundled: false,
    fallbackChain: ['Ali Nastaliq', 'Noto Nastaliq Urdu', 'serif'],
  },
  'inpage-lahori-nastaliq': {
    id: 'inpage-lahori-nastaliq',
    name: 'InPage Lahori Nastaliq',
    family: "'InPage Lahori Nastaliq', 'Faiz Lahori Nastaliq', 'Noto Nastaliq Urdu', serif",
    category: 'nastaliq',
    license: 'Proprietary',
    isBundled: false,
    fallbackChain: ['Faiz Lahori Nastaliq', 'Noto Nastaliq Urdu', 'serif'],
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

export function registerCustomInPageFont(fontId: string, fontName: string, familyCss: string): FontDefinition {
  const customDef: FontDefinition = {
    id: fontId,
    name: fontName,
    family: familyCss,
    category: 'nastaliq',
    license: 'Proprietary',
    isBundled: false,
    fallbackChain: ['Noto Nastaliq Urdu', 'serif'],
  };
  FONT_REGISTRY[fontId] = customDef;
  return customDef;
}

export const DEFAULT_URDU_FONT: FontDefinition = NOTO_NASTALIQ;

export const URDU_FONTS_LIST: string[] = [
  'Noto Nastaliq Urdu',
  'Jameel Noori Nastaleeq',
  'Gulzar',
  'Pak Nastaleeq',
  'Mehr Nastaliq',
  'InPage Ali Nastaliq',
  'InPage Lahori Nastaliq',
  'Urdu Typesetting',
  'Arabic Typesetting',
];

export const URDU_FONT_PRESETS: { name: string; urduName: string; category: FontCategory }[] = [
  { name: 'Noto Nastaliq Urdu', urduName: 'نستعلیق (Noto Nastaliq)', category: 'nastaliq' },
  { name: 'Jameel Noori Nastaleeq', urduName: 'جمیل نوری نستعلیق', category: 'nastaliq' },
  { name: 'Gulzar', urduName: 'گلزار (Gulzar)', category: 'nastaliq' },
  { name: 'Pak Nastaleeq', urduName: 'پاک نستعلیق', category: 'nastaliq' },
  { name: 'Mehr Nastaliq', urduName: 'مہر نستعلیق', category: 'nastaliq' },
  { name: 'InPage Ali Nastaliq', urduName: 'انپیج علی نستعلیق', category: 'nastaliq' },
  { name: 'InPage Lahori Nastaliq', urduName: 'انپیج لاہوری نستعلیق', category: 'nastaliq' },
];

export const WINDOWS_STANDARD_FONTS: string[] = [
  'Aptos',
  'Aptos Display',
  'Calibri',
  'Calibri Light',
  'Segoe UI',
  'Segoe UI Semibold',
  'Segoe UI Variable',
  'Arial',
  'Arial Black',
  'Arial Narrow',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Consolas',
  'Courier New',
  'Cambria',
  'Cambria Math',
  'Garamond',
  'Palatino Linotype',
  'Comic Sans MS',
  'Impact',
  'Century Gothic',
  'Book Antiqua',
  'Bookman Old Style',
  'Franklin Gothic Medium',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Microsoft Sans Serif',
  'Urdu Typesetting',
  'Arabic Typesetting',
  'Traditional Arabic',
  'Simplified Arabic',
  'Symbol',
  'Wingdings',
];

export const BUNDLED_URDU_FONTS: string[] = ['Noto Nastaliq Urdu', 'Gulzar', 'Noto Naskh Arabic'];
export const UNAVAILABLE_INPAGE_FONTS: string[] = ['InPage Nastaliq', 'InPage Noori Nastaliq', 'InPage Ali Nastaliq', 'InPage Lahori Nastaliq'];

export function getFontCategoryBadge(fontName: string): { label: string; isUnavailable: boolean } {
  if (BUNDLED_URDU_FONTS.includes(fontName)) {
    return { label: 'Bundled OFL', isUnavailable: false };
  }
  if (UNAVAILABLE_INPAGE_FONTS.includes(fontName)) {
    return { label: '⚠️ Not Installed', isUnavailable: true };
  }
  return { label: 'System Font', isUnavailable: false };
}

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
