import type { RePageDocument } from '../document/types';
import { PRIMARY_STORY_ID } from '../document/createDocument';

export interface AccessibilityIssue {
  id: string;
  severity: 'error' | 'warning';
  message: string;
  messageUrdu: string;
  targetId?: string;
}

/**
 * Audits a document for WCAG accessibility compliance issues.
 */
export function runAccessibilityAudit(doc: RePageDocument): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check 1: Missing image Alt Text
  Object.values(doc.objects || {}).forEach((obj) => {
    if (obj.type === 'image-frame') {
      const altText = (obj as unknown as { altText?: string }).altText;
      if (!altText || !altText.trim()) {
        issues.push({
          id: `acc_alt_${obj.id}`,
          severity: 'error',
          message: `Image object '${obj.name}' is missing descriptive Alt Text`,
          messageUrdu: `تصویر '${obj.name}' کی متبادل کیپشن (Alt Text) موجود نہیں ہے`,
          targetId: obj.id,
        });
      }
    }
  });

  // Check 2: Missing document title
  if (!doc.metadata?.title || doc.metadata.title.trim() === 'Untitled Document') {
    issues.push({
      id: 'acc_title_missing',
      severity: 'warning',
      message: 'Document is missing a descriptive title in metadata',
      messageUrdu: 'دستاویز کا عنوان محفوظ نہیں ہے',
    });
  }

  // Check 3: Structured heading presence in long documents
  const primaryStory = doc.stories[PRIMARY_STORY_ID];
  if (primaryStory?.content?.content) {
    const totalParas = primaryStory.content.content.length;
    if (totalParas > 15) {
      const hasHeadings = primaryStory.content.content.some((p) => {
        const text = p.content.map((r) => (r.type === 'text' ? r.text : '')).join('');
        return /^(باب|عنوان|فصل|Chapter|Section)\b/i.test(text.trim());
      });

      if (!hasHeadings) {
        issues.push({
          id: 'acc_headings_missing',
          severity: 'warning',
          message: 'Long document lacks structural headings for screen reader navigation',
          messageUrdu: 'طویل دستاویز میں سرخیوں (Headings) کا ہیکلی ترقیم موجود نہیں ہے',
        });
      }
    }
  }

  return issues;
}
