import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { parseDocxFile, type DocxBlock } from './docxParser';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

function docXml(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="${W}" xmlns:r="${R}"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>${body}</w:body>
</w:document>`;
}

async function buildDocx(files: Record<string, string | Uint8Array>): Promise<ArrayBuffer> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  const buf = await zip.generateAsync({ type: 'uint8array' });
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

function paragraphsOf(blocks: DocxBlock[]) {
  return blocks.filter((b) => b.kind === 'paragraph').map((b) => (b.kind === 'paragraph' ? b.node : undefined)!);
}

describe('parseDocxFile', () => {
  it('parses runs with bold/italic/underline/color/size and detects rtl vs ltr', async () => {
    const buf = await buildDocx({
      'word/document.xml': docXml(`
        <w:p><w:pPr><w:bidi/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="FF0000"/></w:rPr><w:t>اہم سرخی</w:t></w:r></w:p>
        <w:p><w:r><w:t xml:space="preserve">Hello </w:t></w:r><w:r><w:rPr><w:i/><w:u w:val="single"/></w:rPr><w:t>world</w:t></w:r></w:p>
      `),
    });
    const parsed = await parseDocxFile(buf);
    const paras = paragraphsOf(parsed.blocks);
    expect(paras).toHaveLength(2);
    expect(paras[0]!.direction).toBe('rtl');
    const marks = paras[0]!.content[0]!.type === 'text' ? paras[0]!.content[0]!.marks ?? [] : [];
    expect(marks).toContainEqual({ type: 'bold' });
    expect(marks).toContainEqual({ type: 'fontSize', size: 14 });
    expect(marks).toContainEqual({ type: 'color', color: '#FF0000' });
    expect(paras[1]!.direction).toBe('ltr');
    const run2 = paras[1]!.content[1]!;
    expect(run2.type === 'text' && run2.marks).toContainEqual({ type: 'italic' });
    expect(run2.type === 'text' && run2.marks).toContainEqual({ type: 'underline', style: 'single' });
  });

  it('maps Heading styles and center alignment, baking bold into runs', async () => {
    const buf = await buildDocx({
      'word/document.xml': docXml(`
        <w:p><w:pPr><w:pStyle w:val="Heading1"/><w:jc w:val="center"/></w:pPr><w:r><w:t>باب اول</w:t></w:r></w:p>
      `),
    });
    const parsed = await parseDocxFile(buf);
    const paras = paragraphsOf(parsed.blocks);
    expect(paras[0]!.styleId).toBe('heading1');
    expect(paras[0]!.alignment).toBe('center');
    const marks = paras[0]!.content[0]!.type === 'text' ? paras[0]!.content[0]!.marks ?? [] : [];
    expect(marks).toContainEqual({ type: 'bold' });
    expect(parsed.stats.headingCount).toBe(1);
  });

  it('resolves bullet and decimal lists from numbering.xml', async () => {
    const buf = await buildDocx({
      'word/document.xml': docXml(`
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="7"/></w:numPr></w:pPr><w:r><w:t>پہلا نکتہ</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="7"/></w:numPr></w:pPr><w:r><w:t>ذیلی نکتہ</w:t></w:r></w:p>
      `),
      'word/numbering.xml': `<?xml version="1.0"?><w:numbering xmlns:w="${W}">
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl>
          <w:lvl w:ilvl="1"><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>
        </w:abstractNum>
        <w:num w:numId="7"><w:abstractNumId w:val="0"/></w:num>
      </w:numbering>`,
    });
    const parsed = await parseDocxFile(buf);
    const paras = paragraphsOf(parsed.blocks);
    const t0 = paras[0]!.content.map((n) => (n.type === 'text' ? n.text : '')).join('');
    const t1 = paras[1]!.content.map((n) => (n.type === 'text' ? n.text : '')).join('');
    expect(t0.startsWith('• ')).toBe(true);
    expect(t1.startsWith('1. ')).toBe(true);
    expect(paras[1]!.indentLevel).toBe(1);
    expect(parsed.stats.listItemCount).toBe(2);
  });

  it('falls back to bullets with a warning when numbering is missing', async () => {
    const buf = await buildDocx({
      'word/document.xml': docXml(`
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="99"/></w:numPr></w:pPr><w:r><w:t>نکتہ</w:t></w:r></w:p>
      `),
    });
    const parsed = await parseDocxFile(buf);
    const paras = paragraphsOf(parsed.blocks);
    const t = paras[0]!.content.map((n) => (n.type === 'text' ? n.text : '')).join('');
    expect(t.startsWith('• ')).toBe(true);
    expect(parsed.warnings.some((w) => w.includes('99'))).toBe(true);
  });

  it('parses tables with text, gridSpan and vertical merge', async () => {
    const buf = await buildDocx({
      'word/document.xml': docXml(`
        <w:tbl>
          <w:tblGrid><w:gridCol/><w:gridCol/></w:tblGrid>
          <w:tr>
            <w:tc><w:p><w:r><w:t>خانہ 1</w:t></w:r></w:p></w:tc>
            <w:tc><w:tcPr><w:vMerge w:val="restart"/></w:tcPr><w:p><w:r><w:t>ضمیمہ</w:t></w:r></w:p></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>خانہ 3</w:t></w:r></w:p></w:tc>
            <w:tc><w:tcPr><w:vMerge/></w:tcPr><w:p><w:r><w:t>x</w:t></w:r></w:p></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr><w:p><w:r><w:t>چوڑا خانہ</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      `),
    });
    const parsed = await parseDocxFile(buf);
    const tableBlock = parsed.blocks.find((b) => b.kind === 'table');
    expect(tableBlock).toBeDefined();
    if (tableBlock?.kind !== 'table') throw new Error('expected a table block');
    const table = tableBlock.table;
    expect(table!.rows).toHaveLength(3);
    expect(table!.rows[0]).toHaveLength(2);
    // vertical merge: continuation cell folds into the restart cell's rowSpan
    expect(table!.rows[1]).toHaveLength(1);
    expect(table!.rows[0]![1]!.rowSpan).toBe(2);
    // horizontal merge: single wide cell
    expect(table!.rows[2]).toHaveLength(1);
    expect(table!.rows[2]![0]!.colSpan).toBe(2);
    const cellText = table!.rows[0]![0]!.content.content[0]!.content
      .map((n) => (n.type === 'text' ? n.text : ''))
      .join('');
    expect(cellText).toBe('خانہ 1');
    expect(parsed.stats.tableCount).toBe(1);
  });

  it('extracts inline images via rels and emits an image marker block', async () => {
    const buf = await buildDocx({
      'word/document.xml': docXml(`
        <w:p><w:r><w:t>تصویر دیکھیں:</w:t></w:r></w:p>
        <w:p><w:r><w:drawing><wp:inline><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:blipFill><a:blip r:embed="rId5"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>
      `),
      'word/_rels/document.xml.rels': `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/></Relationships>`,
      'word/media/image1.png': PNG_BYTES,
    });
    const parsed = await parseDocxFile(buf);
    expect(parsed.images).toHaveLength(1);
    expect(parsed.images[0]!.mediaType).toBe('image/png');
    expect(parsed.images[0]!.name).toBe('image1.png');
    expect(parsed.blocks.some((b) => b.kind === 'imageMarker')).toBe(true);
  });

  it('collects footnotes and marks references with superscript numbers', async () => {
    const buf = await buildDocx({
      'word/document.xml': docXml(`
        <w:p><w:r><w:t>متن</w:t></w:r><w:r><w:footnoteReference w:id="2"/></w:r></w:p>
      `),
      'word/footnotes.xml': `<?xml version="1.0"?><w:footnotes xmlns:w="${W}">
        <w:footnote w:id="0"><w:p><w:r><w:t>sep</w:t></w:r></w:p></w:footnote>
        <w:footnote w:id="2"><w:p><w:r><w:t>حاشیہ کا متن</w:t></w:r></w:p></w:footnote>
      </w:footnotes>`,
    });
    const parsed = await parseDocxFile(buf);
    expect(parsed.footnotes).toHaveLength(1);
    expect(parsed.footnotes[0]!.text).toContain('حاشیہ کا متن');
    const paras = paragraphsOf(parsed.blocks);
    const t = paras[0]!.content.map((n) => (n.type === 'text' ? n.text : '')).join('');
    expect(t).toContain('[1]');
    const refRun = paras[0]!.content.find((n) => n.type === 'text' && n.text === '[1]')!;
    expect(refRun.type === 'text' && refRun.marks).toContainEqual({ type: 'superscript' });
  });

  it('accepts tracked insertions, drops deletions, counts comments', async () => {
    const buf = await buildDocx({
      'word/document.xml': docXml(`
        <w:p><w:r><w:t>قبل </w:t></w:r><w:ins><w:r><w:t>بعد</w:t></w:r></w:ins><w:del><w:r><w:t>حذف شدہ</w:t></w:r></w:del><w:commentRangeStart w:id="0"/><w:commentRangeEnd w:id="0"/></w:p>
      `),
    });
    const parsed = await parseDocxFile(buf);
    const paras = paragraphsOf(parsed.blocks);
    const t = paras[0]!.content.map((n) => (n.type === 'text' ? n.text : '')).join('');
    expect(t).toContain('قبل');
    expect(t).toContain('بعد');
    expect(t).not.toContain('حذف شدہ');
    expect(parsed.stats.deletedTextRuns).toBe(1);
    expect(parsed.stats.commentRanges).toBe(1);
    expect(parsed.warnings.some((w) => w.includes('comment'))).toBe(true);
  });

  it('never destructively normalizes Urdu text (joiners, aerab preserved)', async () => {
    const original = 'می‌خواهم اَلْحَمْدُ لِلّٰہ'; // U+200C ZWNJ + aerab + combining marks
    const buf = await buildDocx({
      'word/document.xml': docXml(`<w:p><w:r><w:t>${original}</w:t></w:r></w:p>`),
    });
    const parsed = await parseDocxFile(buf);
    const paras = paragraphsOf(parsed.blocks);
    const t = paras[0]!.content.map((n) => (n.type === 'text' ? n.text : '')).join('');
    expect(t).toBe(original);
  });

  it('rejects corrupt zips and non-docx zips with readable errors', async () => {
    await expect(parseDocxFile(new Uint8Array([1, 2, 3, 4]).buffer)).rejects.toThrow(/not a valid .docx/);
    const buf = await buildDocx({ 'random.txt': 'hello' });
    await expect(parseDocxFile(buf)).rejects.toThrow(/document\.xml missing/);
  });

  it('enforces the file-size resource limit', async () => {
    const buf = await buildDocx({
      'word/document.xml': docXml('<w:p><w:r><w:t>hi</w:t></w:r></w:p>'),
    });
    await expect(parseDocxFile(buf, { resourceLimits: { maxFileSizeBytes: 10 } })).rejects.toThrow(
      /exceeds/,
    );
  });
});
