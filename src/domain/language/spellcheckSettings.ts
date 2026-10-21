const SPELLCHECK_ENABLED_KEY = 'repage_spellcheck_enabled';

/**
 * Whether inline spellcheck underlines are on. Persisted in localStorage
 * (same approach as the personal dictionary in personalDictionary.ts).
 * Defaults to ON.
 */
export function isSpellcheckEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SPELLCHECK_ENABLED_KEY);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

export function setSpellcheckEnabled(on: boolean): void {
  try {
    localStorage.setItem(SPELLCHECK_ENABLED_KEY, on ? '1' : '0');
  } catch {
    // ignore storage errors (private mode etc.) — session default still applies
  }
}

// --- Active document's ignore list ---------------------------------------------
// The ignore list itself lives in the document (metadata.spellcheckIgnoredWords,
// persisted in the .urdup package). The app mirrors the ACTIVE document's list
// here so the editor extension — which has no document handle — can pass it to
// the engine on every check, mirroring how isSpellcheckEnabled() is read.
let activeDocumentIgnoredWords: readonly string[] = [];

export function setDocumentIgnoredWords(words: readonly string[]): void {
  activeDocumentIgnoredWords = [...words];
}

export function getDocumentIgnoredWords(): readonly string[] {
  return activeDocumentIgnoredWords;
}
