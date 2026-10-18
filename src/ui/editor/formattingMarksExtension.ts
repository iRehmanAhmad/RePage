import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const FormattingMarksExtension = Extension.create({
  name: 'formattingMarks',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('formattingMarksPlugin'),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const { doc } = state;

            doc.descendants((node, pos) => {
              if (node.isTextblock) {
                const el = document.createElement('span');
                el.className = 'formatting-mark-paragraph';
                el.textContent = ' ¶';
                decorations.push(Decoration.widget(pos + 1 + node.content.size, el, { side: -1 }));
              }

              if (node.isText && node.text) {
                const text = node.text;
                for (let i = 0; i < text.length; i++) {
                  const char = text[i];
                  if (char === ' ') {
                    decorations.push(
                      Decoration.inline(pos + i, pos + i + 1, {
                        class: 'formatting-space-char',
                      })
                    );
                  } else if (char === '\t') {
                    decorations.push(
                      Decoration.inline(pos + i, pos + i + 1, {
                        class: 'formatting-tab-char',
                      })
                    );
                  }
                }
              } else if (node.type.name === 'hardBreak') {
                const el = document.createElement('span');
                el.className = 'formatting-mark-break';
                el.textContent = '↵';
                decorations.push(Decoration.widget(pos, el, { side: 1 }));
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
