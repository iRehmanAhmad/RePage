/**
 * ڈیٹ شیٹ (Date sheet) — A4 portrait.
 *
 * School header, exam/class line, a REAL date/day/subject table with
 * eight empty rows for the school to fill in, instructions ("نوٹ") and
 * a head-teacher signature line.
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
const EMPTY_ROWS = 8;

export function buildDateSheetTemplate(): RePageDocument {
  const doc = newTemplateDocument('ڈیٹ شیٹ', A4_SPEC);
  const pageId = templatePageId(doc);

  // --- Header: school name, title, exam + class line ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 15, w: 180, h: 36 },
    [
      para('[اسکول کا نام یہاں لکھیں]', { align: 'center', size: 20, bold: true, spaceAfter: 4 }),
      para('ڈیٹ شیٹ', { align: 'center', size: 18, bold: true, spaceAfter: 4 }),
      para('امتحان: [___]          جماعت: [___]', { align: 'center', size: 13, spaceAfter: 0 }),
    ],
    { fontSize: 14, name: 'Date sheet header' },
  );
  addHorizontalRule(doc, pageId, 54, 15, 180, 1.5);

  // --- Schedule table (real table object, rows left empty) ---
  const headerRow: TableCellSpec[] = [
    { text: 'تاریخ', bold: true, backgroundColor: HEADER_BG },
    { text: 'دن', bold: true, backgroundColor: HEADER_BG },
    { text: 'مضمون', bold: true, backgroundColor: HEADER_BG },
  ];
  const emptyRows: TableCellSpec[][] = Array.from({ length: EMPTY_ROWS }, () => ['', '', '']);
  addTable(doc, pageId, { x: 15, y: 60, w: 180 }, [headerRow, ...emptyRows], {
    name: 'Date sheet table',
    rowHeightPt: 32,
    fontSize: 13,
  });

  // --- Instructions ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 170, w: 180, h: 44 },
    [
      para('نوٹ:', { bold: true, size: 14, spaceAfter: 4 }),
      para('۱۔ امتحان صبح [___] بجے شروع ہوگا۔', { size: 13, spaceAfter: 2 }),
      para('۲۔ تمام طلبہ مقررہ وقت سے پہلے کمرہ امتحان میں پہنچ جائیں۔', { size: 13, spaceAfter: 2 }),
      para('۳۔ کمرہ امتحان: [___]', { size: 13, spaceAfter: 0 }),
    ],
    { fontSize: 13, name: 'Date sheet notes' },
  );

  // --- Signature (bottom-left, where RTL documents end) ---
  addTextFrame(
    doc,
    pageId,
    { x: 15, y: 262, w: 56, h: 16 },
    [ruledLine(6), para('دستخط ہیڈ ٹیچر', { align: 'center', size: 12, spaceAfter: 0 })],
    { fontSize: 12, name: 'Date sheet signature' },
  );

  return doc;
}
