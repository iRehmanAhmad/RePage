import type { ParagraphNode, TextMark } from '../../domain/rich-text/types';
import {
  addFullPageTextFrame,
  addImageFrame,
  addPage,
  linkTextFramesCommand,
  updateObjectGeometry,
} from '../../editor/commands/documentCommands';
import { createDocument } from '../../domain/document/createDocument';
import { createId } from '../../domain/document/ids';
import { estimateFrameCharCapacity } from '../../domain/document/textFlow';
import { parseDocument } from '../../domain/document/schema';
import type { PageId, RePageDocument, TextFrameObject, TextStory } from '../../domain/document/types';
import { computeSha256Hash } from './pdfImporter';
import type { ImportReport } from './docxImporter';

/**
 * Shared document assembly for the text-shaped importers (txt / rtf / html).
 *
 * Mirrors the proven DOCX path (`importDocxFile`): paragraphs become a single
 * story that flows across chained full-page text frames (Phase 2 text flow);
 * images are collected onto dedicated pages after the text, with marker
 * paragraphs at their anchor positions (inline anchoring is approximate and
 * the import report says so). All mutation goes through `editor/commands`,
 * and the result is zod-validated before it is returned.
 */

export interface ImportedImageData {
  /** Display / original name, e.g. "photo.png" or an HTML alt text. */
  name: string;
  mediaType: string;
  bytes: Uint8Array;
}

export type AssemblyBlock =
  | { kind: 'paragraph'; node: ParagraphNode }
  | { kind: 'image'; image: ImportedImageData };

/** Uniform end-to-end import result: a validated document plus honest report. */
export interface DocumentImportResult {
  document: RePageDocument;
  report: ImportReport;
}

const MARKER_MARKS: TextMark[] = [
  { type: 'italic' },
  { type: 'color', color: '#64748b' },
  { type: 'fontSize', size: 11 },
];

/** Small centered placeholder marking where an image lives (see report). */
export function imageMarkerParagraph(imageName: string): ParagraphNode {
  return {
    type: 'paragraph',
    direction: 'rtl',
    alignment: 'center',
    content: [{ type: 'text', text: `[تصویر: ${imageName}]`, marks: MARKER_MARKS }],
  };
}

export function bytesToDataUrl(bytes: Uint8Array, mediaType: string): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:${mediaType};base64,${btoa(binary)}`;
}

/** Document title from a filename: basename minus extension, length-capped. */
export function cleanImportTitle(filename: string, fallback: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const noExt = base.replace(/\.[^.]*$/, '').trim();
  const title = noExt.length > 0 ? noExt : fallback;
  return title.slice(0, 120);
}

export function countStoryWords(paragraphs: ParagraphNode[]): number {
  return paragraphs
    .map((p) => p.content.map((n) => (n.type === 'text' ? n.text : '')).join(''))
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function storyTextLength(paragraphs: ParagraphNode[]): number {
  return paragraphs.reduce(
    (sum, p) => sum + p.content.reduce((s, n) => s + (n.type === 'text' ? n.text.length : 1), 0),
    0,
  );
}

export interface AssemblyOutcome {
  document: RePageDocument;
  /** Final story paragraphs (image markers already inserted). */
  storyParagraphs: ParagraphNode[];
  imageCount: number;
}

export async function assembleImportedDocument(options: {
  title: string;
  storyName: string;
  blocks: AssemblyBlock[];
  fallbackParagraph: ParagraphNode;
}): Promise<AssemblyOutcome> {
  const { title, storyName, blocks, fallbackParagraph } = options;

  // ---- 1. Story paragraphs in document order, with image markers ----
  const storyParagraphs: ParagraphNode[] = [];
  const images: ImportedImageData[] = [];
  for (const block of blocks) {
    if (block.kind === 'paragraph') {
      storyParagraphs.push(block.node);
    } else {
      images.push(block.image);
      storyParagraphs.push(imageMarkerParagraph(block.image.name));
    }
  }
  if (storyParagraphs.length === 0) {
    storyParagraphs.push(fallbackParagraph);
  }

  // ---- 2. Document + story ----
  let doc = createDocument(title);
  const storyId = createId('story');
  const story: TextStory = {
    id: storyId,
    name: storyName,
    content: { type: 'doc', content: storyParagraphs },
  };
  doc = { ...doc, stories: { [storyId]: story } };

  // ---- 3. Text pages: estimate from frame capacity, chain frames ----
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

  // ---- 4. Images on dedicated pages (vertical flow) ----
  let imagePageId: PageId | null = null;
  let imageY = 0;
  let imageContentBottom = 0;
  let imageMarginLeft = 0;
  let imageContentWidth = 0;
  for (const img of images) {
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

  // ---- 5. Schema validation: invalid input must never produce an invalid document ----
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

  return { document, storyParagraphs, imageCount: images.length };
}
