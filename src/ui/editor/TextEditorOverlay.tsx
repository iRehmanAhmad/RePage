import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Rect, TextStory } from '../../domain/document/types';
import {
  createRichTextFromPlainText,
  extractPlainText,
  type RichTextDocument,
} from '../../domain/rich-text/types';
import { getFontDefinition } from '../../domain/unicode/fontRegistry';

export interface TextEditorOverlayProps {
  frame: Rect;
  story: TextStory;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  scale?: number;
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
  onCommit,
  onClose,
}: TextEditorOverlayProps) {
  const initialText = extractPlainText(story.content);
  const fontDef = getFontDefinition(fontFamily);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialText ? `<p>${initialText}</p>` : '<p></p>',
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
      const text = currentEditor.getText();
      const updatedRichText = createRichTextFromPlainText(text, 'rtl');
      onCommit(updatedRichText);
    },
  });

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
        left: `${frame.x * scale}px`,
        top: `${frame.y * scale}px`,
        width: `${frame.width * scale}px`,
        height: `${frame.height * scale}px`,
        transform: `rotate(${frame.rotation}deg)`,
        transformOrigin: 'top left',
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '2px solid #10b981',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '8px',
        overflow: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
        <span style={{ fontWeight: 600, color: '#047857' }}>اردو ایڈیٹر (Tiptap)</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ✕ بند کریں
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
