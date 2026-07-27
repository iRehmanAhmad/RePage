import type { RePageDocument } from '../domain/document/types';
import { runPreflightCheck, type PreflightResult } from '../domain/diagnostics/preflightEngine';
import { ExportOptions, FORMAT_CAPABILITIES } from './types';

export interface PageRangeValidationResult {
  isValid: boolean;
  resolvedPageIds: string[];
  errorMessageEn?: string | undefined;
  errorMessageUr?: string | undefined;
}

export interface ExportMemoryEstimate {
  widthPixels: number;
  heightPixels: number;
  estimatedMemoryBytes: number;
  isHighMemoryRisk: boolean;
  warningEn?: string | undefined;
  warningUr?: string | undefined;
}

export interface ExportReadinessReport {
  options: ExportOptions;
  preflight: PreflightResult;
  rangeValidation: PageRangeValidationResult;
  memoryEstimate?: ExportMemoryEstimate | undefined;
  canExport: boolean;
  blockingReasonsEn: string[];
  blockingReasonsUr: string[];
  warningsEn: string[];
  warningsUr: string[];
}

/**
 * Validates a given page range against doc.pageOrder.
 */
export function validateExportPageRange(
  doc: RePageDocument,
  range: ExportOptions['pageRange'],
): PageRangeValidationResult {
  const totalPages = doc.pageOrder.length;

  if (totalPages === 0) {
    return {
      isValid: false,
      resolvedPageIds: [],
      errorMessageEn: 'Document has no pages.',
      errorMessageUr: 'دستاویز میں کوئی صفحہ نہیں ہے۔',
    };
  }

  switch (range.kind) {
    case 'all':
      return {
        isValid: true,
        resolvedPageIds: [...doc.pageOrder],
      };

    case 'current-page':
      if (doc.pages[range.pageId]) {
        return {
          isValid: true,
          resolvedPageIds: [range.pageId],
        };
      }
      return {
        isValid: false,
        resolvedPageIds: [],
        errorMessageEn: `Current page ${range.pageId} does not exist in document.`,
        errorMessageUr: `موجودہ صفحہ ${range.pageId} دستاویز میں موجود نہیں ہے۔`,
      };

    case 'custom': {
      const from = Math.floor(range.from);
      const to = Math.floor(range.to);

      if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < 1) {
        return {
          isValid: false,
          resolvedPageIds: [],
          errorMessageEn: 'Page numbers must be positive integers starting from 1.',
          errorMessageUr: 'صفحہ کے نمبر ۱ یا اس سے زیادہ مثبت ہندسے ہونے چاہئیں۔',
        };
      }

      if (from > to) {
        return {
          isValid: false,
          resolvedPageIds: [],
          errorMessageEn: `Start page (${from}) cannot exceed end page (${to}).`,
          errorMessageUr: `ابتدائی صفحہ (${from}) آخری صفحہ (${to}) سے بڑا نہیں ہو سکتا۔`,
        };
      }

      if (to > totalPages) {
        return {
          isValid: false,
          resolvedPageIds: [],
          errorMessageEn: `Requested page ${to} exceeds total document pages (${totalPages}).`,
          errorMessageUr: `مطلوبہ صفحہ ${to} کل صفحات (${totalPages}) سے تجاوز کر رہا ہے۔`,
        };
      }

      const resolvedPageIds = doc.pageOrder.slice(from - 1, to);
      return {
        isValid: true,
        resolvedPageIds,
      };
    }
  }
}

/**
 * Calculates estimated raster dimensions and RGBA memory footprint for high DPI exports.
 */
export function calculateExportMemoryEstimate(
  doc: RePageDocument,
  options: ExportOptions,
  targetPageId?: string,
): ExportMemoryEstimate | undefined {
  if (!options.dpi) return undefined;

  const firstPageId = targetPageId || doc.pageOrder[0];
  const page = firstPageId ? doc.pages[firstPageId] : undefined;
  const widthPoints = page ? page.width : 595.28;
  const heightPoints = page ? page.height : 841.89;

  const widthInches = widthPoints / 72;
  const heightInches = heightPoints / 72;

  const widthPixels = Math.round(widthInches * options.dpi);
  const heightPixels = Math.round(heightInches * options.dpi);

  // 4 bytes per pixel (RGBA)
  const bytesPerPage = widthPixels * heightPixels * 4;

  let pageCount = 1;
  if (options.pageRange.kind === 'all') {
    pageCount = doc.pageOrder.length;
  } else if (options.pageRange.kind === 'custom') {
    pageCount = Math.max(1, options.pageRange.to - options.pageRange.from + 1);
  }

  const estimatedMemoryBytes = bytesPerPage * pageCount;
  // 250 MB threshold for high memory risk warning
  const isHighMemoryRisk = estimatedMemoryBytes > 250 * 1024 * 1024;

  let warningEn: string | undefined;
  let warningUr: string | undefined;

  if (isHighMemoryRisk) {
    const mb = Math.round(estimatedMemoryBytes / (1024 * 1024));
    warningEn = `High Memory Risk: Exporting ${pageCount} page(s) at ${options.dpi} DPI requires approx ~${mb} MB RAM.`;
    warningUr = `زیادہ میموری کا خطرہ: ${options.dpi} DPI پر ${pageCount} صفحات برآمد کرنے کے لیے ~${mb} MB ریم درکار ہے۔`;
  }

  return {
    widthPixels,
    heightPixels,
    estimatedMemoryBytes,
    isHighMemoryRisk,
    warningEn,
    warningUr,
  };
}

/**
 * Evaluates document preflight, page range, format capability, and memory risks to produce a full export readiness report.
 */
export function checkExportReadiness(
  doc: RePageDocument,
  options: ExportOptions,
): ExportReadinessReport {
  const capability = FORMAT_CAPABILITIES[options.format];
  const preflight = runPreflightCheck(doc);
  const rangeValidation = validateExportPageRange(doc, options.pageRange);
  const memoryEstimate = calculateExportMemoryEstimate(doc, options);

  const blockingReasonsEn: string[] = [];
  const blockingReasonsUr: string[] = [];
  const warningsEn: string[] = [];
  const warningsUr: string[] = [];

  // Check format implementation state
  if (!capability.isImplemented) {
    blockingReasonsEn.push(`Format '${capability.labelEn}' is currently unavailable until implemented.`);
    blockingReasonsUr.push(`فارمیٹ '${capability.labelUr}' فی الحال تیار نہیں ہے۔`);
  }

  // Check page range validity
  if (!rangeValidation.isValid) {
    if (rangeValidation.errorMessageEn) blockingReasonsEn.push(rangeValidation.errorMessageEn);
    if (rangeValidation.errorMessageUr) blockingReasonsUr.push(rangeValidation.errorMessageUr);
  }

  // Check Preflight Errors (Blocks Export)
  if (preflight.errorCount > 0) {
    blockingReasonsEn.push(`Preflight check failed with ${preflight.errorCount} error(s). Please fix preflight errors before exporting.`);
    blockingReasonsUr.push(`پریفلاٹ ٹیسٹ میں ${preflight.errorCount} غلطیاں ملیں۔ برآمد سے پہلے پریفلاٹ غلطیاں درست کریں۔`);
  }

  // Check Preflight Warnings (Requires User Confirmation)
  if (preflight.warningCount > 0) {
    warningsEn.push(`Preflight reported ${preflight.warningCount} warning(s) (e.g. overflow, missing asset references).`);
    warningsUr.push(`پریفلاٹ میں ${preflight.warningCount} تنبیہات موجود ہیں۔`);
  }

  // Check Font and Asset Warnings
  const fontIssues = preflight.issues.filter((i) => i.message.toLowerCase().includes('font'));
  for (const issue of fontIssues) {
    warningsEn.push(`Notice: ${issue.message}`);
    warningsUr.push(`اطلاع: ${issue.message}`);
  }

  // Check Memory Risk Warning
  if (memoryEstimate?.isHighMemoryRisk && memoryEstimate.warningEn) {
    warningsEn.push(memoryEstimate.warningEn);
    if (memoryEstimate.warningUr) warningsUr.push(memoryEstimate.warningUr);
  }

  const canExport = blockingReasonsEn.length === 0;

  return {
    options,
    preflight,
    rangeValidation,
    memoryEstimate,
    canExport,
    blockingReasonsEn,
    blockingReasonsUr,
    warningsEn,
    warningsUr,
  };
}
