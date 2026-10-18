export async function copyToClipboard(text: string, html?: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      if (html && typeof ClipboardItem !== 'undefined') {
        const textBlob = new Blob([text], { type: 'text/plain' });
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const item = new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob,
        });
        await navigator.clipboard.write([item]);
        return true;
      }
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back below
    }
  }

  if (typeof document !== 'undefined' && typeof document.execCommand === 'function') {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }

  return false;
}

export async function readFromClipboard(): Promise<string> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return '';
    }
  }
  return '';
}
