/**
 * لیٹر ہیڈ (Letterhead) — A4.
 *
 * Organization header with address/phone placeholders, a rule, ref-no + date
 * line, body area, and a signature block.
 */
import type { RePageDocument } from '../domain/document/types';
import {
  A4_SPEC,
  addHorizontalRule,
  addTextFrame,
  newTemplateDocument,
  para,
  templatePageId,
} from './helpers';

export function buildLetterheadTemplate(): RePageDocument {
  const doc = newTemplateDocument('لیٹر ہیڈ', A4_SPEC);
  const pageId = templatePageId(doc);

  // --- Organization header ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 15, w: 180, h: 40 },
    [
      para('[ادارے کا نام یہاں لکھیں]', { align: 'center', size: 24, bold: true, spaceAfter: 4 }),
      para('[مکمل پتہ، شہر]', { align: 'center', size: 13, spaceAfter: 2 }),
      para('فون: [___]          ای میل: [___]', { align: 'center', size: 13, spaceAfter: 0 }),
    ],
    { fontSize: 13, name: 'Letterhead header' },
  );
  addHorizontalRule(doc, pageId, 58, 15, 180, 2);

  // --- Ref no + date line ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 64, w: 180, h: 12 },
    [para('حوالہ نمبر: [______]                   تاریخ: [______]', { size: 13, spaceAfter: 0 })],
    { fontSize: 13, name: 'Letterhead ref line' },
  );

  // --- Body area ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 84, w: 180, h: 120 },
    [
      para('بخدمت جناب [نام]،', { size: 14, spaceAfter: 6 }),
      para('السلام علیکم!', { size: 14, spaceAfter: 6 }),
      para('[خط کا متن یہاں لکھیں۔ ضرورت کے مطابق پیراگراف کا اضافہ کریں۔]', {
        size: 14,
        spaceAfter: 6,
      }),
      para('[دوسرا پیراگراف یہاں لکھیں۔]', { size: 14, spaceAfter: 12 }),
      para('فقط،', { size: 14, spaceAfter: 0 }),
    ],
    { fontSize: 14, lineHeight: 1.8, name: 'Letterhead body' },
  );

  // --- Signature block ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 214, w: 80, h: 40 },
    [
      para('دستخط: ____________', { align: 'end', size: 14, spaceAfter: 4 }),
      para('[نام]', { align: 'end', size: 14, spaceAfter: 2 }),
      para('[عہدہ]', { align: 'end', size: 13, spaceAfter: 0 }),
    ],
    { fontSize: 14, name: 'Letterhead signature' },
  );

  return doc;
}
