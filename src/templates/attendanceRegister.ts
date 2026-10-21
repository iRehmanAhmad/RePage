/**
 * حاضری رجسٹر (Attendance register) — A4 LANDSCAPE.
 *
 * School/class/month header and a wide REAL table: roll number, name,
 * 31 day columns (Urdu-Indic numerals ۱ تا ۳۱) and a total column,
 * with ten empty student rows. Footer explains the marks:
 * ح = حاضر، غ = غیر حاضر، چ = چھٹی.
 */
import type { RePageDocument } from '../domain/document/types';
import { toUrduNumerals } from '../domain/unicode/pageNumbering';
import {
  A4_LANDSCAPE_SPEC,
  addTable,
  addTextFrame,
  newTemplateDocument,
  para,
  templatePageId,
  type TableCellSpec,
} from './helpers';

const HEADER_BG = '#e2e8f0';
const STUDENT_ROWS = 10;
const DAYS_IN_MONTH = 31;

export function buildAttendanceRegisterTemplate(): RePageDocument {
  const doc = newTemplateDocument('حاضری رجسٹر', A4_LANDSCAPE_SPEC);
  const pageId = templatePageId(doc);

  // --- Header: school name, register title + class/month line ---
  addTextFrame(
    doc,
    pageId,
    { x: 12, y: 10, w: 273, h: 26 },
    [
      para('[اسکول کا نام یہاں لکھیں]', { align: 'center', size: 17, bold: true, spaceAfter: 3 }),
      para('حاضری رجسٹر — جماعت: [___]          مہینہ: [___]          سال: [___]', {
        align: 'center',
        size: 12,
        spaceAfter: 0,
      }),
    ],
    { fontSize: 12, name: 'Attendance register header' },
  );

  // --- Attendance grid (real table object) ---
  const headerRow: TableCellSpec[] = [
    { text: 'رول نمبر', bold: true, backgroundColor: HEADER_BG },
    { text: 'نام', bold: true, backgroundColor: HEADER_BG },
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => ({
      text: toUrduNumerals(i + 1),
      bold: true,
      backgroundColor: HEADER_BG,
    })),
    { text: 'کل حاضری', bold: true, backgroundColor: HEADER_BG },
  ];
  const studentRows: TableCellSpec[][] = Array.from({ length: STUDENT_ROWS }, (_, r) => [
    toUrduNumerals(r + 1),
    '',
    ...Array.from({ length: DAYS_IN_MONTH }, () => ''),
    '',
  ]);
  addTable(doc, pageId, { x: 12, y: 40, w: 273 }, [headerRow, ...studentRows], {
    name: 'Attendance register grid',
    rowHeightPt: 26,
    fontSize: 10,
  });

  // --- Footer: mark legend ---
  addTextFrame(
    doc,
    pageId,
    { x: 12, y: 148, w: 273, h: 12 },
    [para('نوٹ: ح = حاضر، غ = غیر حاضر، چ = چھٹی', { size: 11, spaceAfter: 0 })],
    { fontSize: 11, name: 'Attendance register footer' },
  );

  return doc;
}
