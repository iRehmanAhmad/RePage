import type { RePageDocument } from '../document/types';

/**
 * Text-assist settings (Phase 4 batch 12): auto-correct + word completion
 * toggles, persisted in localStorage exactly like the spellcheck toggle in
 * spellcheckSettings.ts. Both default to ON. Editors read the values live
 * (on every keystroke / transaction), so toggling in the Language Tools
 * panel takes effect immediately without remounting editors.
 *
 * This module also mirrors the ACTIVE document's vocabulary for word
 * completion, the same pattern spellcheckSettings uses for the document
 * ignore list: the editor extension has no document handle, so App keeps
 * the mirror current whenever the document changes.
 */

const AUTOCORRECT_ENABLED_KEY = 'repage_autocorrect_enabled';
const WORD_COMPLETION_ENABLED_KEY = 'repage_word_completion_enabled';

/** Fired on window whenever either toggle changes (same-tab listeners). */
export const TEXT_ASSIST_CHANGED_EVENT = 'repage:text-assist-changed';

function readToggle(key: string): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

function writeToggle(key: string, on: boolean): void {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
    // ignore storage errors (private mode etc.)
  }
  try {
    window.dispatchEvent(new Event(TEXT_ASSIST_CHANGED_EVENT));
  } catch {
    // non-browser context — toggles are still readable via localStorage
  }
}

export function isAutoCorrectEnabled(): boolean {
  return readToggle(AUTOCORRECT_ENABLED_KEY);
}

export function setAutoCorrectEnabled(on: boolean): void {
  writeToggle(AUTOCORRECT_ENABLED_KEY, on);
}

export function isWordCompletionEnabled(): boolean {
  return readToggle(WORD_COMPLETION_ENABLED_KEY);
}

export function setWordCompletionEnabled(on: boolean): void {
  writeToggle(WORD_COMPLETION_ENABLED_KEY, on);
}

// --- Active document vocabulary mirror (for word completion) -------------------

export interface DocumentVocabularyEntry {
  /** Surface form to insert (document's own spelling/casing). */
  word: string;
  /** Occurrences in the document. */
  count: number;
}

let activeDocumentVocabulary: readonly DocumentVocabularyEntry[] = [];

export function setDocumentVocabulary(entries: readonly DocumentVocabularyEntry[]): void {
  activeDocumentVocabulary = [...entries];
}

export function getDocumentVocabulary(): readonly DocumentVocabularyEntry[] {
  return activeDocumentVocabulary;
}

const LATIN_TOKEN = /[A-Za-z]+(?:'[A-Za-z]+)?/g;
// Mirrors the spellchecker's Urdu token pattern (character class + ZWNJ), so
// vocabulary words are tokenized exactly the way the checker sees them.
const URDU_TOKEN = /[\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u06FA-\u06FC\u200C]+/g;

/**
 * Builds the completion vocabulary of a document from every story's text:
 * distinct words with occurrence counts. Latin words are keyed lowercase
 * (the first-seen surface form is kept for insertion); Urdu words are
 * keyed by their exact surface form. Words shorter than 3 characters and
 * anything containing digits never enter the vocabulary.
 */
export function buildDocumentVocabulary(doc: RePageDocument): DocumentVocabularyEntry[] {
  const byKey = new Map<string, DocumentVocabularyEntry>();
  const addText = (text: string): void => {
    for (const match of text.matchAll(LATIN_TOKEN)) {
      const word = match[0];
      if (word.length < 3) continue;
      const key = `en:${word.toLowerCase()}`;
      const existing = byKey.get(key);
      if (existing) existing.count += 1;
      else byKey.set(key, { word, count: 1 });
    }
    for (const match of text.matchAll(URDU_TOKEN)) {
      const word = match[0];
      if (word.length < 3 || /\d/.test(word)) continue;
      const key = `ur:${word}`;
      const existing = byKey.get(key);
      if (existing) existing.count += 1;
      else byKey.set(key, { word, count: 1 });
    }
  };
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const record = node as { type?: string; text?: string; content?: unknown[] };
    if (record.type === 'text' && typeof record.text === 'string') addText(record.text);
    if (Array.isArray(record.content)) record.content.forEach(walk);
  };
  for (const story of Object.values(doc.stories)) walk(story.content);
  return [...byKey.values()];
}
