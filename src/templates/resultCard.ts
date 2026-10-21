/**
 * نتیجہ کارڈ (Result card) — A4 portrait.
 *
 * School header, student info block, a REAL marks table (7 subjects +
 * total row), percentage/grade/position line, teacher remarks area and
 * a three-signature row. Marks use Urdu-Indic digits; obtained-marks
 * cells are left empty for the teacher to fill in.
 */
import type { RePageDocument } from '../domain/document/types';
import {
  A4_SPEC,
  addHorizontalRule,
  addTable,
  addTextFrame,
  newTemplateDocument,
  para,
  ruledLine,
  templatePageId,
  type TableCellSpec,
} from './helpers';

const HEADER_BG = '#e2e8f0';
const TOTAL_BG = '#f1f5f9';

/** [subject, total marks] — obtained marks stay empty. */
const SUBJECTS: Array<[string, string]> = [
  ['اردو', '۱۰۰'],
  ['انگریزی', '۱۰۰'],
  ['ریاضی', '۱۰۰'],
  ['علوم', '۱۰۰'],
  ['معاشرتی علوم', '۱۰۰'],
  ['اسلامیات', '۵۰'],
  ['کمپیوٹر', '۵۰'],
];

export function buildResultCardTemplate(): RePageDocument {
  const doc = newTemplateDocument('نتیجہ کارڈ', A4_SPEC);
  const pageId = templatePageId(doc);

  // --- Header: school name, card title, academic year ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 15, w: 180, h: 36 },
    [
      para('[اسکول کا نام یہاں لکھیں]', { align: 'center', size: 20, bold: true, spaceAfter: 4 }),
      para('نتیجہ کارڈ', { align: 'center', size: 18, bold: true, spaceAfter: 4 }),
      para('تعلیمی سال: [___] — [___]', { align: 'center', size: 13, spaceAfter: 0 }),
    ],
    { fontSize: 14, name: 'Result card header' },
  );
  addHorizontalRule(doc, pageId, 54, 15, 180, 1.5);

  // --- Student info block ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 60, w: 180, h: 28 },
    [
      para('نام طالب علم: [___]          ولدیت: [___]', { size: 13, spaceAfter: 4 }),
      para('جماعت: [___]          رول نمبر: [___]', { size: 13, spaceAfter: 0 }),
    ],
    { fontSize: 13, name: 'Result card student info' },
  );

  // --- Marks table (real table object) ---
  const headerRow: TableCellSpec[] = [
    { text: 'مضمون', bold: true, backgroundColor: HEADER_BG },
    { text: 'کل نمبر', bold: true, backgroundColor: HEADER_BG },
    { text: 'حاصل کردہ نمبر', bold: true, backgroundColor: HEADER_BG },
  ];
  const subjectRows: TableCellSpec[][] = SUBJECTS.map(([subject, total]) => [
    { text: subject, align: 'start' },
    total,
    '',
  ]);
  const totalRow: TableCellSpec[] = [
    { text: 'مجموعہ', bold: true, align: 'start', backgroundColor: TOTAL_BG },
    { text: '۶۰۰', bold: true, backgroundColor: TOTAL_BG },
    { text: '', bold: true, backgroundColor: TOTAL_BG },
  ];
  addTable(doc, pageId, { x: 15, y: 94, w: 180 }, [headerRow, ...subjectRows, totalRow], {
    name: 'Result card marks table',
    rowHeightPt: 30,
    fontSize: 13,
  });

  // --- Percentage / grade / position ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 196, w: 180, h: 14 },
    [para('فیصد: [___] فیصد          گریڈ: [___]          پوزیشن: [___]', { size: 13, spaceAfter: 0 })],
    { fontSize: 13, name: 'Result card summary' },
  );

  // --- Teacher remarks ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 216, w: 180, h: 34 },
    [para('اساتذہ کے تاثرات:', { bold: true, size: 13, spaceAfter: 6 }), ruledLine(14), ruledLine(14)],
    { fontSize: 13, name: 'Result card remarks' },
  );

  // --- Signatures (RTL reading order: parent right, head teacher left) ---
  const signatures: Array<{ label: string; x: number }> = [
    { label: 'دستخط والد', x: 139 },
    { label: 'دستخط استاد', x: 77 },
    { label: 'دستخط ہیڈ ٹیچر', x: 15 },
  ];
  for (const sig of signatures) {
    addTextFrame(
      doc,
      pageId,
      { x: sig.x, y: 258, w: 56, h: 16 },
      [ruledLine(6), para(sig.label, { align: 'center', size: 12, spaceAfter: 0 })],
      { fontSize: 12, name: `Signature ${sig.label}` },
    );
  }

  return doc;
}
