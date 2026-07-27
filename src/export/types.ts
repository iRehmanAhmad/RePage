import type { PageId } from '../domain/document/types';

export type ExportFormat = 'browser-print' | 'epub' | 'svg' | 'png' | 'jpeg' | 'raster-pdf';

export type ExportPageRange =
  | { kind: 'all' }
  | { kind: 'current-page'; pageId: PageId }
  | { kind: 'custom'; from: number; to: number };

export interface ExportOptions {
  format: ExportFormat;
  pageRange: ExportPageRange;
  dpi?: 150 | 300 | 600 | undefined;
  includeBackground?: boolean | undefined;
  includeBleed?: boolean | undefined;
  includeCropMarks?: boolean | undefined;
  outputName: string;
}

export interface FormatCapability {
  format: ExportFormat;
  labelEn: string;
  labelUr: string;
  descriptionEn: string;
  descriptionUr: string;
  isImplemented: boolean;
  supportsDpi: boolean;
  supportsBleed: boolean;
  supportsCropMarks: boolean;
  supportsBackground: boolean;
}

export const FORMAT_CAPABILITIES: Record<ExportFormat, FormatCapability> = {
  'browser-print': {
    format: 'browser-print',
    labelEn: 'Browser Print…',
    labelUr: 'پرنٹ… (براؤزر)',
    descriptionEn: 'Opens your browser/system print dialog. It does not generate a RePage PDF file.',
    descriptionUr: 'سسٹم کا پرنٹ ڈائیلاگ کھولتا ہے۔ یہ RePage PDF فائل نہیں بناتا۔',
    isImplemented: true,
    supportsDpi: false,
    supportsBleed: false,
    supportsCropMarks: false,
    supportsBackground: false,
  },
  epub: {
    format: 'epub',
    labelEn: 'Reflowable ePUB 3.0',
    labelUr: 'ePUB 3.0 ای بک',
    descriptionEn: 'Reflowable eBook output with RTL Nastaliq typography.',
    descriptionUr: 'اردو نستعلیق فونٹس کے ساتھ ری فلو ایبل ای بک برآمد۔',
    isImplemented: true,
    supportsDpi: false,
    supportsBleed: false,
    supportsCropMarks: false,
    supportsBackground: false,
  },
  svg: {
    format: 'svg',
    labelEn: 'Vector SVG Page',
    labelUr: 'ویکٹر SVG صفحہ',
    descriptionEn: 'Vector page graphics output (Requires complete renderer).',
    descriptionUr: 'صفحہ کا ویکٹر ڈرائنگ فارمیٹ برآمد۔',
    isImplemented: false,
    supportsDpi: false,
    supportsBleed: true,
    supportsCropMarks: true,
    supportsBackground: true,
  },
  png: {
    format: 'png',
    labelEn: 'PNG Image',
    labelUr: 'PNG تصویر',
    descriptionEn: 'High-resolution lossless page raster image.',
    descriptionUr: 'اعلی کوالٹی پی این جی تصویر برآمد۔',
    isImplemented: false,
    supportsDpi: true,
    supportsBleed: true,
    supportsCropMarks: true,
    supportsBackground: true,
  },
  jpeg: {
    format: 'jpeg',
    labelEn: 'JPEG Image',
    labelUr: 'JPEG تصویر',
    descriptionEn: 'High-resolution compressed page raster image.',
    descriptionUr: 'جے پی ای جی تصویر برآمد۔',
    isImplemented: false,
    supportsDpi: true,
    supportsBleed: true,
    supportsCropMarks: true,
    supportsBackground: true,
  },
  'raster-pdf': {
    format: 'raster-pdf',
    labelEn: 'Raster PDF',
    labelUr: 'راسٹر پی ڈی ایف',
    descriptionEn: 'Page image PDF output (Currently unavailable until Phase 6).',
    descriptionUr: 'راسٹر پی ڈی ایف فارمیٹ (فی الحال غیر دستیاب)۔',
    isImplemented: false,
    supportsDpi: true,
    supportsBleed: true,
    supportsCropMarks: true,
    supportsBackground: true,
  },
};
