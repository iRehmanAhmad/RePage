import { describe, expect, it } from 'vitest';
import { createStarterDocument, PRIMARY_STORY_ID } from '../document/createDocument';
import { documentSchema } from '../document/schema';
import {
  canonicalToTiptapHtml,
  tiptapHtmlToCanonical,
} from './tiptapConverter';
import {
  parseRichText,
  richTextDocumentSchema,
  type RichTextDocument,
} from './types';

const DOC_WITH_BREAKS: RichTextDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      direction: 'rtl',
      alignment: 'start',
      content: [
        { type: 'text', text: 'پہلا حصہ ' },
        { type: 'break', breakType: 'page' },
        { type: 'text', text: 'دوسرا حصہ' },
        { type: 'break', breakType: 'column' },
        { type: 'text', text: 'تیسرا حصہ' },
      ],
    },
    {
      type: 'paragraph',
      direction: 'rtl',
      pageBreakBefore: true,
      content: [{ type: 'text', text: 'نیا صفحہ پیراگراف' }],
    },
  ],
};

describe('break node model (zod)', () => {
  it('validates break nodes and pageBreakBefore', () => {
    const parsed = parseRichText(JSON.parse(JSON.stringify(DOC_WITH_BREAKS)));
    expect(parsed.content[0]!.content[1]).toEqual({ type: 'break', breakType: 'page' });
    expect(parsed.content[0]!.content[3]).toEqual({ type: 'break', breakType: 'column' });
    expect(parsed.content[1]!.pageBreakBefore).toBe(true);
  });

  it('rejects an unknown break type', () => {
    const bad = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'break', breakType: 'chapter' }] },
      ],
    };
    expect(() => richTextDocumentSchema.parse(bad)).toThrow();
  });

  it('old documents without the new fields still validate', () => {
    const old = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'پرانا متن' }] }],
    };
    expect(() => richTextDocumentSchema.parse(old)).not.toThrow();
  });
});

describe('break node HTML round trip (editor converters)', () => {
  it('canonical -> HTML carries marker spans and the break-before attribute', () => {
    const html = canonicalToTiptapHtml(DOC_WITH_BREAKS);
    expect(html).toContain('<span data-repage-break="page"></span>');
    expect(html).toContain('<span data-repage-break="column"></span>');
    expect(html).toContain('data-page-break-before="true"');
  });

  it('HTML -> canonical restores break nodes and the flag in place', () => {
    const html = canonicalToTiptapHtml(DOC_WITH_BREAKS);
    const back = tiptapHtmlToCanonical(html, 'rtl');

    const first = back.content[0]!;
    expect(first.content.map((n) => n.type)).toEqual([
      'text',
      'break',
      'text',
      'break',
      'text',
    ]);
    expect(first.content[1]).toEqual({ type: 'break', breakType: 'page' });
    expect(first.content[3]).toEqual({ type: 'break', breakType: 'column' });
    expect(first.content[0]).toMatchObject({ type: 'text', text: 'پہلا حصہ ' });
    expect(first.content[4]).toMatchObject({ type: 'text', text: 'تیسرا حصہ' });
    expect(back.content[1]!.pageBreakBefore).toBe(true);
  });
});

describe('document package round trip', () => {
  it('a document with breaks + odd-page section survives schema validation', () => {
    const doc = createStarterDocument();
    const story = doc.stories[PRIMARY_STORY_ID]!;
    const withBreaks = {
      ...doc,
      stories: {
        ...doc.stories,
        [PRIMARY_STORY_ID]: {
          ...story,
          content: JSON.parse(JSON.stringify(DOC_WITH_BREAKS)),
        },
      },
      sections: [
        {
          id: 'sec-1',
          startPageId: doc.pageOrder[0]!,
          breakType: 'odd-page' as const,
          columns: 1 as const,
          columnGap: 18,
          rtlColumnOrder: true,
          pageNumbering: { style: 'urdu' as const, startAt: 1, restartAtSection: false, prefix: '', suffix: '' },
        },
      ],
    };

    const parsed = documentSchema.parse(JSON.parse(JSON.stringify(withBreaks)));
    const parsedStory = parsed.stories[PRIMARY_STORY_ID]!;
    expect(parsedStory.content.content[0]!.content[1]).toEqual({
      type: 'break',
      breakType: 'page',
    });
    expect(parsedStory.content.content[1]!.pageBreakBefore).toBe(true);
    expect(parsed.sections![0]!.breakType).toBe('odd-page');
  });
});
