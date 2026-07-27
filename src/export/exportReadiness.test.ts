import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import { insertSectionBreakCommand } from '../editor/commands/pageLayoutCommands';
import {
  calculateExportMemoryEstimate,
  checkExportReadiness,
  validateExportPageRange,
} from './exportReadiness';
import type { ExportOptions } from './types';

describe('exportReadiness engine', () => {
  it('validates page ranges against document page order', () => {
    let doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    doc = insertSectionBreakCommand(doc, p1, 'next-page'); // 2 pages total

    // Range 'all'
    const resAll = validateExportPageRange(doc, { kind: 'all' });
    expect(resAll.isValid).toBe(true);
    expect(resAll.resolvedPageIds).toHaveLength(2);

    // Range 'current-page'
    const resCur = validateExportPageRange(doc, { kind: 'current-page', pageId: p1 });
    expect(resCur.isValid).toBe(true);
    expect(resCur.resolvedPageIds).toEqual([p1]);

    // Range 'custom' valid (1 to 2)
    const resCustomValid = validateExportPageRange(doc, { kind: 'custom', from: 1, to: 2 });
    expect(resCustomValid.isValid).toBe(true);
    expect(resCustomValid.resolvedPageIds).toHaveLength(2);

    // Range 'custom' invalid (start > end)
    const resCustomInvalid1 = validateExportPageRange(doc, { kind: 'custom', from: 2, to: 1 });
    expect(resCustomInvalid1.isValid).toBe(false);
    expect(resCustomInvalid1.errorMessageEn).toContain('cannot exceed');

    // Range 'custom' invalid (out of bounds)
    const resCustomInvalid2 = validateExportPageRange(doc, { kind: 'custom', from: 1, to: 5 });
    expect(resCustomInvalid2.isValid).toBe(false);
    expect(resCustomInvalid2.errorMessageEn).toContain('exceeds total');
  });

  it('calculates pixel dimensions and memory estimate for high DPI raster formats', () => {
    const doc = createStarterDocument();
    const options: ExportOptions = {
      format: 'png',
      pageRange: { kind: 'all' },
      dpi: 300,
      outputName: 'TestOutput',
    };

    const est = calculateExportMemoryEstimate(doc, options);
    expect(est).toBeDefined();
    // A4 (210x297mm = 595.28x841.89 pt) at 300 DPI:
    // 595.28 / 72 * 300 approx 2480 pixels
    // 841.89 / 72 * 300 approx 3508 pixels
    expect(est?.widthPixels).toBeGreaterThanOrEqual(2470);
    expect(est?.widthPixels).toBeLessThanOrEqual(2490);
    expect(est?.heightPixels).toBeGreaterThanOrEqual(3500);
    expect(est?.heightPixels).toBeLessThanOrEqual(3520);
  });

  it('blocks export on un-implemented formats and preflight errors', () => {
    const doc = createStarterDocument();

    // Unimplemented format 'raster-pdf'
    const options1: ExportOptions = {
      format: 'raster-pdf',
      pageRange: { kind: 'all' },
      outputName: 'UnimplementedFormat',
    };

    const report1 = checkExportReadiness(doc, options1);
    expect(report1.canExport).toBe(false);
    expect(report1.blockingReasonsEn[0]).toContain('currently unavailable');

    // Implemented format 'browser-print'
    const options2: ExportOptions = {
      format: 'browser-print',
      pageRange: { kind: 'all' },
      outputName: 'BrowserPrint',
    };

    const report2 = checkExportReadiness(doc, options2);
    expect(report2.canExport).toBe(true);
    expect(report2.blockingReasonsEn).toHaveLength(0);
  });
});
