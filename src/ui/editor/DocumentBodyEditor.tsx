import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import type { TextStory } from '../../domain/document/types';
import {
  canonicalToTiptapHtml,
  tiptapHtmlToCanonical,
} from '../../domain/rich-text/tiptapConverter';
import type { RichTextDocument } from '../../domain/rich-text/types';
import { getFontDefinition } from '../../domain/unicode/fontRegistry';

export interface DocumentBodyEditorProps {
  story: TextStory;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  scale?: number;
  pendingChar?: string | null;
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
  onCommit,
}: DocumentBodyEditorProps) {
  const fontDef = getFontDefinition(fontFamily);
  const initialHtml = canonicalToTiptapHtml(story.content);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
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
          min-height: 500px;
          direction: rtl;
          text-align: right;
          padding: 32px;
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

  if (!editor) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        borderRadius: '2px',
        overflow: 'auto',
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
