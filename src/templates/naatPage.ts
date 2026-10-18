/**
 * نعت کا صفحہ (Naat booklet page) — A5.
 *
 * Centered verse layout with generous line spacing, a page border and a
 * page number — the religious-printing staple of composing shops.
 * Verses are the widely-reproduced traditional kalam "مصطفیٰ جانِ رحمت".
 */
import type { RePageDocument } from '../domain/document/types';
import {
  A5_SPEC,
  addPageBorderExact,
  addTextFrame,
  mm,
  newTemplateDocument,
  para,
  templatePageId,
} from './helpers';

const VERSES: string[] = [
  'مصطفیٰ جانِ رحمت پہ لاکھوں سلام',
  'شمعِ بزمِ ہدایت پہ لاکھوں سلام',
  '',
  'ہم غریبوں کے آقا پہ بے حد سلام',
  'ہم فقیروں کے مولیٰ پہ بے حد سلام',
];

export function buildNaatPageTemplate(): RePageDocument {
  const doc = newTemplateDocument('نعتِ رسولِ مقبول ﷺ', A5_SPEC);
  const pageId = templatePageId(doc);

  addPageBorderExact(doc, pageId, mm(8), 1.5);

  // --- Title ---
  addTextFrame(
    doc,
    pageId,
    { x: 18, y: 20, w: 112, h: 18 },
    [para('نعتِ رسولِ مقبول ﷺ', { align: 'center', size: 20, bold: true, spaceAfter: 0 })],
    { fontSize: 20, name: 'Naat title' },
  );

  // --- Verses: centered, generous line spacing ---
  const verseParas = VERSES.map((v) =>
    v
      ? para(v, { align: 'center', size: 16, spaceAfter: 10 })
      : para('', { align: 'center', size: 16, spaceAfter: 10 }),
  );
  addTextFrame(doc, pageId, { x: 18, y: 48, w: 112, h: 120 }, verseParas, {
    fontSize: 16,
    lineHeight: 2.4,
    name: 'Naat verses',
  });

  // --- Page number ---
  addTextFrame(
    doc,
    pageId,
    { x: 18, y: 184, w: 112, h: 12 },
    [para('۱', { align: 'center', size: 13, spaceAfter: 0 })],
    { fontSize: 13, name: 'Naat page number' },
  );

  return doc;
}
