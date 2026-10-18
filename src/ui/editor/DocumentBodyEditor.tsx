import React, { useEffect } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { Node } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: null,
        parseHTML: (element) => element.style.textAlign || element.getAttribute('align') || null,
        renderHTML: (attributes) => {
          if (!attributes.alignment) return {};
          return { style: `text-align: ${attributes.alignment}` };
        },
      },
      lineHeight: {
        default: null,
        parseHTML: (element) => element.style.lineHeight || null,
        renderHTML: (attributes) => {
          if (!attributes.lineHeight) return {};
          return { style: `line-height: ${attributes.lineHeight}` };
        },
      },
      spaceBefore: {
        default: null,
        parseHTML: (element) => element.style.marginTop || null,
        renderHTML: (attributes) => {
          if (attributes.spaceBefore === null || attributes.spaceBefore === undefined) return {};
          return { style: `margin-top: ${attributes.spaceBefore}pt` };
        },
      },
      spaceAfter: {
        default: null,
        parseHTML: (element) => element.style.marginBottom || null,
        renderHTML: (attributes) => {
          if (attributes.spaceAfter === null || attributes.spaceAfter === undefined) return {};
          return { style: `margin-bottom: ${attributes.spaceAfter}pt` };
        },
      },
      pageFragment: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-repage-fragment') || null,
        renderHTML: (attributes) => {
          if (!attributes.pageFragment) return {};
          return { 'data-repage-fragment': attributes.pageFragment };
        },
      },
    };
  },
});

const RePagePage = Node.create({
  name: 'repagePage',
  group: 'block',
  content: 'block+',
  isolating: true,
  defining: true,
  addAttributes() {
    return {
      pageWidth: {
        default: 595,
        parseHTML: (element: HTMLElement) => Number(element.getAttribute('data-repage-page-width')) || 595,
        renderHTML: (attributes: Record<string, number>) => ({ 'data-repage-page-width': String(attributes.pageWidth) }),
      },
      pageHeight: {
        default: 842,
        parseHTML: (element: HTMLElement) => Number(element.getAttribute('data-repage-page-height')) || 842,
        renderHTML: (attributes: Record<string, number>) => ({ 'data-repage-page-height': String(attributes.pageHeight) }),
      },
      marginTop: {
        default: 42,
        parseHTML: (element: HTMLElement) => Number(element.getAttribute('data-repage-margin-top')) || 42,
        renderHTML: (attributes: Record<string, number>) => ({ 'data-repage-margin-top': String(attributes.marginTop) }),
      },
      marginRight: {
        default: 42,
        parseHTML: (element: HTMLElement) => Number(element.getAttribute('data-repage-margin-right')) || 42,
        renderHTML: (attributes: Record<string, number>) => ({ 'data-repage-margin-right': String(attributes.marginRight) }),
      },
      marginBottom: {
        default: 42,
        parseHTML: (element: HTMLElement) => Number(element.getAttribute('data-repage-margin-bottom')) || 42,
        renderHTML: (attributes: Record<string, number>) => ({ 'data-repage-margin-bottom': String(attributes.marginBottom) }),
      },
      marginLeft: {
        default: 42,
        parseHTML: (element: HTMLElement) => Number(element.getAttribute('data-repage-margin-left')) || 42,
        renderHTML: (attributes: Record<string, number>) => ({ 'data-repage-margin-left': String(attributes.marginLeft) }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'section[data-repage-page]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as Record<string, string | number>;
    const pageWidth = Number(attrs['data-repage-page-width']) || 595;
    const pageHeight = Number(attrs['data-repage-page-height']) || 842;
    const marginTop = Number(attrs['data-repage-margin-top']) || 42;
    const marginRight = Number(attrs['data-repage-margin-right']) || 42;
    const marginBottom = Number(attrs['data-repage-margin-bottom']) || 42;
    const marginLeft = Number(attrs['data-repage-margin-left']) || 42;

    return [
      'section',
      {
        'data-repage-page': 'true',
        ...HTMLAttributes,
        style: `width:${pageWidth}pt;min-height:${pageHeight}pt;box-sizing:border-box;padding:${marginTop}pt ${marginRight}pt ${marginBottom}pt ${marginLeft}pt;`,
      },
      0,
    ];
  },
});

const RePagePagedDocument = Document.extend({
  content: 'repagePage+',
});

const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: null,
        parseHTML: (element) => element.style.textAlign || element.getAttribute('align') || null,
        renderHTML: (attributes) => {
          if (!attributes.alignment) return {};
          return { style: `text-align: ${attributes.alignment}` };
        },
      },
      lineHeight: {
        default: null,
        parseHTML: (element) => element.style.lineHeight || null,
        renderHTML: (attributes) => {
          if (!attributes.lineHeight) return {};
          return { style: `line-height: ${attributes.lineHeight}` };
        },
      },
      spaceBefore: {
        default: null,
        parseHTML: (element) => element.style.marginTop || null,
        renderHTML: (attributes) => {
          if (attributes.spaceBefore === null || attributes.spaceBefore === undefined) return {};
          return { style: `margin-top: ${attributes.spaceBefore}pt` };
        },
      },
      spaceAfter: {
        default: null,
        parseHTML: (element) => element.style.marginBottom || null,
        renderHTML: (attributes) => {
          if (attributes.spaceAfter === null || attributes.spaceAfter === undefined) return {};
          return { style: `margin-bottom: ${attributes.spaceAfter}pt` };
        },
      },
    };
  },
});
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize } from './fontSizeExtension';
import { parseRandCommand, generateParagraphs } from '../../domain/unicode/urduRandGenerator';
import { FormattingMarksExtension } from './formattingMarksExtension';
import type { TextStory } from '../../domain/document/types';
import {
  canonicalToTiptapHtml,
  tiptapHtmlToCanonical,
} from '../../domain/rich-text/tiptapConverter';
import type { InlineNode, ParagraphNode, RichTextDocument } from '../../domain/rich-text/types';
import type { TextAlignment } from '../../domain/rich-text/types';
import { romanToUrdu } from '../../domain/language/transliteration';
import { getFontDefinition } from '../../domain/unicode/fontRegistry';
import { SmartDeletePreview } from './smartDeletePreview';
import { BidiVisualCursor } from './bidiVisualCursor';
import { Spellcheck } from './spellcheckExtension';
import { SpellcheckMenu } from './SpellcheckMenu';
import {
  COMPOSITE_FONT_FAMILY,
  updateCompositeFontRules,
  removeCompositeFontRules,
} from './compositeFontStyle';

import type { KeyboardMode } from '../../domain/unicode/keyboardLayouts';
import { mapKeyToUrduCharacter } from '../../domain/unicode/keyboardLayouts';

const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      bulletStyle: {
        default: 'disc',
        parseHTML: (element) => element.getAttribute('data-bullet-style') || 'disc',
        renderHTML: (attributes) => {
          const style = attributes.bulletStyle || 'disc';
          return {
            'data-bullet-style': style,
          };
        },
      },
      alignment: {
        default: null,
        parseHTML: (element) => element.style.textAlign || element.getAttribute('align') || null,
        renderHTML: (attributes) => {
          if (!attributes.alignment) return {};
          return {
            style: `text-align: ${attributes.alignment}`,
          };
        },
      },
    };
  },
});

const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      numberStyle: {
        default: 'decimal',
        parseHTML: (element) => element.getAttribute('data-number-style') || element.getAttribute('type') || 'decimal',
        renderHTML: (attributes) => {
          const style = attributes.numberStyle || 'decimal';
          const attrs: Record<string, string> = {
            'data-number-style': style,
          };
          if (style === 'lower-alpha') attrs.type = 'a';
          else if (style === 'upper-alpha') attrs.type = 'A';
          else if (style === 'lower-roman') attrs.type = 'i';
          else if (style === 'upper-roman') attrs.type = 'I';
          else if (style === 'decimal') attrs.type = '1';
          // Omit type attribute for 'urdu', 'abjad', 'decimal-paren', 'lower-alpha-paren'

          return attrs;
        },
      },
      alignment: {
        default: null,
        parseHTML: (element) => element.style.textAlign || element.getAttribute('align') || null,
        renderHTML: (attributes) => {
          if (!attributes.alignment) return {};
          return {
            style: `text-align: ${attributes.alignment}`,
          };
        },
      },
    };
  },
});

export interface PagedEditorLayout {
  pageWidth: number;
  pageHeight: number;
  margins: { top: number; right: number; bottom: number; left: number };
}

type PageFragment = 'single' | 'start' | 'middle' | 'end';

interface PaginatedParagraph {
  paragraph: ParagraphNode;
  fragment: PageFragment;
}

function paragraphText(paragraph: ParagraphNode): string {
  return paragraph.content.map((node) => (node.type === 'text' ? node.text : '\n')).join('');
}

function splitParagraph(paragraph: ParagraphNode, offset: number): [ParagraphNode, ParagraphNode] {
  const before: InlineNode[] = [];
  const after: InlineNode[] = [];
  let remaining = offset;

  for (const node of paragraph.content) {
    const length = node.type === 'text' ? node.text.length : 1;
    if (remaining <= 0) {
      after.push(node);
    } else if (remaining >= length) {
      before.push(node);
      remaining -= length;
    } else if (node.type === 'text') {
      before.push({ ...node, text: node.text.slice(0, remaining) });
      after.push({ ...node, text: node.text.slice(remaining) });
      remaining = 0;
    } else {
      before.push(node);
      remaining -= 1;
    }
  }

  return [{ ...paragraph, content: before }, { ...paragraph, content: after }];
}

function pageBreakOffset(text: string, proposed: number): number {
  const target = Math.max(1, Math.min(proposed, text.length - 1));
  for (let index = target; index > 0; index -= 1) {
    if (/\s/u.test(text[index] || '')) return index;
  }
  return target;
}

function paginateForEditor(
  content: RichTextDocument,
  layout: PagedEditorLayout,
  fontSize: number,
  lineHeight: number,
): PaginatedParagraph[][] {
  const printableWidth = Math.max(100, layout.pageWidth - layout.margins.left - layout.margins.right);
  const printableHeight = Math.max(100, layout.pageHeight - layout.margins.top - layout.margins.bottom);
  const charsPerLine = Math.max(15, Math.floor(printableWidth / Math.max(8, fontSize * 0.68)));
  const renderedLineHeight = Math.max(16, fontSize * lineHeight);
  const paragraphGap = 14;
  const pages: PaginatedParagraph[][] = [[]];
  let usedHeight = 0;

  for (const sourceParagraph of content.content) {
    let remainingParagraph = sourceParagraph;
    let hasSplit = false;

    while (true) {
      const text = paragraphText(remainingParagraph);
      const lineCount = Math.max(1, Math.ceil(text.length / charsPerLine));
      const neededHeight = lineCount * renderedLineHeight + paragraphGap;
      const availableHeight = printableHeight - usedHeight;

      if (neededHeight <= availableHeight || (usedHeight === 0 && neededHeight <= printableHeight)) {
        pages[pages.length - 1]!.push({
          paragraph: remainingParagraph,
          fragment: hasSplit ? 'end' : 'single',
        });
        usedHeight += neededHeight;
        break;
      }

      const linesThatFit = Math.floor((Math.max(0, availableHeight) - paragraphGap) / renderedLineHeight);
      const splitAt = text.length > 1 && linesThatFit >= 1
        ? pageBreakOffset(text, linesThatFit * charsPerLine)
        : 0;

      if (splitAt > 0) {
        const [currentPagePart, nextPagePart] = splitParagraph(remainingParagraph, splitAt);
        pages[pages.length - 1]!.push({
          paragraph: currentPagePart,
          fragment: hasSplit ? 'middle' : 'start',
        });
        pages.push([]);
        usedHeight = 0;
        remainingParagraph = nextPagePart;
        hasSplit = true;
      } else {
        pages.push([]);
        usedHeight = 0;
      }
    }
  }

  return pages;
}

function buildPagedEditorHtml(
  content: RichTextDocument,
  layout: PagedEditorLayout,
  fontSize: number,
  lineHeight: number,
): string {
  return paginateForEditor(content, layout, fontSize, lineHeight)
    .map((page) => {
      const pageHtml = page.map(({ paragraph: item, fragment }) => {
        const html = canonicalToTiptapHtml({ type: 'doc', content: [item] });
        return fragment === 'single'
          ? html
          : html.replace('<p ', `<p data-repage-fragment="${fragment}" `);
      }).join('');
      return `<section data-repage-page="true" data-repage-page-width="${layout.pageWidth}" data-repage-page-height="${layout.pageHeight}" data-repage-margin-top="${layout.margins.top}" data-repage-margin-right="${layout.margins.right}" data-repage-margin-bottom="${layout.margins.bottom}" data-repage-margin-left="${layout.margins.left}">${pageHtml || '<p dir="rtl"></p>'}</section>`;
    })
    .join('');
}

function textOffsetAtPosition(doc: any, position: number): number {
  return doc.textBetween(0, position, '').length;
}

function positionAtTextOffset(doc: any, targetOffset: number): number {
  let consumed = 0;
  let resolvedPosition = Math.max(1, doc.content.size - 1);
  doc.descendants((node: any, position: number) => {
    if (!node.isText) return true;
    const nodeText = node.text || '';
    if (targetOffset <= consumed + nodeText.length) {
      resolvedPosition = position + Math.max(0, targetOffset - consumed);
      return false;
    }
    consumed += nodeText.length;
    resolvedPosition = position + nodeText.length;
    return true;
  });
  return resolvedPosition;
}

export interface DocumentBodyEditorProps {
  story: TextStory;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  alignment?: TextAlignment;
  scale?: number;
  columns?: number;
  columnGap?: number;
  rtlColumnOrder?: boolean;
  pairedLatinFont?: string;
  disableUrduKeyMapping?: boolean;
  showFormattingMarks?: boolean;
  isTransliterationEnabled?: boolean;
  keyboardMode?: KeyboardMode;
  numeralSystem?: 'urdu' | 'western';
  pendingChar?: string | null;
  /** Increment to focus the editor after a click on unoccupied page space. */
  focusRequest?: number;
  pageLayout?: PagedEditorLayout | undefined;
  onCommit: (updatedContent: RichTextDocument) => void;
  onEditorReady?: ((editor: Editor | null) => void) | undefined;
  onSelectionChange?:
    | ((selectionInfo: {
        isBold: boolean;
        isItalic: boolean;
        isUnderline: boolean;
        isBulletList?: boolean;
        isOrderedList?: boolean;
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
  alignment = 'start',
  scale = 1,
  columns = 1,
  columnGap = 18,
  rtlColumnOrder = true,
  pairedLatinFont = 'Calibri',
  disableUrduKeyMapping = false,
  showFormattingMarks = false,
  isTransliterationEnabled = false,
  keyboardMode = 'crulp',
  numeralSystem = 'urdu',
  pendingChar,
  focusRequest = 0,
  pageLayout,
  onCommit,
  onEditorReady,
  onSelectionChange,
}: DocumentBodyEditorProps) {
  const fontDef = getFontDefinition(fontFamily);
  const pageWidth = pageLayout?.pageWidth;
  const pageHeight = pageLayout?.pageHeight;
  const pageMarginTop = pageLayout?.margins.top;
  const pageMarginRight = pageLayout?.margins.right;
  const pageMarginBottom = pageLayout?.margins.bottom;
  const pageMarginLeft = pageLayout?.margins.left;
  const stablePageLayout = React.useMemo(() => {
    if (
      pageWidth === undefined ||
      pageHeight === undefined ||
      pageMarginTop === undefined ||
      pageMarginRight === undefined ||
      pageMarginBottom === undefined ||
      pageMarginLeft === undefined
    ) {
      return undefined;
    }

    return {
      pageWidth,
      pageHeight,
      margins: {
        top: pageMarginTop,
        right: pageMarginRight,
        bottom: pageMarginBottom,
        left: pageMarginLeft,
      },
    };
  }, [pageHeight, pageMarginBottom, pageMarginLeft, pageMarginRight, pageMarginTop, pageWidth]);
  const renderEditorHtml = React.useCallback(
    (content: RichTextDocument) => stablePageLayout
      ? buildPagedEditorHtml(content, stablePageLayout, fontSize, lineHeight)
      : canonicalToTiptapHtml(content),
    [fontSize, lineHeight, stablePageLayout],
  );
  const initialHtml = renderEditorHtml(story.content);

  // Smart font pairing: update composite @font-face rules whenever fonts change
  useEffect(() => {
    updateCompositeFontRules(fontFamily, pairedLatinFont);
    return () => removeCompositeFontRules();
  }, [fontFamily, pairedLatinFont]);

  // Build composite font-family CSS value: composite first, then Urdu fallback
  const compositeFontCss = `'${COMPOSITE_FONT_FAMILY}', ${fontDef.family}`;

  const keyboardModeRef = React.useRef(keyboardMode);
  const numeralSystemRef = React.useRef(numeralSystem);
  const disableUrduKeyMappingRef = React.useRef(disableUrduKeyMapping);
  const isTransliterationEnabledRef = React.useRef(isTransliterationEnabled);
  const isSelfCommittingRef = React.useRef(false);
  const lastAppliedPagedHtmlRef = React.useRef(initialHtml);

  useEffect(() => {
    keyboardModeRef.current = keyboardMode;
    numeralSystemRef.current = numeralSystem;
    disableUrduKeyMappingRef.current = disableUrduKeyMapping;
    isTransliterationEnabledRef.current = isTransliterationEnabled;
  }, [keyboardMode, numeralSystem, disableUrduKeyMapping, isTransliterationEnabled]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        ...(stablePageLayout ? { document: false } : {}),
        paragraph: false,
        heading: false,
        bulletList: false,
        orderedList: false,
      }),
      ...(stablePageLayout ? [RePagePagedDocument, RePagePage] : []),
      CustomParagraph,
      CustomHeading,
      CustomBulletList,
      CustomOrderedList,
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      FormattingMarksExtension,
      SmartDeletePreview,
      BidiVisualCursor,
      Spellcheck,
    ],
    content: initialHtml,
    autofocus: false,
    editorProps: {
      handleKeyDown: (view, event) => {
        if (stablePageLayout && (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'a') {
          event.preventDefault();
          view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, view.state.doc.content.size - 1)));
          return true;
        }
        if (!event.ctrlKey && !event.altKey && !event.metaKey) {
          if (event.key === 'Tab') {
            event.preventDefault();
            const { from, to } = view.state.selection;
            view.dispatch(view.state.tr.insertText('\t', from, to));
            return true;
          }

          // Random Paragraph Generator Engine (=rand(), =rand(p,s), =متن(), =متن(p,s), =متن(p،s))
          if (event.key === 'Enter') {
            const { $from } = view.state.selection;
            const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
            const randCmd = parseRandCommand(textBefore);
            if (randCmd) {
              event.preventDefault();
              const commandLength = randCmd.fullMatch.length;
              const startPos = $from.pos - commandLength;
              const endPos = $from.pos;
              const paras = generateParagraphs(randCmd.lang, randCmd.paragraphsCount, randCmd.sentencesCount);

              const paragraphType = view.state.schema.nodes.paragraph;
              if (paragraphType && paras.length > 0) {
                let tr = view.state.tr.delete(startPos, endPos);
                const firstParaText = paras[0] || '';
                tr = tr.insertText(firstParaText, startPos);

                const currentParaPos = tr.doc.resolve(startPos).before(1);
                if (currentParaPos >= 0) {
                  tr = tr.setNodeMarkup(currentParaPos, undefined, {
                    ...tr.doc.nodeAt(currentParaPos)?.attrs,
                    alignment: randCmd.lang === 'ur' ? 'right' : 'left',
                    lineHeight: randCmd.lang === 'ur' ? 1.5 : 1.15,
                  });
                }

                if (paras.length > 1) {
                  const remainingNodes = paras.slice(1).map((pText) =>
                    paragraphType.create(
                      {
                        alignment: randCmd.lang === 'ur' ? 'right' : 'left',
                        lineHeight: randCmd.lang === 'ur' ? 1.5 : 1.15,
                      },
                      view.state.schema.text(pText)
                    )
                  );

                  const paraEnd = tr.doc.resolve(startPos + firstParaText.length).after(1);
                  tr = tr.insert(paraEnd, remainingNodes);
                }

                view.dispatch(tr);
                return true;
              }
            }
          }

          // Real-time Roman Urdu transliteration mode
          if (isTransliterationEnabledRef.current && (event.key === ' ' || event.key === 'Enter' || [',', '.', '?', '!', ';', ':'].includes(event.key))) {
            const { $from } = view.state.selection;
            const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
            const match = textBefore.match(/([a-zA-Z]+)$/);
            if (match && match[1]) {
              const romanWord = match[1];
              const urduConverted = romanToUrdu(romanWord);
              if (urduConverted && urduConverted !== romanWord) {
                event.preventDefault();
                const wordStart = $from.pos - romanWord.length;
                const wordEnd = $from.pos;
                const delimiter = event.key === '?' ? '؟' : event.key === ',' ? '،' : event.key === ';' ? '؛' : event.key === 'Enter' ? '\n' : event.key;
                const tr = view.state.tr.replaceWith(wordStart, wordEnd, view.state.schema.text(urduConverted + delimiter));
                view.dispatch(tr);
                return true;
              }
            }
          }

          // Skip Urdu keyboard mapping when writing in English mode
          if (!disableUrduKeyMappingRef.current) {
            const mode = keyboardModeRef.current;
            const numSys = numeralSystemRef.current;
            if (event.key.length === 1) {
              const mapped = mapKeyToUrduCharacter(event.key, mode, event.shiftKey, numSys);
              if (mapped) {
                event.preventDefault();
                const { from, to } = view.state.selection;
                view.dispatch(view.state.tr.insertText(mapped, from, to));
                return true;
              }
            }
          }
        }
        return false;
      },
      attributes: {
        dir: rtlColumnOrder ? 'rtl' : 'ltr',
        spellcheck: 'false',
        class: showFormattingMarks ? 'show-formatting-marks' : '',
        style: `
          font-family: ${compositeFontCss};
          font-size: ${fontSize * scale}px;
          color: ${color};
          line-height: ${lineHeight};
          outline: none;
          min-height: 100%;
          direction: ${rtlColumnOrder ? 'rtl' : 'ltr'};
          text-align: ${alignment === 'center' ? 'center' : alignment === 'justify' ? 'justify' : alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : rtlColumnOrder ? 'right' : 'left'};
          padding: 0;
          margin: 0;
          ${!stablePageLayout && columns > 1 ? `column-count: ${columns}; column-gap: ${columnGap}pt; column-fill: auto;` : ''}
        `,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      isSelfCommittingRef.current = true;
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
        isBulletList: currentEditor.isActive('bulletList'),
        isOrderedList: currentEditor.isActive('orderedList'),
        fontFamily: currentEditor.getAttributes('textStyle').fontFamily || fontFamily,
        fontSize: typeof currentEditor.getAttributes('textStyle').fontSize === 'number'
          ? currentEditor.getAttributes('textStyle').fontSize
          : parseFloat(String(currentEditor.getAttributes('textStyle').fontSize)) || fontSize,
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
    if (editor) {
      if (isSelfCommittingRef.current && !stablePageLayout) {
        isSelfCommittingRef.current = false;
        return;
      }
      isSelfCommittingRef.current = false;
      const newHtml = renderEditorHtml(story.content);
      if (stablePageLayout && lastAppliedPagedHtmlRef.current === newHtml) {
        return;
      }
      if (editor.getHTML() !== newHtml) {
        const { from, to } = editor.state.selection;
        const fromOffset = textOffsetAtPosition(editor.state.doc, from);
        const toOffset = textOffsetAtPosition(editor.state.doc, to);
        editor.commands.setContent(newHtml, { emitUpdate: false });
        editor.commands.setTextSelection({
          from: positionAtTextOffset(editor.state.doc, fromOffset),
          to: positionAtTextOffset(editor.state.doc, toOffset),
        });
      }
      if (stablePageLayout) {
        lastAppliedPagedHtmlRef.current = newHtml;
      }
    }
  }, [editor, renderEditorHtml, stablePageLayout, story.content]);

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
      <SpellcheckMenu editor={editor} />
    </div>
  );
}
