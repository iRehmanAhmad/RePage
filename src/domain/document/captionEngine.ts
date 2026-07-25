import type { Caption, RePageDocument } from './types';
import { formatPageNumber, toUrduNumerals } from '../unicode/pageNumbering';

/**
 * Returns localized prefix label for captions (e.g., 'شکل', 'جدول', 'مساوات').
 */
export function getCaptionPrefix(type: 'figure' | 'table' | 'equation', lang: 'ur' | 'en' = 'ur'): string {
  if (lang === 'ur') {
    switch (type) {
      case 'figure':
        return 'شکل';
      case 'table':
        return 'جدول';
      case 'equation':
        return 'مساوات';
    }
  } else {
    switch (type) {
      case 'figure':
        return 'Figure';
      case 'table':
        return 'Table';
      case 'equation':
        return 'Equation';
    }
  }
}

/**
 * Adds or updates a caption attached to a document object (picture, table, shape).
 */
export function addCaptionToObject(
  doc: RePageDocument,
  objectId: string,
  type: 'figure' | 'table' | 'equation',
  text: string,
  lang: 'ur' | 'en' = 'ur',
): RePageDocument {
  const existingCaptions = doc.captions ? Object.values(doc.captions) : [];
  const sameTypeCount = existingCaptions.filter((c) => c.type === type).length;
  const number = sameTypeCount + 1;

  const prefix = getCaptionPrefix(type, lang);
  const formattedNum = lang === 'ur' ? toUrduNumerals(number) : String(number);
  const label = `${prefix} ${formattedNum}`;

  const newCaption: Caption = {
    id: `caption_${type}_${objectId}`,
    objectId,
    type,
    number,
    label,
    text,
  };

  return {
    ...doc,
    captions: {
      ...doc.captions,
      [newCaption.id]: newCaption,
    },
  };
}

/**
 * Formats dynamic cross-reference string linking to a figure, table, or page reference.
 */
export function formatCrossReference(
  doc: RePageDocument,
  type: 'figure' | 'table' | 'heading' | 'page',
  targetId: string,
  lang: 'ur' | 'en' = 'ur',
): string {
  if (type === 'figure' || type === 'table') {
    const caption = doc.captions?.[targetId] || (doc.captions ? Object.values(doc.captions).find((c) => c.objectId === targetId) : undefined);
    if (caption) {
      const obj = doc.objects[caption.objectId];
      const pageIndex = obj ? doc.pageOrder.indexOf(obj.pageId) : 0;
      const formattedPage = formatPageNumber(pageIndex >= 0 ? pageIndex : 0, { style: lang === 'ur' ? 'urdu' : 'western' });

      if (lang === 'ur') {
        return `دیکھیں ${caption.label} (صفحہ ${formattedPage} پر)`;
      } else {
        return `See ${caption.label} (on page ${formattedPage})`;
      }
    }
  } else if (type === 'page') {
    const pageIndex = doc.pageOrder.indexOf(targetId);
    const formattedPage = formatPageNumber(pageIndex >= 0 ? pageIndex : 0, { style: lang === 'ur' ? 'urdu' : 'western' });
    return lang === 'ur' ? `صفحہ ${formattedPage}` : `Page ${formattedPage}`;
  }

  return targetId;
}
