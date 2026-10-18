/**
 * Template gallery registry — the single source of truth for File → New → Templates.
 */
import { buildExamPaperTemplate } from './examPaper';
import { buildLetterheadTemplate } from './letterhead';
import { buildNaatPageTemplate } from './naatPage';
import { buildNewspaperColumnTemplate } from './newspaperColumn';
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
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === id);
}

export type { TemplateDefinition } from './types';
