import React, { useEffect } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
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
  onEditorReady?: ((editor: Editor | null) => void) | undefined;
  onSelectionChange?:
    | ((selectionInfo: {
        isBold: boolean;
        isItalic: boolean;
        isUnderline: boolean;
        fontFamily?: string;
        fontSize?: number;
        color?: string;
        selectedText: string;
        from: number;
        to: number;
      }) => void)
    | undefined;
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
  onEditorReady,
  onSelectionChange,
}: DocumentBodyEditorProps) {
  const fontDef = getFontDefinition(fontFamily);
  const initialHtml = canonicalToTiptapHtml(story.content);

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
    onSelectionUpdate: ({ editor: currentEditor }) => {
      const { from, to } = currentEditor.state.selection;
      const isCollapsed = from === to;
      const selectedText = isCollapsed ? '' : currentEditor.state.doc.textBetween(from, to);

      onSelectionChange?.({
        isBold: currentEditor.isActive('bold'),
        isItalic: currentEditor.isActive('italic'),
        isUnderline: currentEditor.isActive('underline'),
        fontFamily: currentEditor.getAttributes('textStyle').fontFamily || fontFamily,
        fontSize: currentEditor.getAttributes('textStyle').fontSize || fontSize,
        color: currentEditor.getAttributes('textStyle').color || color,
        selectedText,
        from,
        to,
      });
    },
  });

  // Handle pending character insertion from VisualKeyboard
  useEffect(() => {
    if (editor && pendingChar) {
      editor.commands.insertContent(pendingChar);
    }
  }, [editor, pendingChar]);

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
      return () => onEditorReady(null);
    }
  }, [editor, onEditorReady]);

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
        userSelect: 'text',
        WebkitUserSelect: 'text',
        pointerEvents: 'auto',
      }}
    >
      <EditorContent
        editor={editor}
        style={{
          width: '100%',
          height: '100%',
          userSelect: 'text',
          WebkitUserSelect: 'text',
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
}
