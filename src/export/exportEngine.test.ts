import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import {
  computePrintMarks,
  exportDocumentToPdfMetadata,
  exportDocumentToSvg,
} from './exportEngine';

describe('exportEngine (M3.7)', () => {
  it('generates PDF metadata with Urdu locale attributes', () => {
    const doc = createStarterDocument();
    const metadata = exportDocumentToPdfMetadata(doc);

    expect(metadata.language).toBe('ur-PK');
    expect(metadata.creator).toContain('RePage');
    expect(metadata.title).toBeDefined();
  });

  it('computes prepress crop marks outside page bounds', () => {
    const bleed = { top: 9, right: 9, bottom: 9, left: 9 };
    const marks = computePrintMarks(595.28, 841.89, bleed);

    expect(marks.cropMarks).toHaveLength(8);
    expect(marks.bleedBox.width).toBeCloseTo(613.28, 1);
  });

  it('renders standalone SVG vector markup for document page', () => {
    const doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;

    const svgMarkup = exportDocumentToSvg(doc, pageId);

    expect(svgMarkup).toContain('<?xml version="1.0"');
    expect(svgMarkup).toContain('<svg');
    expect(svgMarkup).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svgMarkup).toContain('</svg>');
  });
});
