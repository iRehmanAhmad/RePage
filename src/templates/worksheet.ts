/**
 * ورک شیٹ (School worksheet) — A4.
 *
 * Title, name/class/date/roll-number line, three exercise sections with
 * ruled answer space, and a simple page border.
 */
import type { RePageDocument } from '../domain/document/types';
import type { ParagraphNode } from '../domain/rich-text/types';
import {
  A4_SPEC,
  addPageBorderExact,
  addTextFrame,
  mm,
  newTemplateDocument,
  para,
  ruledLine,
  templatePageId,
} from './helpers';

interface Exercise {
  heading: string;
  lines: number;
}

const EXERCISES: Exercise[] = [
  { heading: 'مشق ۱: درج ذیل الفاظ کے معنی لکھیں۔ (کتاب، قلم، استاد)', lines: 4 },
  { heading: 'مشق ۲: ان الفاظ سے جملے بنائیں۔ (محنت، وطن)', lines: 4 },
  { heading: 'مشق ۳: خالی جگہیں مناسب الفاظ سے پُر کریں۔', lines: 4 },
];

export function buildWorksheetTemplate(): RePageDocument {
  const doc = newTemplateDocument('ورک شیٹ — اردو', A4_SPEC);
  const pageId = templatePageId(doc);

  addPageBorderExact(doc, pageId, mm(8), 1.5);

  // --- Title ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 15, w: 180, h: 30 },
    [
      para('ورک شیٹ', { align: 'center', size: 24, bold: true, spaceAfter: 4 }),
      para('مضمون: [مضمون کا نام]          جماعت: [___]', {
        align: 'center',
        size: 14,
        spaceAfter: 0,
      }),
    ],
    { fontSize: 14, name: 'Worksheet title' },
  );

  // --- Student info line ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 50, w: 180, h: 14 },
    [
      para('نام: ____________       جماعت: ______       تاریخ: ____________       رول نمبر: ______', {
        size: 13,
        spaceAfter: 0,
      }),
    ],
    { fontSize: 13, name: 'Worksheet student info' },
  );

  // --- Exercise sections with ruled answer space ---
  let y = 70;
  for (const ex of EXERCISES) {
    const paras: ParagraphNode[] = [para(ex.heading, { bold: true, size: 14, spaceAfter: 6 })];
    for (let i = 0; i < ex.lines; i += 1) {
      paras.push(ruledLine(12));
    }
    const h = 14 + ex.lines * 12;
    addTextFrame(doc, pageId, { x: 15, y, w: 180, h }, paras, {
      fontSize: 13,
      lineHeight: 1.6,
      name: `Worksheet ${ex.heading.slice(0, 12)}`,
    });
    y += h + 8;
  }

  return doc;
}
