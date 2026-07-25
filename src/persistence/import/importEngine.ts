import { RichTextDocument } from '../../domain/rich-text/types';
import { PageObject } from '../../domain/document/types';

export type ImportFormat = 'txt' | 'rtf' | 'html' | 'docx' | 'svg' | 'pdf';

export interface ResourceLimits {
  maxFileSizeBytes: number;
  maxParagraphCount: number;
  maxVectorElements: number;
  parseTimeoutMs: number;
}

export const DEFAULT_RESOURCE_LIMITS: ResourceLimits = {
  maxFileSizeBytes: 50 * 1024 * 1024, // 50 MB
  maxParagraphCount: 50000,
  maxVectorElements: 10000,
  parseTimeoutMs: 5000,
};

export interface ImportOptions {
  format?: ImportFormat;
  resourceLimits?: Partial<ResourceLimits>;
  defaultDirection?: 'rtl' | 'ltr';
}

export interface ImportTextResult {
  type: 'story';
  story: RichTextDocument;
  paragraphCount: number;
  wordCount: number;
  detectedFormat: ImportFormat;
  warnings: string[];
}

export interface ImportVectorResult {
  type: 'vector';
  objects: PageObject[];
  elementCount: number;
  detectedFormat: 'svg';
  warnings: string[];
}

export interface ImportPdfResult {
  type: 'pdf';
  assetId: string;
  pageCount: number;
  widthPoints: number;
  heightPoints: number;
  detectedFormat: 'pdf';
  warnings: string[];
}

export type ImportResult = ImportTextResult | ImportVectorResult | ImportPdfResult;

export function detectFormatFromFilename(filename: string): ImportFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.txt')) return 'txt';
  if (lower.endsWith('.rtf')) return 'rtf';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.svg')) return 'svg';
  if (lower.endsWith('.pdf')) return 'pdf';
  return 'txt';
}

export function validateResourceLimits(
  fileSize: number,
  limits: ResourceLimits = DEFAULT_RESOURCE_LIMITS,
): void {
  if (fileSize > limits.maxFileSizeBytes) {
    throw new Error(
      `File size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds maximum limit of ${(limits.maxFileSizeBytes / (1024 * 1024)).toFixed(2)} MB`,
    );
  }
}
