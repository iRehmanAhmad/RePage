import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { TextStory } from '../../domain/document/types';
import {
  canonicalToTiptapHtml,
  tiptapHtmlToCanonical,
} from '../../domain/rich-text/tiptapConverter';
import type { RichTextDocument } from '../../domain/rich-text/types';
import { getFontDefinition } from '../../domain/unicode/fontRegistry';
import { SmartDeletePreview } from './smartDeletePreview';
import { BidiVisualCursor } from './bidiVisualCursor';

export interface DocumentBodyEditorProps {
  story: TextStory;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  scale?: number;
  pendingChar?: string | null;
  /** Increment to focus the editor after a click on unoccupied page space. */
  focusRequest?: number;
  onCommit: (updatedContent: RichTextDocument) => void;
}

export function DocumentBodyEditor({
  story,
  fontFamily = 'Noto Nastaliq Urdu',
  fontSize = 20,
  color = '#172119',
  lineHeight = 1.8,
  scale = 1,
  pendingChar,
  focusRequest = 0,
  onCommit,
}: DocumentBodyEditorProps) {
  const fontDef = getFontDefinition(fontFamily);
  const initialHtml = canonicalToTiptapHtml(story.content);

  const editor = useEditor({
    extensions: [StarterKit, SmartDeletePreview, BidiVisualCursor],
    content: initialHtml,
    autofocus: false,
    editorProps: {
      attributes: {
        dir: 'rtl',
        style: `
          font-family: ${fontDef.family};
          font-size: ${fontSize * scale}px;
          color: ${color};
          line-height: ${lineHeight};
          outline: none;
          min-height: 100%;
          direction: rtl;
          text-align: right;
          padding: 0;
          margin: 0;
        `,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const updatedRichText = tiptapHtmlToCanonical(html, 'rtl');
      onCommit(updatedRichText);
    },
  });

  // Handle pending character insertion from VisualKeyboard
  useEffect(() => {
    if (editor && pendingChar) {
      editor.commands.insertContent(pendingChar);
    }
  }, [editor, pendingChar]);

  useEffect(() => {
    if (editor && focusRequest > 0) {
      editor.commands.focus('end');
    }
  }, [editor, focusRequest]);

  if (!editor) {
    return null;
  }

  return (
    <div
      onClick={() => editor.commands.focus()}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        cursor: 'text',
      }}
    >
      <EditorContent editor={editor} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
