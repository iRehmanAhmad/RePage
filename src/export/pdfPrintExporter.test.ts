import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStarterDocument, PRIMARY_STORY_ID } from '../domain/document/createDocument';
import type { RePageDocument } from '../domain/document/types';
import { addImageFrame, addPage, addTextBox } from '../editor/commands/documentCommands';
import {
  setImageAdjustmentsCommand,
  setImageCropCommand,
  setTextOnPathCommand,
} from '../editor/commands/objectCommands';
import {
  PRINT_PAGE_CLASS,
  PRINT_ROOT_CLASS,
  PRINTING_BODY_CLASS,
  buildPrintCss,
  exportDocumentToPdf,
  getDefaultPdfFileName,
  renderPrintPages,
  resolvePrintPageIndices,
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

describe('pdfPrintExporter page range', () => {
  function threePageDoc(): RePageDocument {
    let doc = createStarterDocument();
    doc = addPage(doc);
    doc = addPage(doc);
    return doc;
  }

  it('resolves all pages by default and for an explicit all range', () => {
    const doc = threePageDoc();
    expect(resolvePrintPageIndices(doc, undefined)).toEqual([0, 1, 2]);
    expect(resolvePrintPageIndices(doc, { kind: 'all' })).toEqual([0, 1, 2]);
  });

  it('resolves the current page (and falls back to all for an unknown page)', () => {
    const doc = threePageDoc();
    expect(
      resolvePrintPageIndices(doc, { kind: 'current-page', pageId: doc.pageOrder[1]! }),
    ).toEqual([1]);
    expect(
      resolvePrintPageIndices(doc, { kind: 'current-page', pageId: 'no-such-page' as never }),
    ).toEqual([0, 1, 2]);
  });

  it('resolves custom ranges with clamping and inverted bounds swapped', () => {
    const doc = threePageDoc();
    expect(resolvePrintPageIndices(doc, { kind: 'custom', from: 2, to: 3 })).toEqual([1, 2]);
    expect(resolvePrintPageIndices(doc, { kind: 'custom', from: 3, to: 2 })).toEqual([1, 2]);
    expect(resolvePrintPageIndices(doc, { kind: 'custom', from: 0, to: 99 })).toEqual([0, 1, 2]);
    expect(resolvePrintPageIndices(doc, { kind: 'custom', from: 2, to: 2 })).toEqual([1]);
  });

  it('renders only the selected pages', () => {
    const doc = threePageDoc();
    const ranged = renderPrintPages(doc, { kind: 'custom', from: 2, to: 2 });
    expect(ranged.querySelectorAll(`.${PRINT_PAGE_CLASS}`).length).toBe(1);
    const current = renderPrintPages(doc, {
      kind: 'current-page',
      pageId: doc.pageOrder[2]!,
    });
    expect(current.querySelectorAll(`.${PRINT_PAGE_CLASS}`).length).toBe(1);
    const all = renderPrintPages(doc);
    expect(all.querySelectorAll(`.${PRINT_PAGE_CLASS}`).length).toBe(3);
  });
});

describe('pdfPrintExporter image crop', () => {
  const PNG_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  function docWithImage(crop: boolean): RePageDocument {
    const doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    const res = addImageFrame(doc, pageId, 'pixel.png', PNG_DATA_URL, 120, 90);
    if (!crop) return res.document;
    return setImageCropCommand(res.document, res.objectId, {
      left: 0.25,
      top: 0,
      right: 0,
      bottom: 0,
    });
  }

  it('renders an uncropped image directly at frame size', () => {
    const root = renderPrintPages(docWithImage(false));
    const img = root.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.style.width).toBe('120pt');
    expect(img!.style.height).toBe('90pt');
    expect((img!.parentElement as HTMLElement).style.overflow).not.toBe('hidden');
  });

  it('renders a cropped image clipped to the frame with the visible region scaled to fill', () => {
    const root = renderPrintPages(docWithImage(true));
    const img = root.querySelector('img');
    expect(img).not.toBeNull();
    const clip = img!.parentElement as HTMLElement;
    // Frame-sized clipping box.
    expect(clip.style.overflow).toBe('hidden');
    expect(clip.style.width).toBe('120pt');
    expect(clip.style.height).toBe('90pt');
    // 25% cropped from the left: full image scales to 120 / 0.75 = 160pt
    // and shifts left by 25% of 160 = 40pt.
    expect(img!.style.width).toBe('160pt');
    expect(img!.style.left).toBe('-40pt');
    expect(img!.style.height).toBe('90pt');
  });
});

describe('pdfPrintExporter image adjustments (batch 11)', () => {
  const PNG_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  function docWithAdjustedImage(): RePageDocument {
    const doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    const res = addImageFrame(doc, pageId, 'pixel.png', PNG_DATA_URL, 120, 90);
    return setImageAdjustmentsCommand(res.document, res.objectId, {
      brightness: 120,
      contrast: 100,
      flipH: true,
      flipV: false,
    });
  }

  it('renders brightness as a CSS filter and mirroring as a scale transform', () => {
    const root = renderPrintPages(docWithAdjustedImage());
    const img = root.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.style.filter).toContain('brightness(1.2)');
    expect(img!.style.transform).toBe('scale(-1, 1)');
  });

  it('renders no filter/transform for an unadjusted image', () => {
    const doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    const res = addImageFrame(doc, pageId, 'pixel.png', PNG_DATA_URL, 120, 90);
    const root = renderPrintPages(res.document);
    const img = root.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.style.filter).toBe('');
    expect(img!.style.transform).toBe('');
  });
});

describe('pdfPrintExporter circle text (batch 11)', () => {
  it('renders one positioned glyph span per ring segment', () => {
    const doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    const res = addTextBox(doc, pageId);
    const storyId = (res.document.objects[res.objectId] as { storyId: string }).storyId;
    const withText: RePageDocument = {
      ...res.document,
      stories: {
        ...res.document.stories,
        [storyId]: {
          ...res.document.stories[storyId]!,
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                direction: 'ltr',
                content: [{ type: 'text', text: 'SCHOOL' }],
              },
            ],
          },
        },
      },
    };
    const circled = setTextOnPathCommand(withText, res.objectId, {
      kind: 'circle',
      startAngleDeg: 0,
      flip: false,
    });
    const root = renderPrintPages(circled);
    const glyphs = root.querySelectorAll('.repage-circle-glyph');
    expect(glyphs.length).toBe(6); // S C H O O L
    expect(root.querySelector('[data-circle-text="true"]')).not.toBeNull();
    expect(Array.from(glyphs).map((g) => g.textContent).join('')).toBe('SCHOOL');
  });
});

describe('pdfPrintExporter kashida (batch 11)', () => {
  it('renders justified RTL paragraphs as kashida lines without touching stored text', () => {
    // Force the deterministic fallback measurer (no 2D canvas) so the
    // line-breaking arithmetic is reproducible: A4 text width is
    // 595.28 - 2*42.52 = ~510pt; a 4-letter word measures 25.2pt and a
    // tatweel 6.3pt, so each full line of 16 words leaves slack for
    // exactly one tatweel.
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(null);
    try {
      renderKashidaAndAssert();
    } finally {
      getContextSpy.mockRestore();
    }
  });

  function renderKashidaAndAssert() {
    const base = createStarterDocument();
    const longText = Array.from({ length: 40 }, () => 'محمد').join(' ');
    const doc: RePageDocument = {
      ...base,
      stories: {
        ...base.stories,
        [PRIMARY_STORY_ID]: {
          ...base.stories[PRIMARY_STORY_ID]!,
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                direction: 'rtl',
                alignment: 'justify',
                content: [{ type: 'text', text: longText }],
              },
            ],
          },
        },
      },
    };
    const root = renderPrintPages(doc);
    const kashidaPara = root.querySelector('.repage-kashida-paragraph');
    expect(kashidaPara).not.toBeNull();
    const lines = kashidaPara!.querySelectorAll('.repage-kashida-line');
    expect(lines.length).toBeGreaterThan(1);
    // At least one non-final line carries tatweels in its RENDER text.
    const rendered = Array.from(lines).map((l) => l.textContent || '').join('');
    expect(rendered).toContain('\u0640');
    // The canonical document text is untouched (no tatweel stored).
    const stored =
      doc.stories[PRIMARY_STORY_ID]!.content.content[0]!.content[0]!;
    expect(stored.type === 'text' ? stored.text : '').toBe(longText);
    expect(longText).not.toContain('\u0640');
  }
});
