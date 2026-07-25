import type { Insets, PageId, RePageDocument, TextFrameObject } from '../domain/document/types';
import { resolvePageCompositeObjects } from '../domain/layout/masterPageEngine';

export interface PdfMetadata {
  title: string;
  author: string;
  creator: string;
  producer: string;
  creationDate: string;
  language: string;
}

export interface PrintMarkLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PrintMarksResult {
  cropMarks: PrintMarkLine[];
  bleedBox: { x: number; y: number; width: number; height: number };
}

/**
 * Generates compliant PDF document metadata dictionary with Urdu locale attributes.
 */
export function exportDocumentToPdfMetadata(doc: RePageDocument): PdfMetadata {
  return {
    title: doc.metadata.title || 'بلا عنوان',
    author: (doc.metadata as any).author || 'RePage User',
    creator: 'RePage Document Publishing System',
    producer: 'RePage PDF Engine 1.0',
    creationDate: doc.metadata.createdAt,
    language: doc.metadata.locale || 'ur-PK',
  };
}

/**
 * Computes vector crop marks and bleed box geometries for prepress print output.
 */
export function computePrintMarks(
  pageWidth: number,
  pageHeight: number,
  bleed: Insets,
  markLength = 15,
  markOffset = 5,
): PrintMarksResult {
  const bleedBox = {
    x: -bleed.left,
    y: -bleed.top,
    width: pageWidth + bleed.left + bleed.right,
    height: pageHeight + bleed.top + bleed.bottom,
  };

  const cropMarks: PrintMarkLine[] = [
    // Top-Left Corner
    { x1: -markOffset - markLength, y1: 0, x2: -markOffset, y2: 0 },
    { x1: 0, y1: -markOffset - markLength, x2: 0, y2: -markOffset },

    // Top-Right Corner
    { x1: pageWidth + markOffset, y1: 0, x2: pageWidth + markOffset + markLength, y2: 0 },
    { x1: pageWidth, y1: -markOffset - markLength, x2: pageWidth, y2: -markOffset },

    // Bottom-Left Corner
    { x1: -markOffset - markLength, y1: pageHeight, x2: -markOffset, y2: pageHeight },
    { x1: 0, y1: pageHeight + markOffset, x2: 0, y2: pageHeight + markOffset + markLength },

    // Bottom-Right Corner
    { x1: pageWidth + markOffset, y1: pageHeight, x2: pageWidth + markOffset + markLength, y2: pageHeight },
    { x1: pageWidth, y1: pageHeight + markOffset, x2: pageWidth, y2: pageHeight + markOffset + markLength },
  ];

  return { cropMarks, bleedBox };
}

/**
 * Renders a document page into standalone vector SVG markup outside the interactive viewport.
 */
export function exportDocumentToSvg(doc: RePageDocument, pageId: PageId): string {
  const page = doc.pages[pageId];
  if (!page) {
    throw new Error(`Page '${pageId}' does not exist in document`);
  }

  const objects = resolvePageCompositeObjects(doc, pageId);
  const elementsSvg: string[] = [];

  for (const obj of objects) {
    if (obj.type === 'text-frame') {
      const textFrame = obj as TextFrameObject;
      const story = doc.stories[textFrame.storyId];
      const rawText = story?.content?.content
        ? story.content.content
            .map((p) => p.content.map((run) => (run.type === 'text' ? run.text : '\n')).join(''))
            .join('\n')
        : '';
      const safeText = rawText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      elementsSvg.push(
        `<g id="${textFrame.id}" transform="translate(${textFrame.frame.x}, ${textFrame.frame.y})">
          <rect width="${textFrame.frame.width}" height="${textFrame.frame.height}" fill="transparent" stroke="none" />
          <text x="${textFrame.frame.width - (textFrame.padding?.right || 10)}" y="${(textFrame.padding?.top || 10) + textFrame.fontSize}" font-family="${textFrame.fontFamily}" font-size="${textFrame.fontSize}px" fill="${textFrame.color}" dir="rtl" text-anchor="end">${safeText}</text>
        </g>`,
      );
    } else if (obj.type === 'rectangle') {
      elementsSvg.push(
        `<rect id="${obj.id}" x="${obj.frame.x}" y="${obj.frame.y}" width="${obj.frame.width}" height="${obj.frame.height}" fill="${obj.fill}" stroke="${obj.stroke}" stroke-width="${obj.strokeWidth}" rx="${obj.cornerRadius}" />`,
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${page.width}pt" height="${page.height}pt" viewBox="0 0 ${page.width} ${page.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${page.background}" />
  ${elementsSvg.join('\n  ')}
</svg>`;
}

export { exportDocumentToEpub } from './epubExporter';
