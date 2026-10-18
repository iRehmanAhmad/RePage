const PERSONAL_DICT_KEY = 'repage_personal_dictionary';

/**
 * Change listeners: spellcheck keeps an in-memory cache of personal words so
 * the per-word hot path never touches localStorage. Listeners invalidate it.
 */
const changeListeners = new Set<() => void>();

export function onPersonalDictionaryChanged(listener: () => void): () => void {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

function emitPersonalDictionaryChanged(): void {
  for (const listener of changeListeners) {
    try {
      listener();
    } catch {
      // a listener must never break persistence
    }
  }
}

/**
 * Loads user personal dictionary words from local storage.
 */
export function loadPersonalDictionary(): string[] {
  try {
    const raw = localStorage.getItem(PERSONAL_DICT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves personal dictionary words array to local storage.
 */
export function savePersonalDictionary(words: string[]): void {
  try {
    const uniqueWords = Array.from(new Set(words.map((w) => w.trim()).filter(Boolean)));
    localStorage.setItem(PERSONAL_DICT_KEY, JSON.stringify(uniqueWords));
  } catch {
    // ignore storage quota errors in test environments
  }
  emitPersonalDictionaryChanged();
}

/**
 * Adds a new word to the user personal dictionary.
 */
export function addPersonalWord(word: string): string[] {
  const current = loadPersonalDictionary();
  const trimmed = word.trim();
  if (!trimmed || current.includes(trimmed)) return current;

  const next = [...current, trimmed];
  savePersonalDictionary(next);
  return next;
}

/**
 * Removes a word from the user personal dictionary.
 */
export function removePersonalWord(word: string): string[] {
  const current = loadPersonalDictionary();
  const trimmed = word.trim();
  const next = current.filter((w) => w !== trimmed);
  savePersonalDictionary(next);
  return next;
}

/**
 * Checks if a word exists in the user personal dictionary.
 */
export function isPersonalWord(word: string): boolean {
  const current = loadPersonalDictionary();
  return current.includes(word.trim());
}
