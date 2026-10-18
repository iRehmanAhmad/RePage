/**
 * Vector PDF export via the OS print pipeline.
 *
 * There is no PDF byte-writer in this module on purpose: the printed output is
 * produced by the browser / Tauri webview print engine from real DOM text, so
 * the resulting PDF keeps fully selectable, vector text with correct complex
 * shaping (Nastaliq included) — no screenshots, no rasterization, no pdf-lib.
 * The user picks "Save as PDF" (or "Microsoft Print to PDF") in the system
 * print dialog that this module opens.
 *
 * Design note: this module renders its own lightweight, read-only print DOM
 * instead of reusing the interactive PaginatedPrintLayout. That component is
 * the interactive viewport (Tiptap editors, Fabric canvases, ~20 callbacks);
 * per the repo's architecture boundaries, export/ stays independent of the
 * interactive viewport. The same canonical domain engines are reused
 * (repaginateDocument, resolvePageCompositeObjects, getSectionPageNumberString),
 * so print output always reflects the canonical document.
 *
 * Honest limitations (also surfaced in docs):
 * - @page accepts a single page size: multi-section documents with different
 *   page sizes print with the first section's size.
 * - Press-grade prepress output (crop marks, bleed boxes, embedded-font
 *   guarantees) is future work; see exportReadiness.ts.
 */

import type { RePageDocument, TextStory } from '../domain/document/types';
import { PRIMARY_STORY_ID } from '../domain/document/createDocument';
import { repaginateDocument } from '../domain/layout/paginationEngine';
import { resolvePageCompositeObjects } from '../domain/layout/masterPageEngine';
import { getSectionForPage } from '../domain/layout/sectionEngine';
import { getSectionPageNumberString } from '../domain/unicode/pageNumbering';

export const PRINT_ROOT_CLASS = 'repage-print-root';
export const PRINTING_BODY_CLASS = 'repage-printing';
export const PRINT_PAGE_CLASS = 'repage-print-page';

/** A4 in PDF points (210 x 297 mm); used when a document has no pages. */
export const FALLBACK_PAGE_WIDTH_PT = 595.28;
export const FALLBACK_PAGE_HEIGHT_PT = 841.89;

const URDU_FONT_STACK = "'Noto Nastaliq Urdu', 'Jameel Noori Nastaliq', 'Urdu Typesetting', serif";
const LATIN_FONT_STACK = "'Calibri', 'Segoe UI', Arial, sans-serif";

export interface PrintPageSize {
  widthPt: number;
  heightPt: number;
  orientation: 'portrait' | 'landscape';
}

export type PdfPrintResult = { ok: true; fileName: string } | { ok: false; reason: string };

interface PrintTextRun {
  type?: string | undefined;
  text?: string | undefined;
}

interface PrintParagraph {
  content?: PrintTextRun[] | undefined;
}

/**
 * Resolves the @page size from the document's section model. Geometry is
 * stored in PDF points (1/72 inch), which CSS accepts directly, so no unit
 * conversion error is introduced.
 *
 * NOTE: browsers accept a single @page size per print job. Documents whose
 * sections use different page sizes print with the first page's size.
 */
export function resolvePrintPageSize(doc: RePageDocument): PrintPageSize {
  const firstPageId = doc.pageOrder[0];
  const firstPage = firstPageId ? doc.pages[firstPageId] : undefined;
  if (!firstPage) {
    return {
      widthPt: FALLBACK_PAGE_WIDTH_PT,
      heightPt: FALLBACK_PAGE_HEIGHT_PT,
      orientation: 'portrait',
    };
  }
  return {
    widthPt: firstPage.width,
    heightPt: firstPage.height,
    orientation: firstPage.width > firstPage.height ? 'landscape' : 'portrait',
  };
}

/** Default output file name derived from the document title, sanitized for filesystems. */
export function getDefaultPdfFileName(doc: RePageDocument): string {
  const raw = (doc.metadata.title || '').trim();
  const sanitized = raw.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  const base = sanitized.length > 0 ? sanitized : 'RePage_Document';
  return `${base.slice(0, 120)}.pdf`;
}

/**
 * Builds the print stylesheet: @page size from the section model (margins are
 * handled inside the page frames, so the browser must not add its own), plus
 * rules that hide the application UI and show only the print pages.
 */
export function buildPrintCss(widthPt: number, heightPt: number): string {
  return (
    `@page { size: ${widthPt}pt ${heightPt}pt; margin: 0; }\n` +
    `.${PRINT_ROOT_CLASS} { display: none; }\n` +
    `@media print {\n` +
    `  body.${PRINTING_BODY_CLASS} > *:not(.${PRINT_ROOT_CLASS}) { display: none !important; }\n` +
    `  body.${PRINTING_BODY_CLASS} .${PRINT_ROOT_CLASS} { display: block !important; }\n` +
    `  .${PRINT_PAGE_CLASS} { break-after: page; break-inside: avoid; margin: 0 !important; box-shadow: none !important; }\n` +
    `  .${PRINT_PAGE_CLASS}:last-child { break-after: auto; }\n` +
    `}\n`
  );
}

function extractStoryText(story: TextStory | null | undefined): string | null {
  const firstPara = story?.content?.content?.[0] as PrintParagraph | undefined;
  const runs = firstPara?.content;
  if (!runs || runs.length === 0) return null;
  const text = runs.map((run) => (run.type === 'text' ? run.text || '' : '')).join('');
  return text.length > 0 ? text : null;
}

function paragraphText(para: PrintParagraph): string {
  return (para.content || []).map((run) => (run.type === 'text' ? run.text || '' : '')).join('');
}

function fontStackFor(doc: RePageDocument): string {
  return doc.metadata.locale === 'ur-PK' ? URDU_FONT_STACK : LATIN_FONT_STACK;
}

/**
 * Renders the document's pages as static, read-only DOM (no editors, no
 * canvas interactivity). The returned element is detached; the caller decides
 * where to mount it.
 */
export function renderPrintPages(doc: RePageDocument): HTMLElement {
  const root = document.createElement('div');
  root.className = PRINT_ROOT_CLASS;
  root.setAttribute('dir', doc.metadata.locale === 'ur-PK' ? 'rtl' : 'ltr');

  const pagination = repaginateDocument(doc, PRIMARY_STORY_ID);
  const repaginatedStory = pagination.repaginatedDoc.stories[PRIMARY_STORY_ID];
  const storyParagraphs: PrintParagraph[] =
    (repaginatedStory?.content?.content as PrintParagraph[] | undefined) || [];
  const fontStack = fontStackFor(doc);
  const isRtl = doc.metadata.locale === 'ur-PK';

  doc.pageOrder.forEach((pageId, pageIndex) => {
    const page = doc.pages[pageId];
    if (!page) return;

    const section = getSectionForPage(doc, pageId);
    const headerStory = section.headerStoryId ? doc.stories[section.headerStoryId] : undefined;
    const footerStory = section.footerStoryId ? doc.stories[section.footerStoryId] : undefined;
    const headerText =
      extractStoryText(headerStory) || headerStory?.name || doc.metadata.title || '';
    const footerText = extractStoryText(footerStory) || footerStory?.name || '';
    const pageNumberText = getSectionPageNumberString(doc, pageId);

    const pageEl = document.createElement('div');
    pageEl.className = PRINT_PAGE_CLASS;
    pageEl.style.position = 'relative';
    pageEl.style.width = `${page.width}pt`;
    pageEl.style.height = `${page.height}pt`;
    pageEl.style.overflow = 'hidden';
    pageEl.style.backgroundColor = page.background || '#ffffff';
    pageEl.style.color = '#172119';
    pageEl.style.fontFamily = fontStack;
    pageEl.style.printColorAdjust = 'exact';

    const margins = page.margins;

    // Header region.
    const headerEl = document.createElement('div');
    headerEl.style.position = 'absolute';
    headerEl.style.top = `${Math.max(8, margins.top / 2)}pt`;
    headerEl.style.left = `${margins.left}pt`;
    headerEl.style.right = `${margins.right}pt`;
    headerEl.style.display = 'flex';
    headerEl.style.justifyContent = 'space-between';
    headerEl.style.fontSize = '10pt';
    headerEl.style.color = '#64748b';
    const headerTitle = document.createElement('span');
    headerTitle.textContent = headerText;
    const headerPage = document.createElement('span');
    headerPage.textContent = pageNumberText;
    headerEl.appendChild(headerTitle);
    headerEl.appendChild(headerPage);
    pageEl.appendChild(headerEl);

    // Body text: paragraphs assigned to this page by the pagination engine.
    const bodyEl = document.createElement('div');
    bodyEl.style.position = 'absolute';
    bodyEl.style.top = `${margins.top}pt`;
    bodyEl.style.left = `${margins.left}pt`;
    bodyEl.style.right = `${margins.right}pt`;
    bodyEl.style.bottom = `${margins.bottom}pt`;
    bodyEl.style.overflow = 'hidden';
    bodyEl.style.direction = isRtl ? 'rtl' : 'ltr';
    bodyEl.style.textAlign = isRtl ? 'right' : 'left';
    bodyEl.style.lineHeight = '1.8';
    bodyEl.style.fontSize = '14pt';
    bodyEl.style.zIndex = '1';

    const pageParagraphs = storyParagraphs.filter(
      (_, pIdx) => (pagination.paragraphPageMap[pIdx] ?? 0) === pageIndex,
    );
    const paragraphsToRender =
      pageParagraphs.length > 0 ? pageParagraphs : pageIndex === 0 ? storyParagraphs : [];
    for (const para of paragraphsToRender) {
      const p = document.createElement('p');
      p.style.margin = '0 0 12pt 0';
      p.textContent = paragraphText(para);
      bodyEl.appendChild(p);
    }
    pageEl.appendChild(bodyEl);

    // Floating objects, rendered statically (master-page objects included).
    const objectsEl = document.createElement('div');
    objectsEl.style.position = 'absolute';
    objectsEl.style.inset = '0';
    objectsEl.style.zIndex = '2';
    objectsEl.style.pointerEvents = 'none';
    for (const obj of resolvePageCompositeObjects(doc, pageId)) {
      if (obj.hidden) continue;
      if (obj.type === 'text-frame') {
        const story = doc.stories[obj.storyId];
        const frameEl = document.createElement('div');
        frameEl.style.position = 'absolute';
        frameEl.style.left = `${obj.frame.x}pt`;
        frameEl.style.top = `${obj.frame.y}pt`;
        frameEl.style.width = `${obj.frame.width}pt`;
        frameEl.style.height = `${obj.frame.height}pt`;
        frameEl.style.overflow = 'hidden';
        frameEl.style.padding = `${obj.padding.top}pt ${obj.padding.right}pt ${obj.padding.bottom}pt ${obj.padding.left}pt`;
        frameEl.style.boxSizing = 'border-box';
        frameEl.style.fontFamily = obj.fontFamily || fontStack;
        frameEl.style.fontSize = `${obj.fontSize}pt`;
        frameEl.style.color = obj.color;
        frameEl.style.lineHeight = String(obj.lineHeight);
        frameEl.style.direction = isRtl ? 'rtl' : 'ltr';
        frameEl.style.textAlign = isRtl ? 'right' : 'left';
        const storyParas = (story?.content?.content as PrintParagraph[] | undefined) || [];
        for (const para of storyParas) {
          const p = document.createElement('p');
          p.style.margin = '0 0 8pt 0';
          p.textContent = paragraphText(para);
          frameEl.appendChild(p);
        }
        objectsEl.appendChild(frameEl);
      } else if (obj.type === 'rectangle') {
        const rectEl = document.createElement('div');
        rectEl.style.position = 'absolute';
        rectEl.style.left = `${obj.frame.x}pt`;
        rectEl.style.top = `${obj.frame.y}pt`;
        rectEl.style.width = `${obj.frame.width}pt`;
        rectEl.style.height = `${obj.frame.height}pt`;
        rectEl.style.backgroundColor = obj.fill;
        rectEl.style.border = `${obj.strokeWidth}px solid ${obj.stroke}`;
        rectEl.style.borderRadius = `${obj.cornerRadius}px`;
        objectsEl.appendChild(rectEl);
      } else if (obj.type === 'image-frame') {
        const asset = obj.assetId ? doc.assets[obj.assetId] : undefined;
        if (asset?.dataUrl) {
          const img = document.createElement('img');
          img.style.position = 'absolute';
          img.style.left = `${obj.frame.x}pt`;
          img.style.top = `${obj.frame.y}pt`;
          img.style.width = `${obj.frame.width}pt`;
          img.style.height = `${obj.frame.height}pt`;
          img.style.objectFit = obj.fit === 'stretch' ? 'fill' : obj.fit;
          img.setAttribute('src', asset.dataUrl);
          objectsEl.appendChild(img);
        }
      }
      // Tables are skipped: static table print rendering is future work.
    }
    pageEl.appendChild(objectsEl);

    // Footer region with localized page number.
    const footerEl = document.createElement('div');
    footerEl.style.position = 'absolute';
    footerEl.style.bottom = `${Math.max(8, margins.bottom / 2)}pt`;
    footerEl.style.left = `${margins.left}pt`;
    footerEl.style.right = `${margins.right}pt`;
    footerEl.style.display = 'flex';
    footerEl.style.justifyContent = 'space-between';
    footerEl.style.fontSize = '10pt';
    footerEl.style.color = '#64748b';
    const footerLabel = document.createElement('span');
    footerLabel.textContent = footerText;
    const footerNum = document.createElement('span');
    footerNum.textContent = pageNumberText;
    footerEl.appendChild(footerLabel);
    footerEl.appendChild(footerNum);
    pageEl.appendChild(footerEl);

    root.appendChild(pageEl);
  });

  return root;
}

/**
 * Exports the document to PDF through the operating system's print pipeline.
 *
 * The document's pages are rendered as real DOM text into a print-only
 * container, the application UI is hidden for the print job via injected
 * print CSS, and the system print dialog is opened. Choosing "Save as PDF"
 * (or "Microsoft Print to PDF") in that dialog produces a genuine vector PDF:
 * selectable text, correct Nastaliq shaping, exact page geometry.
 *
 * The suggested file name is applied via document.title, which print dialogs
 * use as the default file name. Cleanup is guaranteed through the afterprint
 * event with a timer fallback.
 */
export function exportDocumentToPdf(doc: RePageDocument): PdfPrintResult {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { ok: false, reason: 'PDF print export requires a browser or Tauri webview environment.' };
  }
  if (doc.pageOrder.length === 0) {
    return { ok: false, reason: 'The document has no pages to export.' };
  }

  const { widthPt, heightPt } = resolvePrintPageSize(doc);
  const fileName = getDefaultPdfFileName(doc);

  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-repage-print', 'pdf');
  styleEl.textContent = buildPrintCss(widthPt, heightPt);

  const root = renderPrintPages(doc);

  document.head.appendChild(styleEl);
  document.body.appendChild(root);
  document.body.classList.add(PRINTING_BODY_CLASS);

  const previousTitle = document.title;
  document.title = fileName.replace(/\.pdf$/i, '');

  let cleaned = false;
  const cleanup = (): void => {
    if (cleaned) return;
    cleaned = true;
    document.title = previousTitle;
    document.body.classList.remove(PRINTING_BODY_CLASS);
    root.remove();
    styleEl.remove();
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  window.setTimeout(cleanup, 60000);

  const triggerPrint = typeof window.print === 'function' ? window.print.bind(window) : null;
  if (triggerPrint) {
    window.requestAnimationFrame(() => {
      triggerPrint();
    });
  } else {
    cleanup();
    return { ok: false, reason: 'Printing is not available in this environment.' };
  }

  return { ok: true, fileName };
}
