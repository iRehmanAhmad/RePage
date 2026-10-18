import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { importDocxXml } from './docxImporter';

describe('docxImporter', () => {
  it('extracts paragraphs and runs with bidi and bold formatting from word/document.xml', () => {
    const xml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr><w:bidi/></w:pPr>
            <w:r>
              <w:rPr><w:b/></w:rPr>
              <w:t>اہم سرخی</w:t>
            </w:r>
          </w:p>
        </w:body>
      </w:document>
    `;

    const result = importDocxXml(xml);

    expect(result.type).toBe('story');
    expect(result.detectedFormat).toBe('docx');
    expect(result.paragraphCount).toBe(1);
    expect(result.story.content[0]!.direction).toBe('rtl');
  });
});
import { importDocxFile } from './docxImporter';
import { parseDocument } from '../../domain/document/schema';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

async function buildDocx(files: Record<string, string | Uint8Array>): Promise<ArrayBuffer> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  const buf = await zip.generateAsync({ type: 'uint8array' });
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

function fullUrduDocx(): Record<string, string | Uint8Array> {
  return {
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="${W}" xmlns:r="${R}"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/><w:bidi/></w:pPr><w:r><w:t>باب اول: تعارف</w:t></w:r></w:p>
    <w:p><w:pPr><w:bidi/><w:jc w:val="both"/></w:pPr><w:r><w:t>یہ ایک </w:t></w:r><w:r><w:rPr><w:b/><w:color w:val="0F766E"/></w:rPr><w:t>اہم</w:t></w:r><w:r><w:t> پیراگراف ہے۔</w:t></w:r></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr><w:bidi/></w:pPr><w:r><w:t>پہلا نکتہ</w:t></w:r></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr><w:bidi/></w:pPr><w:r><w:t>دوسرا نکتہ</w:t></w:r></w:p>
    <w:tbl>
      <w:tblGrid><w:gridCol/><w:gridCol/></w:tblGrid>
      <w:tr>
        <w:tc><w:p><w:r><w:t>نام</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>نمبر</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>احمد</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>42</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:r><w:drawing><wp:inline><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rId9"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>
    <w:p><w:r><w:t>اختتامی متن</w:t></w:r><w:r><w:footnoteReference w:id="2"/></w:r></w:p>
  </w:body>
</w:document>`,
    'word/numbering.xml': `<?xml version="1.0"?><w:numbering xmlns:w="${W}">
      <w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl></w:abstractNum>
      <w:num w:numId="3"><w:abstractNumId w:val="0"/></w:num>
    </w:numbering>`,
    'word/_rels/document.xml.rels': `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/photo.png"/></Relationships>`,
    'word/media/photo.png': PNG_BYTES,
    'word/footnotes.xml': `<?xml version="1.0"?><w:footnotes xmlns:w="${W}">
      <w:footnote w:id="2"><w:p><w:r><w:t>یہ حاشیہ ہے</w:t></w:r></w:p></w:footnote>
    </w:footnotes>`,
  };
}

function storyText(doc: { stories: Record<string, { content: { content: Array<{ content: Array<{ type: string; text?: string }> }> } }> }): string {
  return Object.values(doc.stories)
    .flatMap((s) => s.content.content)
    .map((p) => p.content.map((n) => (n.type === 'text' ? n.text ?? '' : '')).join(''))
    .join('\n');
}

describe('importDocxFile (end-to-end)', () => {
  it('imports a realistic Urdu docx into a validated canonical document with an honest report', async () => {
    const buf = await buildDocx(fullUrduDocx());
    const { document, report } = await importDocxFile(buf, 'test-urdu.docx');

    // Schema-validated canonical document (parseDocument runs inside importDocxFile;
    // re-validating here proves the returned object is genuinely valid).
    expect(() => parseDocument(document)).not.toThrow();

    const text = storyText(document);
    expect(text).toContain('باب اول: تعارف');
    expect(text).toContain('اہم');
    expect(text).toContain('• پہلا نکتہ');
    expect(text).toContain('[جدول 1]');
    expect(text).toContain('[تصویر: photo.png]');
    expect(text).toContain('حواشی');
    expect(text).toContain('یہ حاشیہ ہے');

    // Table became a real table object with imported cell content.
    const tables = Object.values(document.objects).filter((o) => o.type === 'table');
    expect(tables).toHaveLength(1);
    const firstCell = tables[0]!.type === 'table' ? tables[0]!.rows[0]!.cells[0]! : undefined;
    const cellDoc = firstCell?.content as { content: Array<{ content: Array<{ text?: string }> }> };
    expect(JSON.stringify(cellDoc)).toContain('نام');

    // Image became a real asset with provenance.
    const assets = Object.values(document.assets);
    expect(assets).toHaveLength(1);
    expect(assets[0]!.mediaType).toBe('image/png');
    expect(assets[0]!.sha256).toBeTruthy();
    expect(assets[0]!.dataUrl).toMatch(/^data:image\/png;base64,/);
    const imageFrames = Object.values(document.objects).filter((o) => o.type === 'image-frame');
    expect(imageFrames).toHaveLength(1);

    // Text flows across chained frames; tables/images live on later pages.
    expect(document.pageOrder.length).toBeGreaterThanOrEqual(1);

    // Honest report.
    expect(report.filename).toBe('test-urdu.docx');
    expect(report.headingCount).toBe(1);
    expect(report.listItemCount).toBe(2);
    expect(report.tableCount).toBe(1);
    expect(report.imageCount).toBe(1);
    expect(report.footnoteCount).toBe(1);
    expect(report.dropped.some((d) => d.includes('table'))).toBe(true);
    expect(report.dropped.some((d) => d.includes('image'))).toBe(true);
  });

  it('paginates long documents across chained text frames', async () => {
    const longPara = 'یہ ایک طویل پیراگراف ہے۔ '.repeat(80);
    const buf = await buildDocx({
      'word/document.xml': `<?xml version="1.0"?><w:document xmlns:w="${W}"><w:body>${Array.from({ length: 12 }, () => `<w:p><w:r><w:t>${longPara}</w:t></w:r></w:p>`).join('')}</w:body></w:document>`,
    });
    const { document, report } = await importDocxFile(buf, 'long.docx');
    expect(() => parseDocument(document)).not.toThrow();
    expect(document.pageOrder.length).toBeGreaterThan(1);
    // All text frames share one story and are chained.
    const frames = Object.values(document.objects).filter((o) => o.type === 'text-frame');
    expect(frames.length).toBe(document.pageOrder.length);
    const storyIds = new Set(frames.map((f) => (f.type === 'text-frame' ? f.storyId : '')));
    expect(storyIds.size).toBe(1);
    expect(report.pageCount).toBe(document.pageOrder.length);
  }, 20000);

  it('fails readably on corrupt input', async () => {
    await expect(importDocxFile(new Uint8Array([0xff, 0xd8, 0x00]).buffer, 'bad.docx')).rejects.toThrow(
      /not a valid .docx/,
    );
  });
});
