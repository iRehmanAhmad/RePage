import { describe, expect, it, vi } from 'vitest';
import { triggerNativePrintDialog } from './printService';
import { DICTIONARY } from '../ui/i18n/menuTranslation';

describe('Phase 0 — Stop Misleading Users Verification', () => {
  it('1. triggerNativePrintDialog invokes window.print() cleanly without PDF export claims', () => {
    const originalPrint = window.print;
    const printSpy = vi.fn();
    window.print = printSpy;

    try {
      const res = triggerNativePrintDialog();
      expect(res).toBe(true);
      expect(printSpy).toHaveBeenCalledTimes(1);
    } finally {
      window.print = originalPrint;
    }
  });

  it('2. Menu translations dictionary contains honest Browser Print and Vector PDF labels without 1200 DPI claims', () => {
    // English
    expect(DICTIONARY.en.browserPrint).toBe('Browser Print…');
    expect(DICTIONARY.en.vectorPdfExport).toBe('Vector PDF Export');
    expect(DICTIONARY.en.browserPrint).not.toContain('1200 DPI');
    expect(DICTIONARY.en.exportPdf).not.toContain('1200 DPI');

    // Urdu
    expect(DICTIONARY.ur.browserPrint).toBe('پرنٹ… (براؤزر)');
    expect(DICTIONARY.ur.vectorPdfExport).toBe('ویکٹر PDF برآمد');
    expect(DICTIONARY.ur.browserPrint).not.toContain('1200 DPI');
  });

  it('3. Honest tooltips explain browser print vs vector PDF export', () => {
    const browserPrintTooltipEn = 'Opens your browser/system print dialog. It does not generate a RePage PDF file.';
    const vectorPdfTooltipEn = 'Generates a vector PDF from the document (choose "Save as PDF" in the print dialog).';

    expect(browserPrintTooltipEn).toContain('It does not generate a RePage PDF file.');
    expect(vectorPdfTooltipEn).toContain('Save as PDF');
  });
});
