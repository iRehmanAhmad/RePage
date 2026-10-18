import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import {
  PRINT_PAGE_CLASS,
  PRINT_ROOT_CLASS,
  PRINTING_BODY_CLASS,
  buildPrintCss,
  exportDocumentToPdf,
  getDefaultPdfFileName,
  renderPrintPages,
  resolvePrintPageSize,
} from './pdfPrintExporter';
import { FORMAT_CAPABILITIES } from './types';

describe('pdfPrintExporter', () => {
  const originalPrint = window.print;

  afterEach(() => {
    document.body.innerHTML = '';
    document.body.classList.remove(PRINTING_BODY_CLASS);
    window.print = originalPrint;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('resolves @page size from the first page geometry in PDF points', () => {
    const doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    const page = doc.pages[pageId]!;
    const size = resolvePrintPageSize(doc);
    expect(size.widthPt).toBe(page.width);
    expect(size.heightPt).toBe(page.height);
    expect(size.orientation).toBe(page.width > page.height ? 'landscape' : 'portrait');
  });

  it('falls back to A4 when the document has no pages', () => {
    const doc = createStarterDocument();
    const size = resolvePrintPageSize({ ...doc, pageOrder: [] });
    expect(size.widthPt).toBeCloseTo(595.28, 2);
    expect(size.heightPt).toBeCloseTo(841.89, 2);
    expect(size.orientation).toBe('portrait');
  });

  it('derives a sanitized default PDF file name from the document title', () => {
    const doc = createStarterDocument();
    doc.metadata.title = 'میری دستاویز: خصوصی ایڈیشن?';
    expect(getDefaultPdfFileName(doc)).toBe('میری دستاویز خصوصی ایڈیشن.pdf');

    const untitled = createStarterDocument();
    untitled.metadata.title = '   ';
    expect(getDefaultPdfFileName(untitled)).toBe('RePage_Document.pdf');
  });

  it('builds print CSS with @page size and UI-hiding rules', () => {
    const css = buildPrintCss(595.28, 841.89);
    expect(css).toContain('@page');
    expect(css).toContain('size: 595.28pt 841.89pt');
    expect(css).toContain('margin: 0');
    expect(css).toContain(PRINT_ROOT_CLASS);
    expect(css).toContain(PRINTING_BODY_CLASS);
    expect(css).toContain(PRINT_PAGE_CLASS);
  });

  it('renders one static print page per document page with RTL direction', () => {
    const doc = createStarterDocument();
    const root = renderPrintPages(doc);
    expect(root.classList.contains(PRINT_ROOT_CLASS)).toBe(true);
    expect(root.getAttribute('dir')).toBe('rtl');
    const pages = root.querySelectorAll(`.${PRINT_PAGE_CLASS}`);
    expect(pages.length).toBe(doc.pageOrder.length);
    const firstPage = doc.pages[doc.pageOrder[0]!]!;
    expect((pages[0] as HTMLElement).style.width).toBe(`${firstPage.width}pt`);
    expect((pages[0] as HTMLElement).style.height).toBe(`${firstPage.height}pt`);
  });

  it('opens the system print dialog and cleans up after printing', async () => {
    const printSpy = vi.fn();
    window.print = printSpy;

    const doc = createStarterDocument();
    doc.metadata.title = 'ٹیسٹ دستاویز';
    const previousTitle = document.title;

    const result = exportDocumentToPdf(doc);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fileName).toBe('ٹیسٹ دستاویز.pdf');
    }

    // Print root mounted and UI-hiding class applied.
    expect(document.body.querySelector(`.${PRINT_ROOT_CLASS}`)).not.toBeNull();
    expect(document.body.classList.contains(PRINTING_BODY_CLASS)).toBe(true);
    // Suggested file name is exposed through document.title for the dialog.
    expect(document.title).toBe('ٹیسٹ دستاویز');

    // requestAnimationFrame fires the print call.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(printSpy).toHaveBeenCalledTimes(1);

    // afterprint tears everything down.
    window.dispatchEvent(new window.Event('afterprint'));
    expect(document.body.querySelector(`.${PRINT_ROOT_CLASS}`)).toBeNull();
    expect(document.body.querySelector('[data-repage-print="pdf"]')).toBeNull();
    expect(document.body.classList.contains(PRINTING_BODY_CLASS)).toBe(false);
    expect(document.title).toBe(previousTitle);
  });

  it('refuses documents with no pages instead of printing blank output', () => {
    const doc = createStarterDocument();
    const result = exportDocumentToPdf({ ...doc, pageOrder: [] });
    expect(result.ok).toBe(false);
    expect(document.body.querySelector(`.${PRINT_ROOT_CLASS}`)).toBeNull();
  });

  it('registers the vector-pdf format as implemented in the export dialog', () => {
    const cap = FORMAT_CAPABILITIES['vector-pdf'];
    expect(cap.isImplemented).toBe(true);
    expect(cap.labelEn).toContain('PDF');
    expect(cap.labelUr.length).toBeGreaterThan(0);
  });
});
