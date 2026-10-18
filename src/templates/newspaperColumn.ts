/**
 * اخباری کالم (Newspaper column) — A4.
 *
 * Two-column RTL body, headline, byline, a larger lead paragraph and a
 * decorative column rule between the columns.
 */
import type { RePageDocument } from '../domain/document/types';
import {
  A4_SPEC,
  addHorizontalRule,
  addRect,
  addTextFrame,
  newTemplateDocument,
  para,
  templatePageId,
} from './helpers';

const BODY_PARAGRAPHS = [
  'تعلیم کسی بھی قوم کی ترقی کی بنیاد ہے۔ جس قوم نے علم کو اپنا ہتھیار بنایا، اس نے دنیا میں اپنا مقام پیدا کیا۔ ہمارے بچوں کا مستقبل اسی بات پر منحصر ہے کہ ہم آج ان کی تعلیم کے لیے کیا کچھ کرتے ہیں۔',
  'ہمارے اسکولوں میں آج بھی بنیادی سہولتوں کی کمی ہے، لیکن اساتذہ کی محنت اور لگن سے بچے آگے بڑھ رہے ہیں۔ ضرورت اس بات کی ہے کہ ہر بچے تک معیاری تعلیم کی رسائی یقینی بنائی جائے۔',
  'والدین کو چاہیے کہ وہ اپنے بچوں کی تعلیم پر خصوصی توجہ دیں، اسکول کے ساتھ رابطہ رکھیں اور گھر میں پڑھائی کا مناسب ماحول فراہم کریں۔ بچے کی پہلی درسگاہ اس کا گھر ہوتی ہے۔',
  'حکومت اور معاشرے کو مل کر تعلیمی نظام کو بہتر بنانے کے لیے اپنا کردار ادا کرنا ہوگا۔ جب تعلیم عام ہوگی تو معاشرے سے جہالت، غربت اور پسماندگی کا خاتمہ ممکن ہوگا۔',
];

export function buildNewspaperColumnTemplate(): RePageDocument {
  const doc = newTemplateDocument('اخباری کالم — تعلیم کی اہمیت', A4_SPEC);
  const pageId = templatePageId(doc);

  // --- Headline + byline ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 15, w: 180, h: 26 },
    [para('[کالم کی سرخی یہاں لکھیں]', { align: 'center', size: 26, bold: true, spaceAfter: 0 })],
    { fontSize: 26, name: 'Column headline' },
  );
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 44, w: 180, h: 12 },
    [para('از: [مصنف کا نام]', { align: 'center', size: 14, spaceAfter: 0 })],
    { fontSize: 14, name: 'Column byline' },
  );
  addHorizontalRule(doc, pageId, 59, 15, 180, 1);

  // --- Two-column body with a lead paragraph ---
  const bodyParas = [
    para(BODY_PARAGRAPHS[0] ?? '', { size: 15, spaceAfter: 8 }),
    ...BODY_PARAGRAPHS.slice(1).map((t) => para(t, { size: 13, spaceAfter: 8 })),
  ];
  addTextFrame(doc, pageId, { x: 15, y: 64, w: 180, h: 200 }, bodyParas, {
    fontSize: 13,
    lineHeight: 1.9,
    columns: 2,
    columnGapMm: 8,
    name: 'Column body',
  });

  // Decorative column rule between the two columns (page centre).
  addRect(doc, pageId, { x: 104.6, y: 64, w: 0.4, h: 200 }, {
    fill: '#9ca3af',
    stroke: '#9ca3af',
    strokeWidth: 0.75,
    name: 'Column rule',
  });

  return doc;
}
