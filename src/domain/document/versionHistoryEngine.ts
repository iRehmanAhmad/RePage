import type { RePageDocument } from './types';

export interface DocumentVersion {
  id: string;
  timestamp: string;
  author: string;
  label: string;
  snapshot: RePageDocument;
}

const STORAGE_KEY = 'repage_version_history';

/**
 * Saves a snapshot version of the current document.
 */
export function saveVersionSnapshot(
  doc: RePageDocument,
  label: string,
  author = 'Local Author',
): DocumentVersion {
  const version: DocumentVersion = {
    id: `ver_${Date.now()}`,
    timestamp: new Date().toISOString(),
    author,
    label,
    snapshot: doc,
  };

  try {
    const existing = loadVersionHistory();
    const updated = [version, ...existing].slice(0, 30); // Keep last 30 snapshots
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Local storage limit exceeded or unavailable
  }

  return version;
}

/**
 * Loads all saved document version snapshots.
 */
export function loadVersionHistory(): DocumentVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
