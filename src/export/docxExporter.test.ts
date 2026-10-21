import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { exportDocumentToDocx, getDefaultDocxFileName } from './docxExporter';
import { createDocument, PRIMARY_STORY_ID } from '../domain/document/createDocument';
import { addImageFrame } from '../editor/commands/documentCommands';
import { addImportedTable } from '../editor/commands/objectCommands';
import { parseDocxFile, type DocxBlock } from '../persistence/import/docxParser';
import { importDocxFile } from '../persistence/import/docxImporter';
import type { ParagraphNode } from '../domain/rich-text/types';
import type { RePageDocument } from '../domain/document/types';

/**
 * Round-trip is the oracle for the DOCX exporter: export a canonical
 * document, re-import the bytes with the existing parser/importer, and
 * compare. Urdu text must survive byte-identical (ZWNJ + aerab included).
 */

// kasra (U+0650) aerab + ZWNJ (U+200C) embedded on purpose.
const URDU_TEXT = 'یہ میری ک\u0650تاب ہے\u200C، اور یہ ایک آزمائشی جملہ ہے۔';
const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function buildTestDocument(): RePageDocument {
  let doc = createDocument('Round Trip Test');
  const pageId = doc.pageOrder[0]!;

  const paragraphs: ParagraphNode[] = [
    {
      type: 'paragraph',
      direction: 'rtl',
      alignment: 'start',
      styleId: 'heading1',
      content: [{ type: 'text', text: 'باب اول', marks: [{ type: 'bold' }] }],
    },
    {
      type: 'paragraph',
      direction: 'rtl',
      alignment: 'start',
      content: [
        { type: 'text', text: 'آغاز: ' },
        {
          type: 'text',
          text: URDU_TEXT,
          marks: [
            { type: 'bold' },
            { type: 'fontSize', size: 16 },
            { type: 'color', color: '#C00000' },
            { type: 'fontFamily', family: 'Noto Nastaliq Urdu' },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      direction: 'ltr',
      alignment: 'left',
      content: [
        { type: 'text', text: 'This is ' },
        { type: 'text', text: 'English', marks: [{ type: 'italic' }] },
        { type: 'text', text: ' text.' },
      ],
    },
  ];
  doc = {
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

  const tableRes = addImportedTable(
    doc,
    pageId,
    {
      rows: [
        [
          {
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  direction: 'rtl',
                  alignment: 'start',
                  content: [{ type: 'text', text: 'خانہ اول' }],
                },
              ],
            },
            colSpan: 1,
            rowSpan: 1,
            backgroundColor: '#FDE68A',
          },
          {
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  direction: 'ltr',
                  alignment: 'start',
                  content: [{ type: 'text', text: 'Cell B' }],
                },
              ],
            },
            colSpan: 1,
            rowSpan: 1,
          },
        ],
        [
          {
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  direction: 'rtl',
                  alignment: 'start',
                  content: [{ type: 'text', text: 'خانہ سوم' }],
                },
              ],
            },
            colSpan: 1,
            rowSpan: 1,
          },
          {
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  direction: 'ltr',
                  alignment: 'start',
                  content: [{ type: 'text', text: 'Cell D' }],
                },
              ],
            },
            colSpan: 1,
            rowSpan: 1,
          },
        ],
      ],
    },
    { x: 40, y: 40, width: 400, name: 'Test table' },
  );
  doc = tableRes.document;

  const imgRes = addImageFrame(doc, pageId, 'pixel.png', PNG_DATA_URL, 120, 90);
  doc = imgRes.document;
  return doc;
}

function paragraphText(node: ParagraphNode): string {
  return node.content.map((n) => (n.type === 'text' ? n.text : '')).join('');
}

function paragraphBlocks(blocks: DocxBlock[]): ParagraphNode[] {
  return blocks.filter((b) => b.kind === 'paragraph').map((b) => (b as { node: ParagraphNode }).node);
}

describe('exportDocumentToDocx', () => {
  it('produces a valid package with all required parts', async () => {
    const doc = buildTestDocument();
    const { bytes, fileName, report } = await exportDocumentToDocx(doc);

    expect(fileName).toBe('Round Trip Test.docx');
    expect(bytes.length).toBeGreaterThan(0);
    expect(report.tableCount).toBe(1);
    expect(report.imageCount).toBe(1);
    expect(report.headingCount).toBe(1);
    expect(report.paragraphCount).toBeGreaterThanOrEqual(3);

    const zip = await JSZip.loadAsync(bytes);
    for (const part of [
      '[Content_Types].xml',
      '_rels/.rels',
      'word/document.xml',
      'word/styles.xml',
      'word/_rels/document.xml.rels',
      'word/media/image1.png',
    ]) {
      expect(zip.file(part), `missing part ${part}`).not.toBeNull();
    }
  });

  it('marks Urdu paragraphs with w:bidi and runs with w:rtl + ur-PK', async () => {
    const doc = buildTestDocument();
    const { bytes } = await exportDocumentToDocx(doc);
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('<w:bidi/>');
    expect(xml).toContain('<w:rtl/>');
    expect(xml).toContain('w:bidi="ur-PK"');
    expect(xml).toContain('<w:pStyle w:val="Heading1"/>');
    // A4 section setup in twips (595.28pt x 20 = 11906)
    expect(xml).toContain('<w:pgSz w:w="11906" w:h="16838"');
  });

  it('round-trips through the existing parser: text byte-identical, marks and table survive', async () => {
    const doc = buildTestDocument();
    const { bytes } = await exportDocumentToDocx(doc);
    const parsed = await parseDocxFile(bytes);

    const paras = paragraphBlocks(parsed.blocks);

    // Heading style survives.
    const heading = paras.find((p) => p.styleId === 'heading1');
    expect(heading).toBeDefined();
    expect(paragraphText(heading!)).toBe('باب اول');

    // Urdu text byte-identical (ZWNJ + aerab), styled run marks survive.
    const urduPara = paras.find((p) => paragraphText(p).includes('آغاز'));
    expect(urduPara).toBeDefined();
    expect(paragraphText(urduPara!)).toContain(URDU_TEXT);
    const styledRun = urduPara!.content.find(
      (n) => n.type === 'text' && n.text === URDU_TEXT,
    ) as { marks?: Array<{ type: string; size?: number; color?: string; family?: string }> } | undefined;
    expect(styledRun).toBeDefined();
    const markTypes = (styledRun!.marks ?? []).map((m) => m.type);
    expect(markTypes).toContain('bold');
    expect(styledRun!.marks!.find((m) => m.type === 'fontSize')?.size).toBe(16);
    expect(styledRun!.marks!.find((m) => m.type === 'color')?.color).toBe('#C00000');
    expect(styledRun!.marks!.find((m) => m.type === 'fontFamily')?.family).toBe('Noto Nastaliq Urdu');
    expect(urduPara!.direction).toBe('rtl');

    // English paragraph survives with italic.
    const enPara = paras.find((p) => paragraphText(p).startsWith('This is'));
    expect(enPara).toBeDefined();
    expect(paragraphText(enPara!)).toBe('This is English text.');
    const italicRun = enPara!.content.find((n) => n.type === 'text' && n.text === 'English') as
      | { marks?: Array<{ type: string }> }
      | undefined;
    expect((italicRun!.marks ?? []).map((m) => m.type)).toContain('italic');

    // Table survives with cell text + shading.
    const tableBlock = parsed.blocks.find((b) => b.kind === 'table') as
      | { table: { rows: Array<Array<{ content: { content: ParagraphNode[] }; backgroundColor?: string }>> } }
      | undefined;
    expect(tableBlock).toBeDefined();
    const cell00 = tableBlock!.table.rows[0]![0]!;
    expect(paragraphText(cell00.content.content[0]!)).toBe('خانہ اول');
    expect(cell00.backgroundColor).toBe('#FDE68A');
    expect(paragraphText(tableBlock!.table.rows[1]![1]!.content.content[0]!)).toBe('Cell D');

    // Image survives as a sniffed PNG asset.
    expect(parsed.images).toHaveLength(1);
    expect(parsed.images[0]!.mediaType).toBe('image/png');
    expect(parsed.warnings).toEqual([]);
  });

  it('round-trips through the full importer into a valid document', async () => {
    const doc = buildTestDocument();
    const { bytes } = await exportDocumentToDocx(doc);
    const { document: imported, report } = await importDocxFile(bytes, 'round-trip.docx');
    expect(report.tableCount).toBe(1);
    expect(report.imageCount).toBe(1);
    const allText = Object.values(imported.stories)
      .flatMap((s) => s.content.content.map((p) => paragraphText(p)))
      .join('\n');
    expect(allText).toContain(URDU_TEXT);
    expect(allText).toContain('باب اول');
  });

  it('exports a minimal document to a valid, parseable package', async () => {
    const doc = createDocument('Empty Doc');
    const { bytes, report } = await exportDocumentToDocx(doc);
    expect(bytes.length).toBeGreaterThan(0);
    expect(report.tableCount).toBe(0);
    expect(report.imageCount).toBe(0);
    const parsed = await parseDocxFile(bytes);
    expect(parsed.warnings).toEqual([]);
    const { document: imported } = await importDocxFile(bytes, 'empty.docx');
    expect(imported.pageOrder.length).toBeGreaterThanOrEqual(1);
  });

  it('sanitizes the default file name', () => {
    const doc = createDocument('My / Weird: Title');
    expect(getDefaultDocxFileName(doc)).toBe('My Weird Title.docx');
  });
});
