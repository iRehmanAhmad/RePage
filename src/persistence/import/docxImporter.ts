import { InlineNode, ParagraphNode, paragraph, RichTextDocument, TextMark } from '../../domain/rich-text/types';
import { DEFAULT_RESOURCE_LIMITS, ImportOptions, ImportTextResult, validateResourceLimits } from './importEngine';
import { detectTextDirection } from './textImporter';
import {
  addFullPageTextFrame,
  addImageFrame,
  addPage,
  linkTextFramesCommand,
  updateObjectGeometry,
} from '../../editor/commands/documentCommands';
import { addImportedTable } from '../../editor/commands/objectCommands';
import { createDocument } from '../../domain/document/createDocument';
import { createId } from '../../domain/document/ids';
import { estimateFrameCharCapacity } from '../../domain/document/textFlow';
import { parseDocument } from '../../domain/document/schema';
import type {
  PageId,
  RePageDocument,
  TextFrameObject,
  TextStory,
} from '../../domain/document/types';
import { computeSha256Hash } from './pdfImporter';
import { importStylesIntoDocument } from '../../domain/rich-text/styleLibrary';
import { getCharacterStyles } from '../../domain/rich-text/characterStyles';
import {
  parseDocxFile,
  type DocxBlock,
  type DocxImageData,
  type DocxTableData,
} from './docxParser';

/**
 * OpenXML / DOCX Importer for Urdu Manuscripts
 *
 * Extracts paragraphs (<w:p>) and text runs (<w:r>) from word/document.xml,
 * parsing formatting (bold <w:b>, italic <w:i>, underline <w:u>, bidi <w:bidi>, font size <w:sz>, color <w:color>).
 */
export function importDocxXml(
  xmlContent: string,
  options: ImportOptions = {},
): ImportTextResult {
  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  validateResourceLimits(new Blob([xmlContent]).size, limits);

  const paragraphs: ParagraphNode[] = [];

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    const pNodes = xmlDoc.getElementsByTagName('w:p');

    Array.from(pNodes).forEach((pEl) => {
      const inlineNodes: InlineNode[] = [];

      // Check bidi / direction properties
      const pPr = pEl.getElementsByTagName('w:pPr')[0];
      let pBidi = false;
      if (pPr) {
        pBidi = pPr.getElementsByTagName('w:bidi').length > 0 || pPr.getElementsByTagName('w:rtl').length > 0;
      }

      const rNodes = pEl.getElementsByTagName('w:r');
      Array.from(rNodes).forEach((rEl) => {
        const textNode = rEl.getElementsByTagName('w:t')[0];
        if (!textNode) return;

        const text = textNode.textContent ?? '';
        if (!text) return;

        const marks: TextMark[] = [];
        const rPr = rEl.getElementsByTagName('w:rPr')[0];

        if (rPr) {
          if (rPr.getElementsByTagName('w:b').length > 0) marks.push({ type: 'bold' });
          if (rPr.getElementsByTagName('w:i').length > 0) marks.push({ type: 'italic' });
          if (rPr.getElementsByTagName('w:u').length > 0) marks.push({ type: 'underline' });

          const colorEl = rPr.getElementsByTagName('w:color')[0];
          if (colorEl && colorEl.getAttribute('w:val')) {
            const hexColor = colorEl.getAttribute('w:val');
            if (hexColor && hexColor !== 'auto') {
              marks.push({ type: 'color', color: `#${hexColor}` });
            }
          }

          const szEl = rPr.getElementsByTagName('w:sz')[0];
          if (szEl && szEl.getAttribute('w:val')) {
            const halfPoints = parseInt(szEl.getAttribute('w:val')!, 10);
            if (!isNaN(halfPoints)) {
              marks.push({ type: 'fontSize', size: halfPoints / 2 });
            }
          }

          const fontEl = rPr.getElementsByTagName('w:rFonts')[0];
          if (fontEl) {
            const family = fontEl.getAttribute('w:cs') || fontEl.getAttribute('w:ascii');
            if (family) {
              marks.push({ type: 'fontFamily', family });
            }
          }
        }

        inlineNodes.push({
          type: 'text',
          text,
          marks: marks.length > 0 ? marks : undefined,
        });
      });

      const fullPText = inlineNodes
        .filter((n): n is { type: 'text'; text: string } => n.type === 'text')
        .map((n) => n.text)
        .join('');

      if (fullPText.trim() || inlineNodes.length > 0) {
        const dir = pBidi ? 'rtl' : detectTextDirection(fullPText, options.defaultDirection ?? 'rtl');
        paragraphs.push({
          type: 'paragraph',
          direction: dir,
          alignment: 'start',
          content: inlineNodes,
        });
      }
    });
  } else {
    // Regex fallback for node environment without DOMParser
    const pMatches = xmlContent.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
    for (const pStr of pMatches) {
      const tMatches = pStr.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const text = tMatches.map((t) => t.replace(/<[^>]+>/g, '')).join('');
      if (text.trim()) {
        const dir = detectTextDirection(text, options.defaultDirection ?? 'rtl');
        paragraphs.push({
          type: 'paragraph',
          direction: dir,
          alignment: 'start',
          content: [{ type: 'text', text }],
        });
      }
    }
  }

  const finalParagraphs = paragraphs.length > 0 ? paragraphs : [paragraph('', options.defaultDirection ?? 'rtl')];

  if (finalParagraphs.length > limits.maxParagraphCount) {
    throw new Error(`Paragraph count (${finalParagraphs.length}) exceeds resource limit of ${limits.maxParagraphCount}`);
  }

  const story: RichTextDocument = {
    type: 'doc',
    content: finalParagraphs,
  };

  const fullText = finalParagraphs
    .map((p) => p.content.map((c) => (c.type === 'text' ? c.text : '')).join(''))
    .join(' ');
  const words = fullText.trim().split(/\s+/).filter(Boolean);

  return {
    type: 'story',
    story,
    paragraphCount: story.content.length,
    wordCount: words.length,
    detectedFormat: 'docx',
    warnings: [],
  };
}

export interface ImportReport {
  filename: string;
  paragraphCount: number;
  wordCount: number;
  headingCount: number;
  listItemCount: number;
  tableCount: number;
  imageCount: number;
  footnoteCount: number;
  pageCount: number;
  /** Honest, countable notes about what was simplified or left out. */
  dropped: string[];
  warnings: string[];
}

export interface DocxDocumentImportResult {
  document: RePageDocument;
  report: ImportReport;
}

const MARKER_MARKS: TextMark[] = [
  { type: 'italic' },
  { type: 'color', color: '#64748b' },
  { type: 'fontSize', size: 11 },
];

/** Small centered placeholder marking where a table/image lives (see report). */
function markerParagraph(text: string): ParagraphNode {
  return {
    type: 'paragraph',
    direction: 'rtl',
    alignment: 'center',
    content: [{ type: 'text', text, marks: MARKER_MARKS }],
  };
}

function bytesToDataUrl(bytes: Uint8Array, mediaType: string): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:${mediaType};base64,${btoa(binary)}`;
}

function cleanTitle(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const noExt = base.replace(/\.docx$/i, '').trim();
  const title = noExt.length > 0 ? noExt : 'Imported Word document';
  return title.slice(0, 120);
}

function storyTextLength(paragraphs: ParagraphNode[]): number {
  return paragraphs.reduce(
    (sum, p) =>
      sum + p.content.reduce((s, n) => s + (n.type === 'text' ? n.text.length : 1), 0),
    0,
  );
}

/**
 * End-to-end DOCX import: .docx zip bytes -> validated canonical RePageDocument
 * plus an honest import report. All document assembly goes through
 * editor/commands (the sanctioned mutation path); the result is zod-validated
 * before it is returned, so invalid input can never produce an invalid document.
 *
 * Layout honesty: text flows across chained full-page frames (Phase 2 text
 * flow); tables and images are collected onto dedicated pages after the text
 * in document order, with marker paragraphs at their anchor positions.
 * Inline anchoring is therefore approximate — the report says so.
 */
export async function importDocxFile(
  data: ArrayBuffer | Uint8Array,
  filename = 'document.docx',
  options: ImportOptions = {},
): Promise<DocxDocumentImportResult> {
  const parsed = await parseDocxFile(data, options);
  const { stats, warnings } = parsed;

  // ---- 1. Story paragraphs in document order, with markers ----
  const storyParagraphs: ParagraphNode[] = [];
  const tables: { table: DocxTableData; index: number }[] = [];
  const imageOrder: DocxImageData[] = parsed.images;

  let tableCounter = 0;
  parsed.blocks.forEach((block: DocxBlock) => {
    if (block.kind === 'paragraph') {
      storyParagraphs.push(block.node);
    } else if (block.kind === 'table') {
      tableCounter += 1;
      tables.push({ table: block.table, index: tableCounter });
      storyParagraphs.push(markerParagraph(`[جدول ${tableCounter}]`));
    } else {
      const img = imageOrder[block.imageIndex];
      storyParagraphs.push(markerParagraph(img ? `[تصویر: ${img.name}]` : '[تصویر]'));
    }
  });

  // ---- 2. Footnote appendix ----
  if (parsed.footnotes.length > 0) {
    storyParagraphs.push({
      type: 'paragraph',
      direction: 'rtl',
      alignment: 'start',
      styleId: 'heading2',
      content: [{ type: 'text', text: 'حواشی', marks: [{ type: 'bold' }] }],
    });
    for (const fn of parsed.footnotes) {
      storyParagraphs.push({
        type: 'paragraph',
        direction: 'rtl',
        alignment: 'start',
        content: [
          {
            type: 'text',
            text: `${fn.number}. ${fn.text}`,
            marks: [{ type: 'fontSize', size: 11 }],
          },
        ],
      });
    }
  }

  if (storyParagraphs.length === 0) {
    storyParagraphs.push(paragraph('', 'rtl'));
  }

  // ---- 3. Document + story ----
  const title = cleanTitle(filename);
  let doc = createDocument(title);
  const storyId = createId('story');
  const story: TextStory = {
    id: storyId,
    name: 'Imported Word content',
    content: { type: 'doc', content: storyParagraphs },
  };
  doc = { ...doc, stories: { [storyId]: story } };

  // ---- 4. Text pages: estimate from frame capacity, chain frames ----
  const firstPageId = doc.pageOrder[0]!;
  let frameRes = addFullPageTextFrame(doc, firstPageId, storyId, 'Imported text 1');
  doc = frameRes.document;
  const firstFrame = doc.objects[frameRes.objectId] as TextFrameObject;
  const capacity = Math.max(1, estimateFrameCharCapacity(firstFrame));
  const totalChars = Math.max(1, storyTextLength(storyParagraphs));
  const textPages = Math.min(200, Math.max(1, Math.ceil(totalChars / capacity)));

  let prevFrameId = frameRes.objectId;
  for (let i = 2; i <= textPages; i++) {
    doc = addPage(doc);
    const pageId = doc.pageOrder[doc.pageOrder.length - 1]!;
    frameRes = addFullPageTextFrame(doc, pageId, storyId, `Imported text ${i}`);
    doc = frameRes.document;
    doc = linkTextFramesCommand(doc, prevFrameId, frameRes.objectId);
    prevFrameId = frameRes.objectId;
  }

  // ---- 5. Tables on dedicated pages (vertical flow) ----
  let tablePageId: PageId | null = null;
  let tableY = 0;
  let tableContentBottom = 0;
  let tableMarginLeft = 0;
  let tableContentWidth = 0;
  for (const { table, index } of tables) {
    const height = Math.max(1, table.rows.length) * 30 + 16;
    if (tablePageId === null || tableY + height > tableContentBottom) {
      doc = addPage(doc);
      tablePageId = doc.pageOrder[doc.pageOrder.length - 1]!;
      const page = doc.pages[tablePageId]!;
      tableMarginLeft = page.margins.left;
      tableY = page.margins.top;
      tableContentBottom = page.height - page.margins.bottom;
      tableContentWidth = Math.max(10, page.width - page.margins.left - page.margins.right);
    }
    const added = addImportedTable(doc, tablePageId, table, {
      x: tableMarginLeft,
      y: tableY,
      width: tableContentWidth,
      name: `جدول ${index}`,
    });
    doc = added.document;
    tableY += height + 24;
  }

  // ---- 6. Images on dedicated pages (vertical flow) ----
  let imagePageId: PageId | null = null;
  let imageY = 0;
  let imageContentBottom = 0;
  let imageMarginLeft = 0;
  let imageContentWidth = 0;
  for (const img of imageOrder) {
    const boxHeight = 270;
    if (imagePageId === null || imageY + boxHeight > imageContentBottom) {
      doc = addPage(doc);
      imagePageId = doc.pageOrder[doc.pageOrder.length - 1]!;
      const page = doc.pages[imagePageId]!;
      imageMarginLeft = page.margins.left;
      imageY = page.margins.top;
      imageContentBottom = page.height - page.margins.bottom;
      imageContentWidth = Math.max(10, page.width - page.margins.left - page.margins.right);
    }
    const boxWidth = Math.min(imageContentWidth, 360);
    const dataUrl = bytesToDataUrl(img.bytes, img.mediaType);
    const placed = addImageFrame(doc, imagePageId, img.name, dataUrl, boxWidth, boxHeight);
    doc = placed.document;
    doc = updateObjectGeometry(doc, placed.objectId, { x: imageMarginLeft, y: imageY });
    // Repair the asset record with real provenance (addImageFrame leaves sha256 blank).
    const obj = doc.objects[placed.objectId];
    const assetId = obj && obj.type === 'image-frame' ? obj.assetId : null;
    if (assetId && doc.assets[assetId]) {
      const sha256 = await computeSha256Hash(
        img.bytes.buffer.slice(img.bytes.byteOffset, img.bytes.byteOffset + img.bytes.byteLength) as ArrayBuffer,
      );
      const ext = img.mediaType === 'image/jpeg' ? 'jpg' : img.mediaType.split('/')[1] ?? 'png';
      doc = {
        ...doc,
        assets: {
          ...doc.assets,
          [assetId]: {
            ...doc.assets[assetId]!,
            sha256,
            mediaType: img.mediaType,
            byteSize: img.bytes.byteLength,
            originalName: img.name,
            packageEntry: `assets/${assetId}.${ext}`,
            dataUrl,
          },
        },
      };
    }
    imageY += boxHeight + 24;
  }

  // ---- 6b. Character styles defined by the Word file (batch 12) ----
  // Runs already carry characterStyleId references; the definitions land
  // in the document's registry so they resolve. The registry is first
  // seeded with the effective (built-in) set, then the file's definitions
  // overwrite by id: the file's meaning of a style id is what its runs
  // were written against.
  const importedCharStyles = parsed.characterStyles;
  const importedCharStyleCount = Object.keys(importedCharStyles).length;
  if (importedCharStyleCount > 0) {
    const seeded: RePageDocument = {
      ...doc,
      styles: {
        ...((doc.styles ?? {}) as Record<string, unknown>),
        characterStyles: getCharacterStyles(doc),
      },
    };
    doc = importStylesIntoDocument(
      seeded,
      { characterStyles: importedCharStyles },
      'overwrite',
    );
    warnings.push(
      `Imported ${importedCharStyleCount} character style(s) from the Word file.`,
    );
  }

  // ---- 7. Schema validation: invalid input must never produce an invalid document ----
  // dataUrl is runtime-only (the package stores raw bytes separately and the
  // zod schema strips it), so validate first, then re-attach for display.
  const dataUrls = new Map<string, string>();
  for (const [assetId, asset] of Object.entries(doc.assets)) {
    if (asset.dataUrl) dataUrls.set(assetId, asset.dataUrl);
  }
  let document: RePageDocument;
  try {
    document = parseDocument(doc) as RePageDocument;
  } catch (err) {
    throw new Error(
      `Imported content failed document validation: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }
  if (dataUrls.size > 0) {
    const assets = { ...document.assets };
    for (const [assetId, dataUrl] of dataUrls) {
      if (assets[assetId]) assets[assetId] = { ...assets[assetId]!, dataUrl };
    }
    document = { ...document, assets };
  }

  // ---- 8. Honest report ----
  const wordCount = storyParagraphs
    .map((p) => p.content.map((n) => (n.type === 'text' ? n.text : '')).join(''))
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const dropped: string[] = [];
  if (stats.commentRanges > 0) dropped.push(`${stats.commentRanges} comments skipped`);
  if (stats.deletedTextRuns > 0) dropped.push(`${stats.deletedTextRuns} tracked deletions dropped`);
  if (stats.oleObjects > 0) dropped.push(`${stats.oleObjects} embedded objects skipped`);
  if (stats.textBoxes > 0) dropped.push(`${stats.textBoxes} text boxes skipped`);
  if (stats.altChunks > 0) dropped.push(`${stats.altChunks} alternative-content chunks skipped`);
  if (tables.length > 0)
    dropped.push(`${tables.length} table(s) placed on dedicated table pages (inline anchoring approximate)`);
  if (imageOrder.length > 0)
    dropped.push(`${imageOrder.length} image(s) placed on dedicated image pages (inline anchoring approximate)`);

  const report: ImportReport = {
    filename,
    paragraphCount: stats.paragraphCount,
    wordCount,
    headingCount: stats.headingCount,
    listItemCount: stats.listItemCount,
    tableCount: stats.tableCount,
    imageCount: stats.imageCount,
    footnoteCount: stats.footnoteCount,
    pageCount: document.pageOrder.length,
    dropped,
    warnings,
  };

  return { document, report };
}
