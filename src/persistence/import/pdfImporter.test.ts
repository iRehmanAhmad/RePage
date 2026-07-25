import { describe, expect, it } from 'vitest';
import { importPdfPage } from './pdfImporter';

describe('pdfImporter', () => {
  it('validates PDF magic header and extracts page bounds and SHA-256 asset ID', async () => {
    const pdfHeader = '%PDF-1.7\n1 0 obj\n<< /Type /Page /MediaBox [0 0 595.28 841.89] >>\nendobj\n';
    const buffer = new TextEncoder().encode(pdfHeader).buffer;

    const result = await importPdfPage(buffer);

    expect(result.type).toBe('pdf');
    expect(result.detectedFormat).toBe('pdf');
    expect(result.assetId).toBeDefined();
    expect(result.widthPoints).toBeCloseTo(595.28);
    expect(result.heightPoints).toBeCloseTo(841.89);
  });

  it('rejects invalid non-PDF buffers', async () => {
    const invalidBuffer = new TextEncoder().encode('NOT_A_PDF_FILE').buffer;
    await expect(importPdfPage(invalidBuffer)).rejects.toThrow(/Invalid PDF format/);
  });
});
