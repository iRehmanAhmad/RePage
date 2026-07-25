import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextSelection } from '@tiptap/pm/state';
import { SmartDeletePreview } from './smartDeletePreview';

describe('SmartDeletePreview', () => {
  let editor: Editor | null = null;

  afterEach(() => {
    editor?.destroy();
    editor = null;
  });

  it('marks both deletion targets at an Urdu-English cursor boundary', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    const content = 'یہ report ہے';
    const boundaryOffset = content.indexOf('report');

    editor = new Editor({
      element: mount,
      extensions: [StarterKit, SmartDeletePreview],
      content: `<p dir="rtl">${content}</p>`,
    });

    editor.view.dispatch(
      editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1 + boundaryOffset)),
    );

    expect(mount.querySelector('.smart-delete-preview-backspace')).not.toBeNull();
    expect(mount.querySelector('.smart-delete-preview-forward')).not.toBeNull();
    mount.remove();
  });
});
