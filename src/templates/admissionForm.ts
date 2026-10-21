/**
 * داخلہ فارم (Admission form) — A4 portrait.
 *
 * School header, form number/date line and a photo box (an empty
 * rectangle — deliberately NOT an image frame, so the empty box stays
 * preflight-clean), student information fields with ruled answer
 * space, a guardian section, guardian signature, and a boxed
 * office-use section at the bottom.
 */
import type { RePageDocument } from '../domain/document/types';
import {
  A4_SPEC,
  addHorizontalRule,
  addRect,
  addTextFrame,
  newTemplateDocument,
  para,
  ruledLine,
  templatePageId,
} from './helpers';

const FIELDS: string[] = [
  'طالب علم کا نام: ______________________________',
  'ولدیت: ______________________________',
  'تاریخ پیدائش: ______________________________',
  'فارم ب نمبر: ______________________________',
  'جنس: ______________________________',
  'مذہب: ______________________________',
  'ذات/قوم: ______________________________',
  'مستقل پتہ: ______________________________',
  'موجودہ پتہ: ______________________________',
  'موبائل نمبر: ______________________________',
  'سابقہ اسکول: ______________________________',
  'آخری جماعت پاس: ______________________________',
];

export function buildAdmissionFormTemplate(): RePageDocument {
  const doc = newTemplateDocument('داخلہ فارم', A4_SPEC);
  const pageId = templatePageId(doc);

  // --- Header ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 15, w: 180, h: 28 },
    [
      para('[اسکول کا نام یہاں لکھیں]', { align: 'center', size: 20, bold: true, spaceAfter: 4 }),
      para('داخلہ فارم', { align: 'center', size: 17, bold: true, spaceAfter: 0 }),
    ],
    { fontSize: 14, name: 'Admission form header' },
  );
  addHorizontalRule(doc, pageId, 46, 15, 180, 1.5);

  // --- Photo box (top-left corner, empty rectangle + label) ---
  addRect(doc, pageId, { x: 15, y: 50, w: 35, h: 42 }, {
    fill: 'none',
    stroke: '#64748b',
    strokeWidth: 1,
    name: 'Photo box',
  });
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 66, w: 35, h: 10 },
    [para('تصویر', { align: 'center', size: 12, spaceAfter: 0 })],
    { fontSize: 12, name: 'Photo box label' },
  );

  // --- Form number / date ---
  addTextFrame(
    doc,
    pageId,
    { x: 56, y: 54, w: 139, h: 22 },
    [
      para('فارم نمبر: [___]', { size: 13, spaceAfter: 4 }),
      para('تاریخ: [___]', { size: 13, spaceAfter: 0 }),
    ],
    { fontSize: 13, name: 'Admission form meta' },
  );

  // --- Student information fields ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 98, w: 180, h: 116 },
    [
      para('طالب علم کی معلومات', { bold: true, size: 14, spaceAfter: 6 }),
      ...FIELDS.map((f) => para(f, { size: 13, spaceAfter: 5 })),
    ],
    { fontSize: 13, name: 'Admission form fields' },
  );

  // --- Guardian information ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 218, w: 180, h: 28 },
    [
      para('سرپرست کی معلومات', { bold: true, size: 13, spaceAfter: 4 }),
      para('سرپرست کا نام: ____________          رشتہ: ____________', { size: 13, spaceAfter: 3 }),
      para('موبائل نمبر: ____________          پیشہ: ____________', { size: 13, spaceAfter: 0 }),
    ],
    { fontSize: 13, name: 'Admission form guardian' },
  );

  // --- Guardian signature (bottom-left) ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 252, w: 70, h: 16 },
    [ruledLine(6), para('والد/سرپرست کے دستخط', { align: 'center', size: 12, spaceAfter: 0 })],
    { fontSize: 12, name: 'Admission form signature' },
  );

  // --- Office use box (bottom) ---
  addRect(doc, pageId, { x: 92, y: 248, w: 103, h: 32 }, {
    fill: 'none',
    stroke: '#64748b',
    strokeWidth: 1,
    name: 'Office use box',
  });
  addTextFrame(
    doc,
    pageId,
    { x: 95, y: 250, w: 97, h: 28 },
    [
      para('دفتر کے استعمال کے لیے', { bold: true, size: 12, spaceAfter: 3 }),
      para('داخلہ: منظور / نامنظور', { size: 11, spaceAfter: 2 }),
      para('جماعت: ______   رول نمبر: ______', { size: 11, spaceAfter: 2 }),
      para('دستخط دفتر: ____________', { size: 11, spaceAfter: 0 }),
    ],
    { fontSize: 11, name: 'Office use text' },
  );

  return doc;
}
