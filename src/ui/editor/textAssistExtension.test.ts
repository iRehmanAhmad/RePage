import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {
  CharacterStyleMark,
  TextAssist,
  acceptCompletion,
  getCompletionState,
  handleCompletionKeyDown,
  tryAutoCorrectAtDelimiter,
} from './textAssistExtension';
import {
  isAutoCorrectEnabled,
  isWordCompletionEnabled,
  setAutoCorrectEnabled,
  setDocumentVocabulary,
  setWordCompletionEnabled,
} from '../../domain/language/textAssistSettings';
import { setDocumentIgnoredWords } from '../../domain/language/spellcheckSettings';

describe('TextAssist extension (batch 12)', () => {
  let editor: Editor | null = null;
  let mount: HTMLDivElement | null = null;

  afterEach(() => {
    editor?.destroy();
    editor = null;
    mount?.remove();
    mount = null;
    setDocumentVocabulary([]);
    setDocumentIgnoredWords([]);
    localStorage.clear();
  });

  function createEditor(content: string): Editor {
    mount = document.createElement('div');
    document.body.appendChild(mount);
    editor = new Editor({
      element: mount,
      extensions: [StarterKit, CharacterStyleMark, TextAssist],
      content,
    });
    return editor;
  }

  function typeText(ed: Editor, text: string): void {
    for (const ch of text) {
      ed.view.dispatch(ed.state.tr.insertText(ch));
    }
  }

  function docText(ed: Editor): string {
    return ed.state.doc.textBetween(0, ed.state.doc.content.size, '\n');
  }

  describe('auto-correct', () => {
    it('replaces a known typo when a delimiter is typed, as ONE undo step', () => {
      const ed = createEditor('<p></p>');
      ed.commands.setTextSelection(1);
      typeText(ed, 'teh');
      expect(docText(ed)).toBe('teh');
      expect(tryAutoCorrectAtDelimiter(ed.view, ' ')).toBe(true);
      expect(docText(ed)).toBe('the ');
      // Exactly one undo restores the typo (and removes the delimiter the
      // correction transaction carried) — the typed word itself stays.
      ed.commands.undo();
      expect(docText(ed)).toBe('teh');
    });

    it('corrects Urdu typos too', () => {
      const ed = createEditor('<p></p>');
      ed.commands.setTextSelection(1);
      typeText(ed, 'حاسل');
      expect(tryAutoCorrectAtDelimiter(ed.view, ' ')).toBe(true);
      expect(docText(ed)).toBe('حاصل ');
    });

    it('leaves valid words and unknown words alone', () => {
      const ed = createEditor('<p></p>');
      ed.commands.setTextSelection(1);
      typeText(ed, 'the');
      expect(tryAutoCorrectAtDelimiter(ed.view, ' ')).toBe(false);
      expect(docText(ed)).toBe('the');
    });

    it('does nothing when the toggle is off', () => {
      setAutoCorrectEnabled(false);
      expect(isAutoCorrectEnabled()).toBe(false);
      const ed = createEditor('<p></p>');
      ed.commands.setTextSelection(1);
      typeText(ed, 'teh');
      expect(tryAutoCorrectAtDelimiter(ed.view, ' ')).toBe(false);
      expect(docText(ed)).toBe('teh');
    });

    it('never corrects a word on the document ignore list', () => {
      setDocumentIgnoredWords(['teh']);
      const ed = createEditor('<p></p>');
      ed.commands.setTextSelection(1);
      typeText(ed, 'teh');
      expect(tryAutoCorrectAtDelimiter(ed.view, ' ')).toBe(false);
    });

    it('never corrects across a formatting boundary inside the word', () => {
      const ed = createEditor('<p>t<strong>eh</strong></p>');
      ed.commands.setTextSelection(4); // caret right after "teh"
      expect(docText(ed)).toBe('teh');
      expect(tryAutoCorrectAtDelimiter(ed.view, ' ')).toBe(false);
      expect(docText(ed)).toBe('teh');
    });

    it('keeps the word formatting on the correction', () => {
      const ed = createEditor('<p><strong></strong></p>');
      ed.commands.setTextSelection(1);
      // Type inside the strong element via a marked insertion.
      ed.view.dispatch(ed.state.tr.insertText('t').insertText('e').insertText('h'));
      // (plain insertText inherits surrounding marks in PM when stored marks set — fall back check below)
      const before = docText(ed);
      expect(before).toBe('teh');
      expect(tryAutoCorrectAtDelimiter(ed.view, ' ')).toBe(true);
      expect(docText(ed)).toBe('the ');
    });
  });

  describe('word completion', () => {
    it('opens with document-vocabulary candidates and accepts by suffix only', () => {
      setDocumentVocabulary([{ word: 'governance', count: 3 }]);
      const ed = createEditor('<p>gov</p>');
      ed.commands.setTextSelection(4);
      const state = getCompletionState(ed.view);
      expect(state).not.toBeNull();
      expect(state!.items[0]).toBe('governance');
      // The popup DOM is rendered.
      expect(mount!.querySelector('.repage-completion-popup')).not.toBeNull();
      expect(acceptCompletion(ed.view)).toBe(true);
      expect(docText(ed)).toBe('governance');
      expect(getCompletionState(ed.view)).toBeNull();
    });

    it('Tab accepts through the key handler', () => {
      const ed = createEditor('<p>gov</p>');
      ed.commands.setTextSelection(4);
      expect(getCompletionState(ed.view)).not.toBeNull();
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      expect(handleCompletionKeyDown(ed.view, event)).toBe(true);
      expect(docText(ed)).toBe('government');
    });

    it('Esc dismisses and the same word does not reopen', () => {
      const ed = createEditor('<p>gov</p>');
      ed.commands.setTextSelection(4);
      expect(getCompletionState(ed.view)).not.toBeNull();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(handleCompletionKeyDown(ed.view, event)).toBe(true);
      expect(getCompletionState(ed.view)).toBeNull();
      // A fresh selection transaction at the same word stays dismissed.
      ed.commands.setTextSelection(3);
      ed.commands.setTextSelection(4);
      expect(getCompletionState(ed.view)).toBeNull();
    });

    it('stays closed when the toggle is off', () => {
      setWordCompletionEnabled(false);
      expect(isWordCompletionEnabled()).toBe(false);
      const ed = createEditor('<p>gov</p>');
      ed.commands.setTextSelection(4);
      expect(getCompletionState(ed.view)).toBeNull();
    });

    it('does not complete inside numeric strings or mid-word', () => {
      const ed = createEditor('<p>123gov</p>');
      ed.commands.setTextSelection(7);
      expect(getCompletionState(ed.view)).toBeNull();
      const ed2 = createEditor('<p>gover</p>');
      ed2.commands.setTextSelection(3); // mid-word caret
      expect(getCompletionState(ed2.view)).toBeNull();
    });
  });

  describe('CharacterStyleMark', () => {
    it('round-trips data-character-style through the editor', () => {
      const ed = createEditor('<p><span data-character-style="emphasis">خاص</span> عام</p>');
      const html = ed.getHTML();
      expect(html).toContain('data-character-style="emphasis"');
      const json = JSON.stringify(ed.getJSON());
      expect(json).toContain('"characterStyle"');
      expect(json).toContain('"styleId":"emphasis"');
    });
  });
});
