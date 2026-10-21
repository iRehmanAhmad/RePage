import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
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
import { Spellcheck } from './spellcheckExtension';
import { SpellcheckMenu } from './SpellcheckMenu';
import {
  CharacterStyleMark,
  TextAssist,
  tryAutoCorrectAtDelimiter,
} from './textAssistExtension';
import { isWordDelimiter } from '../../domain/language/autoCorrect';
import { characterStylesCss } from '../../domain/rich-text/characterStyles';
import type { CharacterStyle } from '../../domain/rich-text/styles';
import { RepageBreak } from './repageBreakExtension';

import type { KeyboardMode } from '../../domain/unicode/keyboardLayouts';
import { mapKeyToUrduCharacter } from '../../domain/unicode/keyboardLayouts';

export interface TextSelectionInfo {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  selectedText: string;
  from: number;
  to: number;
}

export interface TextEditorOverlayProps {
  frame: Rect;
  story: TextStory;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  scale?: number;
  keyboardMode?: KeyboardMode;
  numeralSystem?: 'urdu' | 'western';
  pendingChar?: string | null;
  /** The document's character-style registry (renders styled runs). */
  characterStyles?: Record<string, CharacterStyle> | undefined;
  onCommit: (updatedContent: RichTextDocument) => void;
  onClose: () => void;
  onEditorReady?: ((editor: Editor | null) => void) | undefined;
  onSelectionChange?: ((selectionInfo: TextSelectionInfo) => void) | undefined;
}

export function TextEditorOverlay({
  frame,
  story,
  fontFamily = 'Noto Nastaliq Urdu',
  fontSize = 24,
  color = '#172119',
  lineHeight = 1.8,
  scale = 1,
  keyboardMode = 'crulp',
  numeralSystem = 'urdu',
  pendingChar,
  characterStyles,
  onCommit,
  onClose,
  onEditorReady,
  onSelectionChange,
}: TextEditorOverlayProps) {
  const fontDef = getFontDefinition(fontFamily);
  const lastPendingCharacter = useRef<string | null>(null);

  const keyboardModeRef = useRef(keyboardMode);
  const numeralSystemRef = useRef(numeralSystem);

  useEffect(() => {
    keyboardModeRef.current = keyboardMode;
    numeralSystemRef.current = numeralSystem;
  }, [keyboardMode, numeralSystem]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      RepageBreak,
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily,
      SmartDeletePreview,
      BidiVisualCursor,
      Spellcheck,
      CharacterStyleMark,
      TextAssist,
    ],
    content: canonicalToTiptapHtml(story.content),
    autofocus: 'end',
    editorProps: {
      handleKeyDown: (view, event) => {
        const mode = keyboardModeRef.current;
        const numSys = numeralSystemRef.current;
        // Explicit breaks: Ctrl+Enter = page break, Ctrl+Shift+Enter =
        // column break (same interception as the body editor).
        if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key === 'Enter') {
          const breakNodeType = view.state.schema.nodes.repageBreak;
          if (breakNodeType) {
            event.preventDefault();
            const { from, to } = view.state.selection;
            view.dispatch(
              view.state.tr.replaceWith(
                from,
                to,
                breakNodeType.create({ breakType: event.shiftKey ? 'column' : 'page' }),
              ),
            );
            return true;
          }
        }
        if (
          !event.ctrlKey &&
          !event.altKey &&
          !event.metaKey
        ) {
          if (event.key.length === 1) {
            const mapped = mapKeyToUrduCharacter(event.key, mode, event.shiftKey, numSys);
            if (mapped) {
              event.preventDefault();
              // A mapped delimiter completes the word: auto-correct gets
              // first claim (it inserts the delimiter itself).
              if (isWordDelimiter(mapped) && tryAutoCorrectAtDelimiter(view, mapped)) {
                return true;
              }
              const { from, to } = view.state.selection;
              view.dispatch(view.state.tr.insertText(mapped, from, to));
              return true;
            }
          }
        }
        return false;
      },
      attributes: {
        dir: 'rtl',
        spellcheck: 'false',
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

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
      return () => onEditorReady(null);
    }
  }, [editor, onEditorReady]);

  // Handle pending character insertion from VisualKeyboard or virtual inputs
  useEffect(() => {
    if (editor && pendingChar && pendingChar !== lastPendingCharacter.current) {
      lastPendingCharacter.current = pendingChar;
      // Virtual-keyboard delimiters complete a word just like typed ones.
      if (isWordDelimiter(pendingChar) && tryAutoCorrectAtDelimiter(editor.view, pendingChar)) {
        return;
      }
      editor.commands.insertContent(pendingChar);
    } else if (!pendingChar) {
      lastPendingCharacter.current = null;
    }
  }, [editor, pendingChar]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // When the completion popup consumed Escape (ProseMirror marks the
      // event defaultPrevented), it dismissed the popup — do not also
      // close the overlay.
      if (e.key === 'Escape' && !e.defaultPrevented) {
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
        userSelect: 'text',
        WebkitUserSelect: 'text',
        pointerEvents: 'auto',
      }}
    >
      {characterStyles ? <style>{characterStylesCss(characterStyles)}</style> : null}
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
      <SpellcheckMenu editor={editor} />
    </div>
  );
}
