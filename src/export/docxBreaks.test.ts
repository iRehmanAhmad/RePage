import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { exportDocumentToDocx } from './docxExporter';
import { createDocument, PRIMARY_STORY_ID } from '../domain/document/createDocument';
import { parseDocxFile, type DocxBlock } from '../persistence/import/docxParser';
import type { ParagraphNode } from '../domain/rich-text/types';
import type { RePageDocument } from '../domain/document/types';

function buildBreakDocument(): RePageDocument {
  const doc = createDocument('Breaks Test');
  const paragraphs: ParagraphNode[] = [
    {
      type: 'paragraph',
      direction: 'rtl',
      alignment: 'start',
      content: [
        { type: 'text', text: 'قبل ' },
        { type: 'break', breakType: 'page' },
        { type: 'text', text: 'بعد' },
        { type: 'break', breakType: 'column' },
        { type: 'text', text: ' آخر' },
      ],
    },
    {
      type: 'paragraph',
      direction: 'rtl',
      alignment: 'start',
      pageBreakBefore: true,
      content: [{ type: 'text', text: 'نیا صفحہ' }],
    },
  ];
  return {
    ...doc,
    stories: {
      ...doc.stories,
      [PRIMARY_STORY_ID]: {
        id: PRIMARY_STORY_ID,
        name: 'Primary Document Story',
        content: { type: 'doc', content: paragraphs },
      },
    },
  };
}

describe('DOCX export — explicit breaks', () => {
  it('emits typed break runs and w:pageBreakBefore', async () => {
    const { bytes } = await exportDocumentToDocx(buildBreakDocument());
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');

    expect(xml).toContain('<w:br w:type="page"/>');
    expect(xml).toContain('<w:br w:type="column"/>');
    expect(xml).toContain('<w:pageBreakBefore/>');
  });

  it('round-trips through the parser: break nodes and the flag survive', async () => {
    const { bytes } = await exportDocumentToDocx(buildBreakDocument());
    const parsed = await parseDocxFile(bytes);
    const paras = parsed.blocks
      .filter((b: DocxBlock) => b.kind === 'paragraph')
      .map((b) => (b as { node: ParagraphNode }).node);

    const first = paras[0]!;
    expect(first.content.map((n) => n.type)).toEqual([
      'text',
      'break',
      'text',
      'break',
      'text',
    ]);
    expect(first.content[1]).toEqual({ type: 'break', breakType: 'page' });
    expect(first.content[3]).toEqual({ type: 'break', breakType: 'column' });

    const second = paras.find((p) => p.pageBreakBefore === true);
    expect(second).toBeDefined();
  });
});
