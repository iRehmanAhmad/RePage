/**
 * شادی کارڈ (Shaadi / wedding card) — 5×7 inch card.
 *
 * Centered ornamental layout: bismillah header, decorative double border,
 * couple names in a large decorative face, event details and RSVP line.
 */
import type { RePageDocument } from '../domain/document/types';
import {
  CARD_5X7_SPEC,
  FONT_DECORATIVE,
  addPageBorderExact,
  addRect,
  addTextFrame,
  mm,
  newTemplateDocument,
  para,
  templatePageId,
} from './helpers';

export function buildShaadiCardTemplate(): RePageDocument {
  const doc = newTemplateDocument('شادی کارڈ', CARD_5X7_SPEC);
  const pageId = templatePageId(doc);

  // Double ornamental border.
  addPageBorderExact(doc, pageId, mm(5), 2);
  addPageBorderExact(doc, pageId, mm(8), 0.75);

  // --- Bismillah header ---
  addTextFrame(
    doc,
    pageId,
    { x: 17, y: 16, w: 93, h: 14 },
    [para('بسم اللہ الرحمٰن الرحیم', { align: 'center', size: 17, spaceAfter: 0 })],
    { fontSize: 17, name: 'Card bismillah' },
  );

  // Decorative divider under the header.
  addRect(doc, pageId, { x: 43.5, y: 34, w: 40, h: 0.5 }, {
    fill: '#b45309',
    stroke: '#b45309',
    strokeWidth: 1,
    name: 'Card divider top',
  });

  // --- Couple names ---
  addTextFrame(
    doc,
    pageId,
    { x: 17, y: 40, w: 93, h: 18 },
    [para('[دولہے کا نام]', { align: 'center', size: 30, bold: true, spaceAfter: 0 })],
    { fontSize: 30, fontFamily: FONT_DECORATIVE, name: 'Groom name' },
  );
  addTextFrame(
    doc,
    pageId,
    { x: 17, y: 60, w: 93, h: 10 },
    [para('ولد [والد کا نام]', { align: 'center', size: 15, spaceAfter: 0 })],
    { fontSize: 15, name: 'Groom father' },
  );
  addTextFrame(
    doc,
    pageId,
    { x: 17, y: 72, w: 93, h: 10 },
    [para('کی شادی', { align: 'center', size: 17, spaceAfter: 0 })],
    { fontSize: 17, name: 'Wedding connector' },
  );
  addTextFrame(
    doc,
    pageId,
    { x: 17, y: 84, w: 93, h: 18 },
    [para('[دلہن کا نام]', { align: 'center', size: 30, bold: true, spaceAfter: 0 })],
    { fontSize: 30, fontFamily: FONT_DECORATIVE, name: 'Bride name' },
  );
  addTextFrame(
    doc,
    pageId,
    { x: 17, y: 104, w: 93, h: 10 },
    [para('بنت [والد کا نام]', { align: 'center', size: 15, spaceAfter: 0 })],
    { fontSize: 15, name: 'Bride father' },
  );
  addTextFrame(
    doc,
    pageId,
    { x: 17, y: 116, w: 93, h: 10 },
    [para('کے ساتھ طے پائی ہے', { align: 'center', size: 15, spaceAfter: 0 })],
    { fontSize: 15, name: 'Wedding announcement' },
  );

  // Decorative divider above the details.
  addRect(doc, pageId, { x: 43.5, y: 130, w: 40, h: 0.5 }, {
    fill: '#b45309',
    stroke: '#b45309',
    strokeWidth: 1,
    name: 'Card divider bottom',
  });

  // --- Event details ---
  addTextFrame(
    doc,
    pageId,
    { x: 17, y: 134, w: 93, h: 28 },
    [
      para('بروز: [دن]          بتاریخ: [تاریخ]', { align: 'center', size: 14, spaceAfter: 4 }),
      para('بوقت: [وقت]          بمقام: [مقام]', { align: 'center', size: 14, spaceAfter: 4 }),
      para('آپ کی شرکت ہمارے لیے باعثِ مسرت ہوگی', {
        align: 'center',
        size: 13,
        spaceAfter: 4,
      }),
      para('رابطہ: [فون نمبر]', { align: 'center', size: 13, spaceAfter: 0 }),
    ],
    { fontSize: 14, name: 'Card event details' },
  );

  return doc;
}
