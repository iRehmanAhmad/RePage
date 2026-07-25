export interface AccessibilitySettings {
  isHighContrast: boolean;
  isTouchMode: boolean;
  uiScale: number; // 100, 125, 150, 200
  isReducedMotion: boolean;
}

const STORAGE_KEY = 'repage_accessibility_settings';

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  isHighContrast: false,
  isTouchMode: false,
  uiScale: 100,
  isReducedMotion: false,
};

/**
 * Saves accessibility and customization settings to local storage.
 */
export function saveAccessibilitySettings(settings: AccessibilitySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Local storage unavailable
  }
}

/**
 * Loads saved accessibility settings from local storage.
 */
export function loadAccessibilitySettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ACCESSIBILITY_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  }
}
