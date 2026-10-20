import { describe, expect, it } from 'vitest';
import { importTextFile } from './textImporter';
import { importRtfFile } from './rtfImporter';
import { importHtmlFile } from './htmlImporter';
import { importExternalFileWorkflow } from '../package/fileWorkflowEngine';
import { parseDocument } from '../../domain/document/schema';
import type { RePageDocument } from '../../domain/document/types';
import type { ParagraphNode } from '../../domain/rich-text/types';

/**
 * End-to-end tests for the Phase 3 batch 4 document builders (txt / rtf /
 * html). Each builder must return a schema-valid canonical document plus an
 * honest report — the contract `App.extractDocumentFromImport` relies on.
 * Urdu fixtures carry a ZWNJ (U+200C) and Arabic diacritics (aerab) and are
 * asserted byte-identical: import never normalizes Urdu text.
 */

// نیم + ZWNJ + خواب, and مُحَمَّد built from explicit combining marks.
const ZWNJ_WORD = 'نیم\u200cخواب';
const AERAB_WORD = '\u0645\u064f\u062d\u064e\u0645\u0651\u062f';
const URDU_SENTENCE = `یہ اردو متن ہے: ${ZWNJ_WORD} اور ${AERAB_WORD} حاضر ہیں۔`;

function storyParagraphs(doc: RePageDocument): ParagraphNode[] {
  return Object.values(doc.stories).flatMap((s) => s.content.content);
}

function paragraphText(p: ParagraphNode): string {
  return p.content.map((n) => (n.type === 'text' ? n.text : '')).join('');
}

function storyText(doc: RePageDocument): string {
  return storyParagraphs(doc).map(paragraphText).join('\n');
}

// ---------------------------------------------------------------------------
// TXT
// ---------------------------------------------------------------------------

describe('importTextFile (end-to-end)', () => {
  it('imports plain text with byte-identical Urdu (ZWNJ + aerab preserved)', async () => {
    const content = `${URDU_SENTENCE}\n\nSecond paragraph here.\n`;
    const { document, report } = await importTextFile(content, 'note.txt');

    expect(() => parseDocument(document)).not.toThrow();

    const paras = storyParagraphs(document);
    // Line 1, the interior blank line, line 3 — trailing newline trimmed.
    expect(paras).toHaveLength(3);
    expect(paragraphText(paras[0]!)).toBe(URDU_SENTENCE);
    expect(paras[0]!.direction).toBe('rtl');
    expect(paragraphText(paras[1]!)).toBe('');
    expect(paragraphText(paras[2]!)).toBe('Second paragraph here.');

    expect(report.filename).toBe('note.txt');
    expect(report.paragraphCount).toBe(3);
    expect(report.pageCount).toBe(document.pageOrder.length);
    expect(report.dropped).toEqual([]);
  });

  it('decodes UTF-8 bytes identically to string input', async () => {
    const bytes = new TextEncoder().encode(URDU_SENTENCE);
    const { document } = await importTextFile(bytes, 'bytes.txt');
    expect(paragraphText(storyParagraphs(document)[0]!)).toBe(URDU_SENTENCE);
  });

  it('rejects invalid UTF-8 instead of producing mojibake', async () => {
    await expect(importTextFile(new Uint8Array([0xff, 0xfe, 0x41]), 'bad.txt')).rejects.toThrow(
      /Invalid UTF-8/,
    );
  });

  it('flows a long text file across chained full-page frames', async () => {
    const line = 'یہ ایک لمبی سطر ہے جو صفحات پر پھیلے گی اور متن کو آگے بڑھائے گی۔ ';
    const content = Array.from({ length: 500 }, () => line).join('\n');
    const { document, report } = await importTextFile(content, 'long.txt');

    expect(() => parseDocument(document)).not.toThrow();
    expect(document.pageOrder.length).toBeGreaterThan(1);

    const frames = Object.values(document.objects).filter((o) => o.type === 'text-frame');
    expect(frames.length).toBe(document.pageOrder.length);
    const storyIds = new Set(frames.map((f) => (f.type === 'text-frame' ? f.storyId : '')));
    expect(storyIds.size).toBe(1);
    expect(report.pageCount).toBe(document.pageOrder.length);
    expect(report.paragraphCount).toBe(500);
  }, 20000);
});

// ---------------------------------------------------------------------------
// RTF
// ---------------------------------------------------------------------------

/** Encode a JS string as RTF \uN? escapes (ASCII passes through). */
function rtfUnicode(text: string): string {
  return Array.from(text)
    .map((ch) => {
      const cp = ch.codePointAt(0)!;
      if (cp === 0x20) return ' ';
      if (cp < 128) return ch;
      const signed = cp > 32767 ? cp - 65536 : cp;
      return `\\u${signed}?`;
    })
    .join('');
}

describe('importRtfFile (end-to-end)', () => {
  it('imports \\u escapes with byte-identical Urdu (ZWNJ + aerab), bold and alignment', async () => {
    const rtf =
      '{\\rtf1\\ansi\\ansicpg1252\\uc1\\deff0' +
      '{\\fonttbl{\\f0\\fswiss Arial;}}' +
      '\\pard\\qc\\b Centered Title\\b0\\par' +
      `\\pard\\ql ${rtfUnicode(URDU_SENTENCE)}\\par` +
      ' plain end}';

    const { document, report } = await importRtfFile(rtf, 'escaped.rtf');
    expect(() => parseDocument(document)).not.toThrow();

    const paras = storyParagraphs(document);
    expect(paras).toHaveLength(3);
    expect(paragraphText(paras[0]!)).toBe('Centered Title');
    expect(paras[0]!.alignment).toBe('center');
    const titleRun = paras[0]!.content.find((n) => n.type === 'text');
    expect(titleRun?.type === 'text' && titleRun.marks?.some((m) => m.type === 'bold')).toBe(true);

    // The whole point: escapes decode to exactly the source code points.
    expect(paragraphText(paras[1]!)).toBe(URDU_SENTENCE);
    expect(paras[1]!.direction).toBe('rtl');
    expect(paragraphText(paras[2]!)).toBe('plain end');

    expect(report.tableCount).toBe(0);
    expect(report.dropped).toEqual([]);
  });

  it('decodes legacy codepage bytes via \\ansicpg1256', async () => {
    // السلام written as \'hh escapes in Windows-1256 bytes.
    const rtf = "{\\rtf1\\ansi\\ansicpg1256 \\'c7\\'e1\\'d3\\'e1\\'c7\\'e3\\par}";
    const { document } = await importRtfFile(rtf, 'legacy.rtf');
    expect(paragraphText(storyParagraphs(document)[0]!)).toBe('السلام');
  });

  it('decodes codepage bytes via the font \\fcharset (Word-style Arabic RTF)', async () => {
    // Document claims cp1252, but the Arabic-charset font carries cp1256 bytes.
    const rtf =
      '{\\rtf1\\ansi\\ansicpg1252\\deff0' +
      '{\\fonttbl{\\f0\\fnil\\fcharset178 Traditional Arabic;}}' +
      "\\f0 \\'c7\\'e1\\'d3\\'e1\\'c7\\'e3\\par}";
    const { document } = await importRtfFile(rtf, 'wordstyle.rtf');
    const para = storyParagraphs(document)[0]!;
    expect(paragraphText(para)).toBe('السلام');
    const run = para.content.find((n) => n.type === 'text');
    expect(
      run?.type === 'text' &&
        run.marks?.some((m) => m.type === 'fontFamily' && m.family === 'Traditional Arabic'),
    ).toBe(true);
  });

  it('counts and reports dropped features (table structure, picture, header, footnote)', async () => {
    const rtf =
      '{\\rtf1\\ansi' +
      '{\\header Header text\\par}' +
      '{\\pict\\pngblip ffeeddcc}' +
      '{\\footnote A note}' +
      '\\trowd\\cellx1000\\cellx2000 پہلا\\cell دوسرا\\cell\\row' +
      '\\pard after\\par}';

    const { document, report } = await importRtfFile(rtf, 'features.rtf');
    expect(() => parseDocument(document)).not.toThrow();

    expect(report.tableCount).toBe(1);
    expect(report.imageCount).toBe(1);
    expect(report.footnoteCount).toBe(1);
    expect(report.dropped.some((d) => d.includes('table'))).toBe(true);
    expect(report.dropped.some((d) => d.includes('picture'))).toBe(true);
    expect(report.dropped.some((d) => d.includes('header/footer'))).toBe(true);
    expect(report.dropped.some((d) => d.includes('footnote'))).toBe(true);

    // Header/footnote text is dropped, but table cell text survives as paragraphs.
    const text = storyText(document);
    expect(text).toContain('پہلا');
    expect(text).toContain('دوسرا');
    expect(text).toContain('after');
    expect(text).not.toContain('Header text');
    expect(text).not.toContain('A note');
  });
});

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

describe('importHtmlFile (end-to-end)', () => {
  const html = `<html><head><title>Ignored</title></head><body>
    <h1>سرعنوان</h1>
    <p>یہ <strong>اہم</strong> اور <em>خاص</em> متن ہے۔</p>
    <ul><li>پہلی شے</li><li>دوسری شے</li></ul>
    <ol start="3"><li>تیسری شے</li></ol>
    <blockquote><p>اقتباس یہاں ہے</p></blockquote>
    <img src="https://example.com/external.png" alt="bahir">
    <img src="data:image/png;base64,iVBORw0KGgo=" alt="tasveer">
    <script>alert("xss")</script>
    <p onclick="evil()">آخری پیراگراف</p>
  </body></html>`;

  it('imports structure, marks, lists and quotes; data: image becomes an asset', async () => {
    const { document, report } = await importHtmlFile(html, 'page.html');
    expect(() => parseDocument(document)).not.toThrow();

    const paras = storyParagraphs(document);
    const texts = paras.map(paragraphText);

    const heading = paras.find((p) => p.styleId === 'heading1');
    expect(heading && paragraphText(heading)).toBe('سرعنوان');

    const bodyPara = paras.find((p) => paragraphText(p).includes('خاص'));
    expect(bodyPara).toBeDefined();
    const boldRun = bodyPara!.content.find((n) => n.type === 'text' && n.text === 'اہم');
    expect(boldRun?.type === 'text' && boldRun.marks?.some((m) => m.type === 'bold')).toBe(true);
    const italicRun = bodyPara!.content.find((n) => n.type === 'text' && n.text === 'خاص');
    expect(italicRun?.type === 'text' && italicRun.marks?.some((m) => m.type === 'italic')).toBe(
      true,
    );

    expect(texts).toContain('• پہلی شے');
    expect(texts).toContain('• دوسری شے');
    expect(texts).toContain('3. تیسری شے');

    const quote = paras.find((p) => p.styleId === 'quote');
    expect(quote && paragraphText(quote)).toBe('اقتباس یہاں ہے');

    // The embedded image became a real asset + image frame, with a marker.
    const assets = Object.values(document.assets);
    expect(assets).toHaveLength(1);
    expect(assets[0]!.mediaType).toBe('image/png');
    expect(assets[0]!.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(Object.values(document.objects).filter((o) => o.type === 'image-frame')).toHaveLength(1);
    expect(texts.some((t) => t.includes('[تصویر: tasveer.png]'))).toBe(true);

    expect(report.headingCount).toBe(1);
    expect(report.listItemCount).toBe(3);
    expect(report.imageCount).toBe(1);
    expect(report.dropped.some((d) => d.includes('image(s) skipped'))).toBe(true);
    expect(report.dropped.some((d) => d.includes('dedicated image pages'))).toBe(true);
  });

  it('never lets scripts or event handlers into the document model', async () => {
    const { document } = await importHtmlFile(html, 'page.html');
    const serialized = JSON.stringify(document);
    expect(serialized).not.toContain('alert');
    expect(serialized).not.toContain('xss');
    expect(serialized).not.toContain('onclick');
    expect(serialized).not.toContain('evil');
    // The last paragraph's text still imported fine.
    expect(storyText(document)).toContain('آخری پیراگراف');
  });

  it('counts and reports dropped table structure while keeping cell text', async () => {
    const tableHtml =
      '<table><tr><th>نام</th><th>نمبر</th></tr><tr><td>احمد</td><td>42</td></tr></table>';
    const { document, report } = await importHtmlFile(tableHtml, 'table.html');
    expect(report.tableCount).toBe(1);
    expect(report.dropped.some((d) => d.includes('table'))).toBe(true);
    expect(storyText(document)).toContain('نام | نمبر');
    expect(storyText(document)).toContain('احمد | 42');
  });
});

// ---------------------------------------------------------------------------
// Workflow routing
// ---------------------------------------------------------------------------

describe('importExternalFileWorkflow routing', () => {
  it('routes .txt / .rtf / .html to document builders returning {document, report}', async () => {
    const txt = await importExternalFileWorkflow(
      new TextEncoder().encode(URDU_SENTENCE).buffer as ArrayBuffer,
      'note.txt',
    );
    expect(txt).toHaveProperty('document');
    expect(txt).toHaveProperty('report');
    const txtResult = txt as Awaited<ReturnType<typeof importTextFile>>;
    expect(() => parseDocument(txtResult.document)).not.toThrow();
    expect(storyText(txtResult.document)).toContain(ZWNJ_WORD);

    const rtf = await importExternalFileWorkflow(
      new TextEncoder().encode('{\\rtf1\\ansi Hello\\par}').buffer as ArrayBuffer,
      'doc.rtf',
    );
    const rtfResult = rtf as Awaited<ReturnType<typeof importRtfFile>>;
    expect(() => parseDocument(rtfResult.document)).not.toThrow();
    expect(storyText(rtfResult.document)).toContain('Hello');

    const htmlRes = await importExternalFileWorkflow(
      new TextEncoder().encode('<p>سلام دنیا</p>').buffer as ArrayBuffer,
      'page.html',
    );
    const htmlResult = htmlRes as Awaited<ReturnType<typeof importHtmlFile>>;
    expect(() => parseDocument(htmlResult.document)).not.toThrow();
    expect(storyText(htmlResult.document)).toContain('سلام دنیا');
  });
});
