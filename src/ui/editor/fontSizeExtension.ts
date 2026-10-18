import { Extension } from '@tiptap/core';

export interface FontSizeOptions {
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Extension.create<FontSizeOptions>({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => {
              const raw = element.style.fontSize;
              if (!raw) return null;
              const parsed = parseFloat(raw);
              return isNaN(parsed) ? null : parsed;
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              const parsed = parseFloat(String(attributes.fontSize));
              if (isNaN(parsed)) return {};
              return {
                style: `font-size: ${parsed}pt`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          const parsed = parseFloat(String(fontSize));
          if (isNaN(parsed)) return false;
          return chain().setMark('textStyle', { fontSize: parsed }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});
