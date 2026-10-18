/**
 * امتحانی پرچہ (Exam paper) — A4.
 *
 * School header block, class/subject/time/marks line, instructions ("نوٹ"),
 * five numbered questions with mark allocations, and a page-number footer.
 * All placeholders are bracketed Urdu so a teacher knows what to replace.
 */
import type { RePageDocument } from '../domain/document/types';
import type { ParagraphNode } from '../domain/rich-text/types';
import {
  A4_SPEC,
  addHorizontalRule,
  addTextFrame,
  newTemplateDocument,
  para,
  templatePageId,
} from './helpers';

interface ExamQuestion {
  no: string;
  text: string;
  marks: string;
}

const QUESTIONS: ExamQuestion[] = [
  {
    no: '۱',
    text: 'درج ذیل عبارت کو غور سے پڑھیں اور پوچھے گئے سوالات کے جوابات تحریر کریں۔',
    marks: '۱۰',
  },
  {
    no: '۲',
    text: 'دیے گئے الفاظ کے معنی لکھیں: کتاب، استاد، محنت، وطن، علم۔',
    marks: '۵',
  },
  {
    no: '۳',
    text: 'خالی جگہیں مناسب الفاظ سے پُر کریں۔',
    marks: '۵',
  },
  {
    no: '۴',
    text: 'درج ذیل سوالات کے مختصر جوابات لکھیں۔',
    marks: '۱۰',
  },
  {
    no: '۵',
    text: 'کسی ایک عنوان پر مضمون لکھیں: "میرا اسکول" یا "محنت کی برکت"۔',
    marks: '۱۰',
  },
];

export function buildExamPaperTemplate(): RePageDocument {
  const doc = newTemplateDocument('امتحانی پرچہ — اردو', A4_SPEC);
  const pageId = templatePageId(doc);

  // --- Header block: school name, paper title, exam meta line ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 15, w: 180, h: 42 },
    [
      para('[اسکول کا نام یہاں لکھیں]', { align: 'center', size: 20, bold: true, spaceAfter: 4 }),
      para('امتحانی پرچہ — جماعت پنجم', { align: 'center', size: 16, bold: true, spaceAfter: 4 }),
      para('مضمون: اردو          وقت: ۲ گھنٹے          کل نمبر: ۴۰', {
        align: 'center',
        size: 14,
        spaceAfter: 0,
      }),
    ],
    { fontSize: 14, name: 'Exam header' },
  );
  addHorizontalRule(doc, pageId, 60, 15, 180, 1.5);

  // --- Instructions ("نوٹ") ---
  const notes: ParagraphNode[] = [
    para('نوٹ:', { bold: true, size: 15, spaceAfter: 4 }),
    para('۱۔ تمام سوالات کے جوابات لکھنا لازمی ہیں۔', { size: 13, spaceAfter: 2 }),
    para('۲۔ ہر سوال کے نمبر اس کے سامنے درج ہیں۔', { size: 13, spaceAfter: 2 }),
    para('۳۔ صاف اور خوشخط لکھنے کی کوشش کریں۔', { size: 13, spaceAfter: 0 }),
  ];
  addTextFrame(doc, pageId, { x: 15, y: 66, w: 180, h: 38 }, notes, {
    fontSize: 13,
    name: 'Exam instructions',
  });

  // --- Questions ---
  const questionParas: ParagraphNode[] = [];
  for (const q of QUESTIONS) {
    questionParas.push(
      para(`سوال نمبر ${q.no}: ${q.text}`, { bold: true, size: 14, spaceAfter: 2 }),
      para(`(نمبر: ${q.marks})`, { size: 13, spaceAfter: 10 }),
    );
  }
  addTextFrame(doc, pageId, { x: 15, y: 108, w: 180, h: 150 }, questionParas, {
    fontSize: 14,
    lineHeight: 1.8,
    name: 'Exam questions',
  });

  // --- Footer: page number ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 270, w: 180, h: 12 },
    [para('صفحہ نمبر: ۱', { align: 'center', size: 12, spaceAfter: 0 })],
    { fontSize: 12, name: 'Exam footer' },
  );

  return doc;
}
