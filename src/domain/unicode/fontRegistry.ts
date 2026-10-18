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
  'amiri': {
    id: 'amiri',
    name: 'Amiri',
    family: "'Amiri', 'Traditional Arabic', serif",
    category: 'naskh',
    license: 'OFL',
    isBundled: true,
    upstreamUrl: 'https://fonts.google.com/specimen/Amiri',
    fallbackChain: ['Traditional Arabic', 'serif'],
  },
  'aref-ruqaa': {
    id: 'aref-ruqaa',
    name: 'Aref Ruqaa',
    family: "'Aref Ruqaa', serif",
    category: 'naskh',
    license: 'OFL',
    isBundled: true,
    upstreamUrl: 'https://fonts.google.com/specimen/Aref+Ruqaa',
    fallbackChain: ['serif'],
  },
  'lateef': {
    id: 'lateef',
    name: 'Lateef',
    family: "'Lateef', cursive",
    category: 'nastaliq',
    license: 'OFL',
    isBundled: true,
    upstreamUrl: 'https://fonts.google.com/specimen/Lateef',
    fallbackChain: ['cursive'],
  },
  'scheherazade-new': {
    id: 'scheherazade-new',
    name: 'Scheherazade New',
    family: "'Scheherazade New', 'Traditional Arabic', serif",
    category: 'naskh',
    license: 'OFL',
    isBundled: true,
    upstreamUrl: 'https://fonts.google.com/specimen/Scheherazade+New',
    fallbackChain: ['serif'],
  },
  'reem-kufi': {
    id: 'reem-kufi',
    name: 'Reem Kufi',
    family: "'Reem Kufi', sans-serif",
    category: 'sans-serif',
    license: 'OFL',
    isBundled: true,
    upstreamUrl: 'https://fonts.google.com/specimen/Reem+Kufi',
    fallbackChain: ['sans-serif'],
  },
  'tajawal': {
    id: 'tajawal',
    name: 'Tajawal',
    family: "'Tajawal', sans-serif",
    category: 'sans-serif',
    license: 'OFL',
    isBundled: true,
    upstreamUrl: 'https://fonts.google.com/specimen/Tajawal',
    fallbackChain: ['sans-serif'],
  },
  'el-messiri': {
    id: 'el-messiri',
    name: 'El Messiri',
    family: "'El Messiri', sans-serif",
    category: 'sans-serif',
    license: 'OFL',
    isBundled: true,
    upstreamUrl: 'https://fonts.google.com/specimen/El+Messiri',
    fallbackChain: ['sans-serif'],
  },
  'harmattan': {
    id: 'harmattan',
    name: 'Harmattan',
    family: "'Harmattan', sans-serif",
    category: 'sans-serif',
    license: 'OFL',
    isBundled: true,
    upstreamUrl: 'https://fonts.google.com/specimen/Harmattan',
    fallbackChain: ['sans-serif'],
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
  'Alvi Nastaleeq',
  'Nafees Nastaleeq',
  'Amiri',
  'Aref Ruqaa',
  'Lateef',
  'Scheherazade New',
  'Reem Kufi',
  'Tajawal',
  'El Messiri',
  'Harmattan',
  'Noto Naskh Arabic',
  'Urdu Typesetting',
  'Arabic Typesetting',
];

export const URDU_FONT_PRESETS: { name: string; urduName: string; category: FontCategory }[] = [
  { name: 'Noto Nastaliq Urdu', urduName: 'نستعلیق (Noto Nastaliq)', category: 'nastaliq' },
  { name: 'Jameel Noori Nastaleeq', urduName: 'جمیل نوری نستعلیق', category: 'nastaliq' },
  { name: 'Gulzar', urduName: 'گلزار (Gulzar)', category: 'nastaliq' },
  { name: 'Pak Nastaleeq', urduName: 'پاک نستعلیق', category: 'nastaliq' },
  { name: 'Mehr Nastaliq', urduName: 'مہر نستعلیق', category: 'nastaliq' },
  { name: 'Alvi Nastaleeq', urduName: 'علوی نستعلیق', category: 'nastaliq' },
  { name: 'Nafees Nastaleeq', urduName: 'نفیس نستعلیق', category: 'nastaliq' },
  { name: 'Amiri', urduName: 'امیری (Amiri)', category: 'naskh' },
  { name: 'Aref Ruqaa', urduName: 'عارف رقعہ (Ruqaa)', category: 'naskh' },
  { name: 'Lateef', urduName: 'لطیف (Lateef)', category: 'nastaliq' },
  { name: 'Scheherazade New', urduName: 'شہرزاد (Scheherazade)', category: 'naskh' },
  { name: 'Reem Kufi', urduName: 'ریم کوفی (Kufi)', category: 'sans-serif' },
  { name: 'Tajawal', urduName: 'تجوال (Tajawal)', category: 'sans-serif' },
  { name: 'El Messiri', urduName: 'المسیری (El Messiri)', category: 'sans-serif' },
  { name: 'Harmattan', urduName: 'حرمل (Harmattan)', category: 'sans-serif' },
  { name: 'Noto Naskh Arabic', urduName: 'نوٹو نسخ عربی', category: 'naskh' },
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

export const BUNDLED_URDU_FONTS: string[] = [
  'Noto Nastaliq Urdu',
  'Gulzar',
  'Amiri',
  'Aref Ruqaa',
  'Lateef',
  'Scheherazade New',
  'Reem Kufi',
  'Tajawal',
  'El Messiri',
  'Harmattan',
  'Noto Naskh Arabic',
];

export function getFontCategoryBadge(fontName: string): { label: string; isUnavailable: boolean } {
  if (BUNDLED_URDU_FONTS.includes(fontName)) {
    return { label: 'Bundled OFL', isUnavailable: false };
  }
  return { label: 'System Font', isUnavailable: false };
}

export function getFontFamilyCss(fontName: string): string {
  if (!fontName) return "'Noto Nastaliq Urdu', serif";
  const normalizedKey = fontName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const foundDef = FONT_REGISTRY[normalizedKey];
  if (foundDef) {
    return foundDef.family;
  }
  if (fontName.includes('Jameel')) {
    return "'Jameel Noori Nastaleeq', 'Jameel Noori Nastaliq', 'Noto Nastaliq Urdu', serif";
  }
  if (fontName.includes('Pak')) {
    return "'Pak Nastaleeq', 'Pak Nastaleeq v1.0', 'Noto Nastaliq Urdu', serif";
  }
  if (fontName.includes('Mehr')) {
    return "'Mehr Nastaliq', 'Mehr Nastaliq Web', 'Noto Nastaliq Urdu', serif";
  }
  if (fontName.includes('Alvi')) {
    return "'Alvi Nastaleeq', 'Alvi Lahori Nastaleeq', 'Noto Nastaliq Urdu', serif";
  }
  if (fontName.includes('Nafees')) {
    return "'Nafees Nastaleeq', 'Nafees Naskh', 'Noto Nastaliq Urdu', serif";
  }
  if (fontName.includes('Urdu')) {
    return "'Urdu Typesetting', 'Noto Nastaliq Urdu', serif";
  }
  if (fontName.includes('Arabic')) {
    return "'Arabic Typesetting', 'Traditional Arabic', 'Noto Naskh Arabic', serif";
  }
  return `'${fontName}', system-ui, sans-serif`;
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
