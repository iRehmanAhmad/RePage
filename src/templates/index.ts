/**
 * Template gallery registry — the single source of truth for File → New → Templates.
 */
import { buildAdmissionFormTemplate } from './admissionForm';
import { buildAttendanceRegisterTemplate } from './attendanceRegister';
import { buildDateSheetTemplate } from './dateSheet';
import { buildExamPaperTemplate } from './examPaper';
import { buildLetterheadTemplate } from './letterhead';
import { buildNaatPageTemplate } from './naatPage';
import { buildNewspaperColumnTemplate } from './newspaperColumn';
import { buildResultCardTemplate } from './resultCard';
import { buildShaadiCardTemplate } from './shaadiCard';
import { buildWorksheetTemplate } from './worksheet';
import type { TemplateDefinition } from './types';

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: 'exam-paper',
    titleUr: 'امتحانی پرچہ',
    titleEn: 'Exam Paper',
    descriptionUr: 'اسکول کے امتحان کے لیے تیار پرچہ — ہیڈر، ہدایات اور نمبروں والے سوالات۔',
    descriptionEn: 'Ready exam paper with school header, instructions and marked questions.',
    pageSize: 'A4',
    build: buildExamPaperTemplate,
  },
  {
    id: 'worksheet',
    titleUr: 'ورک شیٹ',
    titleEn: 'School Worksheet',
    descriptionUr: 'طلبہ کی مشق کے لیے ورک شیٹ — مشقیں اور جواب لکھنے کی جگہ۔',
    descriptionEn: 'Practice worksheet with exercises and ruled answer space.',
    pageSize: 'A4',
    build: buildWorksheetTemplate,
  },
  {
    id: 'shaadi-card',
    titleUr: 'شادی کارڈ',
    titleEn: 'Wedding Card',
    descriptionUr: 'خوبصورت شادی کارڈ — دولہا دلہن کے نام اور تقریب کی تفصیل۔',
    descriptionEn: 'Ornamental wedding card with couple names and event details.',
    pageSize: '5×7 in',
    build: buildShaadiCardTemplate,
  },
  {
    id: 'newspaper-column',
    titleUr: 'اخباری کالم',
    titleEn: 'Newspaper Column',
    descriptionUr: 'دو کالم والا اخباری کالم — سرخی، مصنف کا نام اور متن۔',
    descriptionEn: 'Two-column newspaper column with headline, byline and body.',
    pageSize: 'A4',
    build: buildNewspaperColumnTemplate,
  },
  {
    id: 'letterhead',
    titleUr: 'لیٹر ہیڈ',
    titleEn: 'Letterhead',
    descriptionUr: 'ادارے کا لیٹر ہیڈ — پتہ، حوالہ نمبر اور دستخط کی جگہ۔',
    descriptionEn: 'Official letterhead with address block, ref line and signature.',
    pageSize: 'A4',
    build: buildLetterheadTemplate,
  },
  {
    id: 'naat-page',
    titleUr: 'نعت کا صفحہ',
    titleEn: 'Naat Page',
    descriptionUr: 'نعت کا خوبصورت صفحہ — حاشیہ اور صفحہ نمبر کے ساتھ۔',
    descriptionEn: 'Centered naat verse page with border and page number.',
    pageSize: 'A5',
    build: buildNaatPageTemplate,
  },
  {
    id: 'result-card',
    titleUr: 'نتیجہ کارڈ',
    titleEn: 'Result Card',
    descriptionUr: 'نتیجہ کارڈ — مضامین کے نمبروں کا جدول، فیصد، گریڈ اور دستخط۔',
    descriptionEn: 'Result card with a subject marks table, percentage, grade and signatures.',
    pageSize: 'A4',
    build: buildResultCardTemplate,
  },
  {
    id: 'date-sheet',
    titleUr: 'ڈیٹ شیٹ',
    titleEn: 'Date Sheet',
    descriptionUr: 'امتحان کی ڈیٹ شیٹ — تاریخ، دن اور مضمون کا جدول۔',
    descriptionEn: 'Exam date sheet with a date, day and subject table.',
    pageSize: 'A4',
    build: buildDateSheetTemplate,
  },
  {
    id: 'admission-form',
    titleUr: 'داخلہ فارم',
    titleEn: 'Admission Form',
    descriptionUr: 'داخلہ فارم — طالب علم و سرپرست کی معلومات اور دفتری خانہ۔',
    descriptionEn: 'Admission form with student and guardian fields and an office-use box.',
    pageSize: 'A4',
    build: buildAdmissionFormTemplate,
  },
  {
    id: 'attendance-register',
    titleUr: 'حاضری رجسٹر',
    titleEn: 'Attendance Register',
    descriptionUr: 'ماہانہ حاضری رجسٹر — ۳۱ دنوں کے خانے، افقی صفحہ۔',
    descriptionEn: 'Monthly attendance register with 31 day columns on a landscape page.',
    pageSize: 'A4 Landscape',
    build: buildAttendanceRegisterTemplate,
  },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === id);
}

export type { TemplateDefinition } from './types';
