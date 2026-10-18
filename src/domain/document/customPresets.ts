/**
 * Custom User Presets Storage & Domain Utility
 * Handles persistent storage of user-defined Urdu typography presets in localStorage.
 */

import type { TextAlignment } from '../rich-text/types';

export interface CustomUrduPreset {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  alignment: TextAlignment;
  numeralSystem: 'urdu' | 'western';
}

const STORAGE_KEY = 'repage_custom_urdu_presets_v1';

export function loadCustomUrduPresets(): CustomUrduPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomUrduPresets(presets: CustomUrduPreset[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // ignore storage quota errors
  }
}

export function createCustomUrduPreset(
  name: string,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  alignment: TextAlignment,
  numeralSystem: 'urdu' | 'western',
): CustomUrduPreset {
  const newPreset: CustomUrduPreset = {
    id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: name.trim() || 'نیا پرسیٹ',
    fontFamily,
    fontSize,
    lineHeight,
    alignment,
    numeralSystem,
  };

  const existing = loadCustomUrduPresets();
  const updated = [...existing, newPreset];
  saveCustomUrduPresets(updated);
  return newPreset;
}

export function deleteCustomUrduPreset(id: string): CustomUrduPreset[] {
  const existing = loadCustomUrduPresets();
  const updated = existing.filter((p) => p.id !== id);
  saveCustomUrduPresets(updated);
  return updated;
}
