import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { RepageBreak } from './repageBreakExtension';
import { paginateForEditor } from './DocumentBodyEditor';
import {
  canonicalToTiptapHtml,
  tiptapHtmlToCanonical,
} from '../../domain/rich-text/tiptapConverter';
import type { RichTextDocument } from '../../domain/rich-text/types';

const LAYOUT = {
  pageWidth: 595,
  pageHeight: 842,
  margins: { top: 42, right: 42, bottom: 42, left: 42 },
};

function paragraphTextOf(pages: ReturnType<typeof paginateForEditor>): string[][] {
  return pages.map((page) =>
    page.map(({ paragraph }) =>
      paragraph.content.map((n) => (n.type === 'text' ? n.text : '')).join(''),
    ),
  );
}

describe('paginateForEditor — explicit breaks', () => {
  it('splits a paragraph at a page break across two editor pages', () => {
    const content: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          direction: 'rtl',
          content: [
            { type: 'text', text: 'آغاز' },
            { type: 'break', breakType: 'page' },
            { type: 'text', text: 'اختتام' },
          ],
        },
      ],
    };
    const pages = paginateForEditor(content, LAYOUT, 20, 1.8);
    expect(pages).toHaveLength(2);
    expect(paragraphTextOf(pages)).toEqual([['آغاز'], ['اختتام']]);
    // The break node rides at the end of the pre-break fragment (marker
    // shows on the first page; fragment merging restores it in place).
    const firstFragment = pages[0]![0]!;
    expect(firstFragment.fragment).toBe('start');
    expect(firstFragment.paragraph.content[firstFragment.paragraph.content.length - 1]).toEqual({
      type: 'break',
      breakType: 'page',
    });
    expect(pages[1]![0]!.fragment).toBe('end');
  });

  it('a column break also advances to the next editor page (one column per page)', () => {
    const content: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          direction: 'rtl',
          content: [
            { type: 'text', text: 'ایک' },
            { type: 'break', breakType: 'column' },
            { type: 'text', text: 'دو' },
          ],
        },
      ],
    };
    const pages = paginateForEditor(content, LAYOUT, 20, 1.8);
    expect(pages).toHaveLength(2);
    expect(paragraphTextOf(pages)).toEqual([['ایک'], ['دو']]);
  });

  it('pageBreakBefore opens a fresh page; without it both paragraphs share page 1', () => {
    const flagged: RichTextDocument = {
      type: 'doc',
      content: [
        { type: 'paragraph', direction: 'rtl', content: [{ type: 'text', text: 'پہلا' }] },
        {
          type: 'paragraph',
          direction: 'rtl',
          pageBreakBefore: true,
          content: [{ type: 'text', text: 'دوسرا' }],
        },
      ],
    };
    const pages = paginateForEditor(flagged, LAYOUT, 20, 1.8);
    expect(pages).toHaveLength(2);
    expect(paragraphTextOf(pages)).toEqual([['پہلا'], ['دوسرا']]);

    const plain: RichTextDocument = {
      type: 'doc',
      content: [
        { type: 'paragraph', direction: 'rtl', content: [{ type: 'text', text: 'پہلا' }] },
        { type: 'paragraph', direction: 'rtl', content: [{ type: 'text', text: 'دوسرا' }] },
      ],
    };
    expect(paginateForEditor(plain, LAYOUT, 20, 1.8)).toHaveLength(1);
  });
});

describe('RepageBreak tiptap node', () => {
  it('parses the converter marker span, inserts via command, and round-trips to canonical', () => {
    const canonical: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          direction: 'rtl',
          content: [
            { type: 'text', text: 'شروع ' },
            { type: 'break', breakType: 'page' },
            { type: 'text', text: ' آخر' },
          ],
        },
      ],
    };

    const editor = new Editor({
      extensions: [StarterKit, RepageBreak],
      content: canonicalToTiptapHtml(canonical),
    });

    try {
      // The marker span became an atom node, not text.
      const json = editor.getJSON();
      const paraJson = json.content![0]!;
      expect(paraJson.content!.map((n) => n.type)).toEqual(['text', 'repageBreak', 'text']);
      const breakJson = paraJson.content![1] as unknown as {
        attrs?: { breakType?: string };
      };
      expect(breakJson.attrs).toMatchObject({ breakType: 'page' });

      // The rendered marker carries both labels (CSS shows one) and the
      // label text is NOT editor text.
      const html = editor.getHTML();
      expect(html).toContain('data-repage-break="page"');
      expect(html).toContain('repage-break-marker');
      expect(editor.getText()).not.toContain('Page Break');

      // Inserting a column break at the end adds a second atom.
      editor.commands.selectTextblockEnd();
      editor.commands.insertRepageBreak('column');
      const html2 = editor.getHTML();
      expect(html2).toContain('data-repage-break="column"');

      // Full round trip back to the canonical model.
      const back = tiptapHtmlToCanonical(html2, 'rtl');
      const kinds = back.content[0]!.content.map((n) => n.type);
      expect(kinds).toEqual(['text', 'break', 'text', 'break']);
      expect(back.content[0]!.content[1]).toEqual({ type: 'break', breakType: 'page' });
      expect(back.content[0]!.content[3]).toEqual({ type: 'break', breakType: 'column' });
    } finally {
      editor.destroy();
    }
  });
});
