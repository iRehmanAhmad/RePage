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
 * Deletes a custom keyboard layout by ID.
 */
export function deleteCustomKeyboardLayout(id: string): CustomKeyboardLayout[] {
  try {
    const existing = loadCustomKeyboardLayouts();
    const updated = existing.filter((l) => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Duplicates an existing custom keyboard layout.
 */
export function duplicateCustomKeyboardLayout(id: string): CustomKeyboardLayout | null {
  const existing = loadCustomKeyboardLayouts();
  const target = existing.find((l) => l.id === id);
  if (!target) return null;

  const uniqueId = `custom_kbd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const copy: CustomKeyboardLayout = {
    id: uniqueId,
    name: `${target.name} (Copy)`,
    mappings: JSON.parse(JSON.stringify(target.mappings)),
  };

  saveCustomKeyboardLayout(copy);
  return copy;
}

/**
 * Exports a custom keyboard layout to JSON string.
 */
export function exportLayoutToJson(layout: CustomKeyboardLayout): string {
  return JSON.stringify(layout, null, 2);
}

/**
 * Imports a custom keyboard layout from JSON string with validation.
 */
export function importLayoutFromJson(jsonStr: string): CustomKeyboardLayout | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.name !== 'string' || !parsed.mappings || typeof parsed.mappings !== 'object') {
      return null;
    }

    const uniqueId = `custom_kbd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const imported: CustomKeyboardLayout = {
      id: uniqueId,
      name: parsed.name.trim() || 'Imported Layout',
      mappings: parsed.mappings,
    };

    saveCustomKeyboardLayout(imported);
    return imported;
  } catch {
    return null;
  }
}

/**
 * Resets custom keyboard layouts storage to empty.
 */
export function resetCustomLayoutsToDefault(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

/**
 * Validates key mapping string (max 4 chars to allow graphemes/combining/ZWNJ).
 */
export function validateCustomKeyMapping(val: string): boolean {
  if (val === undefined || val === null) return false;
  if (val.length === 0) return true;
  // Reject control characters except ZWNJ (\u200C), ZWJ (\u200D), RLM (\u200F), LRM (\u200E)
  for (let i = 0; i < val.length; i++) {
    const code = val.charCodeAt(i);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) return false;
  }
  return val.length <= 4;
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
