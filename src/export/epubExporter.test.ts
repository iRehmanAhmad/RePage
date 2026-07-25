import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { createMinimalDocument } from '../domain/document/document';
import { insertFootnote } from '../domain/rich-text/notesEngine';
import { exportDocumentToEpub } from './epubExporter';

describe('epubExporter', () => {
  it('exports canonical document to valid EPUB 3.0 package with RTL Nastaliq CSS and OPF manifest', async () => {
    const doc = createMinimalDocument('اسلامی جمہوریہ پاکستان');
    insertFootnote(doc.id, 'story-1', 'پاکستان کا قومی ترانہ حفیظ جالندھری نے لکھا');

    const epubBytes = await exportDocumentToEpub(doc, {
      title: 'پاکستان تاریخ',
      author: 'علامہ اقبال',
    });

    expect(epubBytes).toBeInstanceOf(Uint8Array);
    expect(epubBytes.byteLength).toBeGreaterThan(500);

    // Unzip and inspect EPUB file structure
    const zip = await JSZip.loadAsync(epubBytes);

    expect(zip.file('mimetype')).not.toBeNull();
    const mimetypeContent = await zip.file('mimetype')?.async('string');
    expect(mimetypeContent).toBe('application/epub+zip');

    expect(zip.file('META-INF/container.xml')).not.toBeNull();
    expect(zip.file('OEBPS/content.opf')).not.toBeNull();
    expect(zip.file('OEBPS/toc.ncx')).not.toBeNull();
    expect(zip.file('OEBPS/style.css')).not.toBeNull();

    const cssContent = await zip.file('OEBPS/style.css')?.async('string');
    expect(cssContent).toContain('direction: rtl');
    expect(cssContent).toContain('Noto Nastaliq Urdu');

    const opfContent = await zip.file('OEBPS/content.opf')?.async('string');
    expect(opfContent).toContain('پاکستان تاریخ');
    expect(opfContent).toContain('علامہ اقبال');
  });
});
