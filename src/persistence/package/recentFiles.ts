export interface RecentFileEntry {
  title: string;
  pathOrName: string;
  openedAt: string;
}

const RECENT_FILES_STORAGE_KEY = 'repage_recent_files_v1';
const MAX_RECENT_FILES = 10;

export function getRecentFiles(): RecentFileEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_FILES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentFileEntry[];
  } catch {
    return [];
  }
}

export function addRecentFile(title: string, pathOrName: string): RecentFileEntry[] {
  const current = getRecentFiles();
  const filtered = current.filter((entry) => entry.pathOrName !== pathOrName);

  const updated: RecentFileEntry[] = [
    {
      title,
      pathOrName,
      openedAt: new Date().toISOString(),
    },
    ...filtered,
  ].slice(0, MAX_RECENT_FILES);

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(RECENT_FILES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage quota or disabled fallback
    }
  }

  return updated;
}

export function clearRecentFiles(): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(RECENT_FILES_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
