import { Node, mergeAttributes } from '@tiptap/core';

export type RepageBreakType = 'page' | 'column';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    repageBreak: {
      /** Inserts an explicit page/column break atom at the caret. */
      insertRepageBreak: (breakType: RepageBreakType) => ReturnType;
    };
  }
}

/**
 * Editor-side labels for the break marker. The marker element carries BOTH
 * labels in data attributes; global.css picks one by direction context
 * ([dir=rtl] shows Urdu). The label is CSS-generated content only — it is
 * never part of the document, so it cannot print or leak into story text.
 */
export const BREAK_MARKER_LABELS: Record<
  RepageBreakType,
  { en: string; ur: string }
> = {
  page: { en: '— Page Break —', ur: '— صفحہ بریک —' },
  column: { en: '— Column Break —', ur: '— کالم بریک —' },
};

/**
 * Inline atom node for the canonical BreakNode ({ type: 'break' }).
 *
 * It mirrors how the canonical model treats hardBreak: a zero-width inline
 * leaf. The canonical <-> editor HTML converters map it to
 * `<span data-repage-break="page|column"></span>`; this node's parse/render
 * rules use the same attribute, so the node survives the round trip.
 *
 * Shortcuts: Ctrl/Cmd+Enter inserts a page break, Ctrl/Cmd+Shift+Enter a
 * column break. The extension carries a high priority so its keymap wins
 * over StarterKit's HardBreak Mod-Enter binding; both editors additionally
 * intercept the keys in their handleKeyDown (the codebase's established
 * pattern), which is the deterministic path.
 */
export const RepageBreak = Node.create({
  name: 'repageBreak',
  priority: 1000,
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      breakType: {
        default: 'page',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-repage-break') === 'column' ? 'column' : 'page',
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-repage-break': attributes.breakType === 'column' ? 'column' : 'page',
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-repage-break]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const breakType: RepageBreakType =
      node.attrs.breakType === 'column' ? 'column' : 'page';
    const labels = BREAK_MARKER_LABELS[breakType];
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'repage-break-marker',
        contenteditable: 'false',
        'data-label-en': labels.en,
        'data-label-ur': labels.ur,
      }),
    ];
  },

  addCommands() {
    return {
      insertRepageBreak:
        (breakType: RepageBreakType) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { breakType },
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.insertRepageBreak('page'),
      'Mod-Shift-Enter': () => this.editor.commands.insertRepageBreak('column'),
    };
  },
});
