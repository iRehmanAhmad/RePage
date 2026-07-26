import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import type { Rect, TextStory } from '../../domain/document/types';
import type { RichTextDocument } from '../../domain/rich-text/types';
import { getFontDefinition } from '../../domain/unicode/fontRegistry';
import { canonicalToTiptapHtml, tiptapHtmlToCanonical } from '../../domain/rich-text/tiptapConverter';
import { SmartDeletePreview } from './smartDeletePreview';
import { BidiVisualCursor } from './bidiVisualCursor';

export interface TextEditorOverlayProps {
  frame: Rect;
  story: TextStory;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  scale?: number;
  pendingChar?: string | null;
  onCommit: (updatedContent: RichTextDocument) => void;
  onClose: () => void;
}

export function TextEditorOverlay({
  frame,
  story,
  fontFamily = 'Noto Nastaliq Urdu',
  fontSize = 24,
  color = '#172119',
  lineHeight = 1.8,
  scale = 1,
  pendingChar,
  onCommit,
  onClose,
}: TextEditorOverlayProps) {
  const fontDef = getFontDefinition(fontFamily);
  const lastPendingCharacter = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily,
      SmartDeletePreview,
      BidiVisualCursor,
    ],
    content: canonicalToTiptapHtml(story.content),
    autofocus: 'end',
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
        `,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const updatedRichText = tiptapHtmlToCanonical(currentEditor.getHTML(), 'rtl');
      onCommit(updatedRichText);
    },
  });

  // Handle pending character insertion from VisualKeyboard or virtual inputs
  useEffect(() => {
    if (editor && pendingChar && pendingChar !== lastPendingCharacter.current) {
      editor.commands.insertContent(pendingChar);
      lastPendingCharacter.current = pendingChar;
    } else if (!pendingChar) {
      lastPendingCharacter.current = null;
    }
  }, [editor, pendingChar]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!editor) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${frame.x * scale}pt`,
        top: `${frame.y * scale}pt`,
        width: `${frame.width * scale}pt`,
        height: `${frame.height * scale}pt`,
        transform: `rotate(${frame.rotation}deg)`,
        transformOrigin: 'top left',
        zIndex: 50,
        backgroundColor: 'transparent',
        border: '1px dashed #0284c7',
        borderRadius: '2px',
        boxShadow: 'none',
        padding: '4px 6px',
        overflow: 'auto',
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
