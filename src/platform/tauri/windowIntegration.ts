import { isTauriEnvironment } from './tauriPlatform';

export function formatWindowTitle(docTitle: string, isDirty: boolean): string {
  const cleanTitle = docTitle.trim() || 'Untitled RePage Document';
  const dirtyMarker = isDirty ? ' *' : '';
  return `${cleanTitle}${dirtyMarker} — RePage`;
}

export async function updateWindowTitle(docTitle: string, isDirty: boolean): Promise<void> {
  const fullTitle = formatWindowTitle(docTitle, isDirty);

  if (typeof document !== 'undefined') {
    document.title = fullTitle;
  }

  if (isTauriEnvironment()) {
    try {
      const windowModName = '@tauri-apps/api/window';
      const { getCurrentWindow } = await import(/* @vite-ignore */ windowModName);
      const appWindow = getCurrentWindow();
      await appWindow.setTitle(fullTitle);
    } catch {
      // Fallback to DOM document.title
    }
  }
}
