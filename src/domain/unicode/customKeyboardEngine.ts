export interface CustomKeyEntry {
  normal: string;
  shift: string;
  altGr?: string | undefined;
}

export interface CustomKeyboardLayout {
  id: string;
  name: string;
  mappings: Record<string, CustomKeyEntry>;
}

const STORAGE_KEY = 'repage_custom_keyboards';

/**
 * Saves a custom keyboard layout map to persistent local storage.
 */
export function saveCustomKeyboardLayout(layout: CustomKeyboardLayout): void {
  try {
    const existing = loadCustomKeyboardLayouts();
    const updated = existing.filter((l) => l.id !== layout.id);
    updated.push(layout);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Local storage unavailable
  }
}

/**
 * Loads all saved custom keyboard layouts from persistent local storage.
 */
export function loadCustomKeyboardLayouts(): CustomKeyboardLayout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Creates a default customizable Urdu Phonetic layout template.
 */
export function createDefaultCustomLayout(name = 'Custom Phonetic'): CustomKeyboardLayout {
  return {
    id: `custom_kbd_${Date.now()}`,
    name,
    mappings: {
      a: { normal: 'ا', shift: 'آ' },
      b: { normal: 'ب', shift: '؍' },
      c: { normal: 'چ', shift: 'ث' },
      d: { normal: 'د', shift: 'ڈ' },
      e: { normal: 'ع', shift: 'ۣ' },
      f: { normal: 'ف', shift: '؁' },
      g: { normal: 'گ', shift: 'غ' },
      h: { normal: 'ح', shift: 'ھ' },
      i: { normal: 'ی', shift: 'ٰ' },
      j: { normal: 'ج', shift: 'ض' },
      k: { normal: 'ک', shift: 'خ' },
      l: { normal: 'ل', shift: 'ڸ' },
      m: { normal: 'م', shift: 'ّ' },
      n: { normal: 'ن', shift: 'ں' },
      o: { normal: 'ہ', shift: 'ۃ' },
      p: { normal: 'پ', shift: 'ُ' },
      q: { normal: 'ق', shift: 'ٹ' },
      r: { normal: 'ر', shift: 'ڑ' },
      s: { normal: 'س', shift: 'ص' },
      t: { normal: 'ت', shift: 'ٹ' },
      u: { normal: 'ء', shift: 'ئ' },
      v: { normal: 'ط', shift: 'ظ' },
      w: { normal: 'و', shift: 'ؤ' },
      x: { normal: 'ش', shift: 'ژ' },
      y: { normal: 'ے', shift: 'ۓ' },
      z: { normal: 'ز', shift: 'ذ' },
    },
  };
}
