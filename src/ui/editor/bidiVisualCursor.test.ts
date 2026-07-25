import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextSelection } from '@tiptap/pm/state';
import { visualCursorTarget } from './bidiVisualCursor';

describe('visualCursorTarget', () => {
  let editor: Editor | null = null;

  afterEach(() => {
    editor?.destroy();
    editor = null;
  });

  it('moves visually left and right inside an English run in an Urdu paragraph', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    const urduPrefix = '\u06cc\u06c1 ';
    const english = 'This boy is my friend';
    const cursorAfterThis = 1 + urduPrefix.length + 'This'.length;

    editor = new Editor({
      element: mount,
      extensions: [StarterKit],
      content: `<p dir="rtl">${urduPrefix}${english}</p>`,
    });
    editor.view.dispatch(
      editor.state.tr.setSelection(TextSelection.create(editor.state.doc, cursorAfterThis)),
    );

    expect(visualCursorTarget(editor.state, 'ArrowLeft')).toBe(cursorAfterThis - 1);
    expect(visualCursorTarget(editor.state, 'ArrowRight')).toBe(cursorAfterThis + 1);
    mount.remove();
  });

  it('defers the ambiguous Urdu-English boundary to the browser bidi engine', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    const prefix = '\u06cc\u06c1 ';
    const cursorAtEnglishBoundary = 1 + prefix.length;

    editor = new Editor({
      element: mount,
      extensions: [StarterKit],
      content: `<p dir="rtl">${prefix}This</p>`,
    });
    editor.view.dispatch(
      editor.state.tr.setSelection(TextSelection.create(editor.state.doc, cursorAtEnglishBoundary)),
    );

    expect(visualCursorTarget(editor.state, 'ArrowLeft')).toBeNull();
    expect(visualCursorTarget(editor.state, 'ArrowRight')).toBeNull();
    mount.remove();
  });
});
