import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Spellcheck, recheckSpellcheck } from './spellcheckExtension';
import {
  isSpellcheckEnabled,
  setDocumentIgnoredWords,
  setSpellcheckEnabled,
} from '../../domain/language/spellcheckSettings';
import {
  addPersonalWord,
  removePersonalWord,
} from '../../domain/language/personalDictionary';
import { notePersonalDictionaryChanged } from '../../domain/language/urduSpellchecker';

describe('Spellcheck extension (inline underlines)', () => {
  let editor: Editor | null = null;
  let mount: HTMLDivElement | null = null;
  const settingBefore = isSpellcheckEnabled();

  afterEach(() => {
    editor?.destroy();
    editor = null;
    mount?.remove();
    mount = null;
    setSpellcheckEnabled(settingBefore);
    setDocumentIgnoredWords([]);
    localStorage.clear();
    notePersonalDictionaryChanged();
  });

  function createEditor(content: string): Editor {
    mount = document.createElement('div');
    document.body.appendChild(mount);
    editor = new Editor({
      element: mount,
      extensions: [StarterKit, Spellcheck],
      content: `<p dir="rtl">${content}</p>`,
    });
    return editor;
  }

  it('wraps misspelled words in .repage-spellcheck-error and leaves correct words alone', () => {
    setSpellcheckEnabled(true);
    createEditor('پاکستان پکستان ہے');
    const marks = mount!.querySelectorAll('.repage-spellcheck-error');
    expect(marks.length).toBe(1);
    expect(marks[0]!.textContent).toBe('پکستان');
  });

  it('renders no underlines when spellcheck is toggled off', () => {
    setSpellcheckEnabled(false);
    createEditor('پاکستان پکستان ہے');
    expect(mount!.querySelectorAll('.repage-spellcheck-error').length).toBe(0);
  });

  it('re-checks immediately after a word is added to the dictionary', () => {
    setSpellcheckEnabled(true);
    const madeUp = 'نہایت‌عجیب‌لفظ';
    createEditor(`یہ ${madeUp} ہے`);
    expect(mount!.querySelectorAll('.repage-spellcheck-error').length).toBe(1);

    addPersonalWord(madeUp);
    notePersonalDictionaryChanged();
    recheckSpellcheck(editor);
    expect(mount!.querySelectorAll('.repage-spellcheck-error').length).toBe(0);

    removePersonalWord(madeUp);
    notePersonalDictionaryChanged();
  });

  it('does not flag aerab-only variants', () => {
    setSpellcheckEnabled(true);
    createEditor('پاکِستان قومی ترانہ ہے');
    expect(mount!.querySelectorAll('.repage-spellcheck-error').length).toBe(0);
  });

  it('removes the underline when the word is ignored in this document', () => {
    setSpellcheckEnabled(true);
    createEditor('پاکستان پکستان ہے');
    expect(mount!.querySelectorAll('.repage-spellcheck-error').length).toBe(1);

    // The app mirrors the active document's ignore list into the settings;
    // a recheck then drops the underline for that document only.
    setDocumentIgnoredWords(['پکستان']);
    recheckSpellcheck(editor);
    expect(mount!.querySelectorAll('.repage-spellcheck-error').length).toBe(0);

    // Clearing the list (another document, or list cleared) flags it again.
    setDocumentIgnoredWords([]);
    recheckSpellcheck(editor);
    expect(mount!.querySelectorAll('.repage-spellcheck-error').length).toBe(1);
  });
});
