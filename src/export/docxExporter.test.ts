import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { exportDocumentToDocx, getDefaultDocxFileName } from './docxExporter';
import { createDocument, PRIMARY_STORY_ID } from '../domain/document/createDocument';
import { addImageFrame } from '../editor/commands/documentCommands';
import {
  addImportedTable,
  setImageAdjustmentsCommand,
  setImageCropCommand,
} from '../editor/commands/objectCommands';
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

describe('exportDocumentToDocx image crop', () => {
  function docWithCroppedImage(crop: boolean): RePageDocument {
    const doc = createDocument('Crop Test');
    const pageId = doc.pageOrder[0]!;
    const imgRes = addImageFrame(doc, pageId, 'pixel.png', PNG_DATA_URL, 120, 90);
    if (!crop) return imgRes.document;
    return setImageCropCommand(imgRes.document, imgRes.objectId, {
      left: 0.1,
      top: 0.05,
      right: 0.2,
      bottom: 0,
    });
  }

  it('emits a:srcRect with the stored insets for a cropped image', async () => {
    const { bytes } = await exportDocumentToDocx(docWithCroppedImage(true));
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('<a:srcRect l="10000" t="5000" r="20000" b="0"/>');
    // The image bytes are embedded whole (crop is metadata, not a re-encode).
    expect(zip.file('word/media/image1.png')).not.toBeNull();
  });

  it('omits srcRect for an uncropped image', async () => {
    const { bytes } = await exportDocumentToDocx(docWithCroppedImage(false));
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).not.toContain('srcRect');
  });
});

describe('exportDocumentToDocx batch 11 (kashida + image adjustments)', () => {
  function docWithJustifiedParagraph(mode?: 'space' | 'kashida'): RePageDocument {
    const doc = createDocument('Kashida Test');
    const paragraphs: ParagraphNode[] = [
      {
        type: 'paragraph',
        direction: 'rtl',
        alignment: 'justify',
        ...(mode ? { justificationMode: mode } : {}),
        content: [{ type: 'text', text: 'محمد احمد خان' }],
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

  it('exports kashida justification as Word native mediumKashida, text untouched', async () => {
    const { bytes } = await exportDocumentToDocx(docWithJustifiedParagraph('kashida'));
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('<w:jc w:val="mediumKashida"/>');
    // No tatweel is ever baked into exported text.
    expect(xml).not.toContain('\u0640');
    expect(xml).toContain('محمد احمد خان');
  });

  it('defaults justified RTL paragraphs to kashida and honors explicit space mode', async () => {
    const def = await exportDocumentToDocx(docWithJustifiedParagraph(undefined));
    const defXml = await (await JSZip.loadAsync(def.bytes))
      .file('word/document.xml')!
      .async('string');
    expect(defXml).toContain('<w:jc w:val="mediumKashida"/>');

    const space = await exportDocumentToDocx(docWithJustifiedParagraph('space'));
    const spaceXml = await (await JSZip.loadAsync(space.bytes))
      .file('word/document.xml')!
      .async('string');
    expect(spaceXml).toContain('<w:jc w:val="both"/>');
    expect(spaceXml).not.toContain('Kashida');
  });

  it('round-trips the kashida mode through the DOCX parser', async () => {
    const { bytes } = await exportDocumentToDocx(docWithJustifiedParagraph('kashida'));
    const parsed = await parseDocxFile(bytes);
    const paras = paragraphBlocks(parsed.blocks);
    expect(paras).toHaveLength(1);
    expect(paras[0]!.alignment).toBe('justify');
    expect(paras[0]!.justificationMode).toBe('kashida');
  });

  function docWithAdjustedImage(): RePageDocument {
    const doc = createDocument('Adjustments Test');
    const pageId = doc.pageOrder[0]!;
    const imgRes = addImageFrame(doc, pageId, 'pixel.png', PNG_DATA_URL, 120, 90);
    return setImageAdjustmentsCommand(imgRes.document, imgRes.objectId, {
      brightness: 130,
      contrast: 100,
      flipH: true,
      flipV: true,
    });
  }

  it('exports mirroring as DrawingML flip flags and reports tone adjustments honestly', async () => {
    const { bytes, report } = await exportDocumentToDocx(docWithAdjustedImage());
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('flipH="1"');
    expect(xml).toContain('flipV="1"');
    expect(
      report.notes.some((n) => n.includes('brightness/contrast adjustments that were not exported')),
    ).toBe(true);
  });

  it('exports no flip flags and no tone note for an unadjusted image', async () => {
    const doc = createDocument('Plain Image Test');
    const pageId = doc.pageOrder[0]!;
    const imgRes = addImageFrame(doc, pageId, 'pixel.png', PNG_DATA_URL, 120, 90);
    const { bytes, report } = await exportDocumentToDocx(imgRes.document);
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).not.toContain('flipH');
    expect(xml).not.toContain('flipV');
    expect(report.notes.some((n) => n.includes('brightness/contrast'))).toBe(false);
  });
});

describe('DOCX character styles (batch 12)', () => {
  function buildStyledDocument(): RePageDocument {
    let doc = createDocument('Char Styles');
    const story = doc.stories[PRIMARY_STORY_ID]!;
    const custom = {
      id: 'school_name',
      name: 'اسکول کا نام',
      fontFamily: 'Noto Nastaliq Urdu',
      fontSize: 20,
      bold: true,
      color: '#1d4ed8',
      language: 'ur' as const,
    };
    doc = {
      ...doc,
      styles: {
        characterStyles: {
          school_name: custom,
          emphasis: { id: 'emphasis', name: 'تاکید (Emphasis)', bold: true, color: '#0f766e' },
        },
      },
      stories: {
        ...doc.stories,
        [PRIMARY_STORY_ID]: {
          ...story,
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                direction: 'rtl',
                content: [
                  { type: 'text', text: 'GPS ' },
                  { type: 'text', text: '117 DB', characterStyleId: 'school_name' },
                  {
                    type: 'text',
                    text: ' emphasized',
                    characterStyleId: 'emphasis',
                    marks: [{ type: 'color', color: '#ff0000' }],
                  },
                ],
              },
            ],
          },
        },
      },
    };
    return doc;
  }

  it('emits w:style character definitions + w:rStyle, without baking frame defaults over style props', async () => {
    const { bytes } = await exportDocumentToDocx(buildStyledDocument());
    const zip = await JSZip.loadAsync(bytes);
    const stylesXml = await zip.file('word/styles.xml')!.async('string');
    const documentXml = await zip.file('word/document.xml')!.async('string');

    expect(stylesXml).toContain('w:type="character"');
    expect(stylesXml).toContain('w:styleId="school_name"');
    // The document's own registry is authoritative (it holds both styles).
    expect(stylesXml).toContain('w:styleId="emphasis"');
    expect(documentXml).toContain('<w:rStyle w:val="school_name"/>');
    expect(documentXml).toContain('<w:rStyle w:val="emphasis"/>');
    // The direct color mark on the emphasized run is preserved as direct
    // rPr (direct formatting beats the style in Word, as in the model).
    expect(documentXml).toContain('<w:color w:val="FF0000"/>');
  });

  it('round-trips: registry definitions and run references survive export -> import', async () => {
    const { bytes } = await exportDocumentToDocx(buildStyledDocument());

    const parsed = await parseDocxFile(bytes);
    expect(parsed.characterStyles['school_name']).toMatchObject({
      name: 'اسکول کا نام',
      fontSize: 20,
      bold: true,
      color: '#1d4ed8',
      language: 'ur',
    });
    const paras = parsed.blocks.filter((b) => b.kind === 'paragraph');
    const styledRun = paras
      .flatMap((b) => (b.kind === 'paragraph' ? b.node.content : []))
      .find((n) => n.type === 'text' && n.text === '117 DB');
    expect(styledRun?.type === 'text' ? styledRun.characterStyleId : undefined).toBe('school_name');

    const { document: imported, report } = await importDocxFile(bytes, 'styled.docx');
    const registry = (imported.styles as { characterStyles?: Record<string, unknown> }).characterStyles;
    expect(registry?.['school_name']).toBeDefined();
    expect(report.warnings.some((w) => w.includes('character style'))).toBe(true);
    const importedStory = Object.values(imported.stories).find((s) =>
      JSON.stringify(s.content).includes('117 DB'),
    );
    const run = importedStory?.content.content
      .flatMap((p) => p.content ?? [])
      .find((n) => n.type === 'text' && n.text === '117 DB');
    expect(run?.type === 'text' ? run.characterStyleId : undefined).toBe('school_name');
  });
});
