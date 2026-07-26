import { validateDocumentReferences } from '../document/schema';
import type { RePageDocument, TextFrameObject, ImageFrameObject } from '../document/types';
import { FONT_REGISTRY } from '../unicode/fontRegistry';

export type PreflightSeverity = 'error' | 'warning' | 'info';

export type PreflightCategory =
  | 'font'
  | 'text-overflow'
  | 'image'
  | 'license'
  | 'structure'
  | 'boundary';

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

export interface PreflightOptions {
  targetDpi?: number | undefined; // Default 300 for press, 150 for web
  pressReady?: boolean | undefined;
}

/**
 * Runs pre-flight diagnostics on a RePage document prior to export or printing.
 */
export function runPreflightCheck(
  doc: RePageDocument,
  options: PreflightOptions = {},
): PreflightResult {
  const { targetDpi = 300, pressReady = false } = options;
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
    // Page boundary check
    const activePage = doc.pages[pageObj.pageId] || Object.values(doc.pages)[0];
    if (activePage && pageObj.frame) {
      if (
        pageObj.frame.x < 0 ||
        pageObj.frame.y < 0 ||
        pageObj.frame.x + pageObj.frame.width > activePage.width ||
        pageObj.frame.y + pageObj.frame.height > activePage.height
      ) {
        issues.push({
          id: `boundary_${pageObj.id}`,
          severity: pressReady ? 'error' : 'warning',
          category: 'boundary',
          message: `عنصر صفحے کی سرحد سے باہر پھیل رہا ہے (Object ${pageObj.name || pageObj.id} extends beyond page boundaries)`,
          targetId: pageObj.id,
        });
      }
    }

    if (pageObj.type === 'text-frame') {
      const textFrame = pageObj as TextFrameObject;
      fontsUsed.add(textFrame.fontFamily);

      // 2. Overset Text Detection
      if (textFrame.overflow) {
        issues.push({
          id: `overflow_${textFrame.id}`,
          severity: pressReady ? 'error' : 'warning',
          category: 'text-overflow',
          message: `ٹیکسٹ فریم میں متن زیادہ ہے (Overset text in frame ${textFrame.name || textFrame.id})`,
          targetId: textFrame.id,
        });
      }
    } else if (pageObj.type === 'image-frame') {
      const imgFrame = pageObj as ImageFrameObject;
      // 3. Image Asset Resolution & DPI Check
      if (!imgFrame.assetId) {
        issues.push({
          id: `img_missing_${imgFrame.id}`,
          severity: 'warning',
          category: 'image',
          message: `تصویری فریم خالی ہے (Empty image frame ${imgFrame.name || imgFrame.id})`,
          targetId: imgFrame.id,
        });
      } else {
        const asset = doc.assets[imgFrame.assetId];
        if (!asset) {
          issues.push({
            id: `img_unresolved_${imgFrame.id}`,
            severity: 'error',
            category: 'image',
            message: `تصویری ایسٹ غائب ہے (Missing image asset ${imgFrame.assetId})`,
            targetId: imgFrame.id,
          });
        } else if (imgFrame.frame) {
          // Calculate effective image DPI based on width in points (72 points = 1 inch)
          const widthInInches = Math.max(0.1, imgFrame.frame.width / 72);
          // Standard estimate: 1000px width asset
          const estimatedPixelWidth = 800;
          const effectiveDpi = Math.round(estimatedPixelWidth / widthInInches);

          if (effectiveDpi < targetDpi) {
            issues.push({
              id: `img_dpi_${imgFrame.id}`,
              severity: pressReady && effectiveDpi < 150 ? 'error' : 'warning',
              category: 'image',
              message: `تصویر کی کوالٹی کم ہے (${effectiveDpi} DPI < ${targetDpi} DPI target for press print)`,
              targetId: imgFrame.id,
            });
          }
        }
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
