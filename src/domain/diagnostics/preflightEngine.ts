import { validateDocumentReferences } from '../document/schema';
import type { RePageDocument, TextFrameObject } from '../document/types';
import { FONT_REGISTRY } from '../unicode/fontRegistry';

export type PreflightSeverity = 'error' | 'warning' | 'info';

export type PreflightCategory =
  | 'font'
  | 'text-overflow'
  | 'image'
  | 'license'
  | 'structure';

export interface PreflightIssue {
  id: string;
  severity: PreflightSeverity;
  category: PreflightCategory;
  message: string;
  details?: string | undefined;
  targetId?: string | undefined;
}

export interface PreflightResult {
  passed: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issues: PreflightIssue[];
}

/**
 * Runs pre-flight diagnostics on a RePage document prior to export or printing.
 */
export function runPreflightCheck(doc: RePageDocument): PreflightResult {
  const issues: PreflightIssue[] = [];

  // 1. Structure Reference Integrity Check
  const structErrors = validateDocumentReferences(doc);
  for (const err of structErrors) {
    issues.push({
      id: `struct_${issues.length + 1}`,
      severity: 'error',
      category: 'structure',
      message: `دستاویز کا ڈھانچہ غلط ہے (Document structure error): ${err}`,
    });
  }

  // Collect all fonts used in text frames
  const fontsUsed = new Set<string>();

  for (const pageObj of Object.values(doc.objects)) {
    if (pageObj.type === 'text-frame') {
      const textFrame = pageObj as TextFrameObject;
      fontsUsed.add(textFrame.fontFamily);

      // 2. Overset Text Detection
      if (textFrame.overflow) {
        issues.push({
          id: `overflow_${textFrame.id}`,
          severity: 'warning',
          category: 'text-overflow',
          message: `ٹیکسٹ فریم میں متن زیادہ ہے (Overset text in frame ${textFrame.name || textFrame.id})`,
          targetId: textFrame.id,
        });
      }
    } else if (pageObj.type === 'image-frame') {
      // 3. Image Asset Resolution Check
      if (!pageObj.assetId) {
        issues.push({
          id: `img_missing_${pageObj.id}`,
          severity: 'warning',
          category: 'image',
          message: `تصویری فریم خالی ہے (Empty image frame ${pageObj.name || pageObj.id})`,
          targetId: pageObj.id,
        });
      } else if (!doc.assets[pageObj.assetId]) {
        issues.push({
          id: `img_unresolved_${pageObj.id}`,
          severity: 'error',
          category: 'image',
          message: `تصویری ایسٹ غائب ہے (Missing image asset ${pageObj.assetId})`,
          targetId: pageObj.id,
        });
      }
    }
  }

  // 4. Font Availability & License Compliance Check
  for (const fontName of fontsUsed) {
    const fontInfo = Object.values(FONT_REGISTRY).find(
      (f) => f.name.toLowerCase() === fontName.toLowerCase() || f.id.toLowerCase() === fontName.toLowerCase(),
    );

    if (!fontInfo) {
      issues.push({
        id: `font_unregistered_${fontName}`,
        severity: 'warning',
        category: 'font',
        message: `فونٹ کا اندراج موجود نہیں ہے (Unregistered font: ${fontName})`,
      });
    } else if (fontInfo.license === 'Proprietary') {
      issues.push({
        id: `font_license_${fontName}`,
        severity: 'error',
        category: 'license',
        message: `فونٹ لائسنس محدود ہے (Restricted font license: ${fontName})`,
      });
    }
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  return {
    passed: errorCount === 0,
    errorCount,
    warningCount,
    infoCount,
    issues,
  };
}
