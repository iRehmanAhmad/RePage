import { z } from 'zod';

export interface CharacterStyle {
  id: string;
  name: string;
  fontFamily?: string | undefined;
  fontSize?: number | undefined;
  color?: string | undefined;
  bold?: boolean | undefined;
  italic?: boolean | undefined;
  underline?: boolean | undefined;
}

export interface ParagraphStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  lineHeight: number;
  alignment: 'start' | 'end' | 'center' | 'justify';
  direction: 'rtl' | 'ltr';
  characterSpacing?: number | undefined;
}

export const characterStyleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  color: z.string().optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
});

export const paragraphStyleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fontFamily: z.string().min(1),
  fontSize: z.number().positive(),
  color: z.string().min(1),
  lineHeight: z.number().positive(),
  alignment: z.enum(['start', 'end', 'center', 'justify']),
  direction: z.enum(['rtl', 'ltr']),
  characterSpacing: z.number().optional(),
});

export const BUILTIN_URDU_PARAGRAPH_STYLES: Record<string, ParagraphStyle> = {
  headline: {
    id: 'headline',
    name: 'عنوان (Headline)',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 32,
    color: '#0f172a',
    lineHeight: 2.2,
    alignment: 'center',
    direction: 'rtl',
  },
  subheading: {
    id: 'subheading',
    name: 'ذیلی عنوان (Subheading)',
    fontFamily: 'Gulzar',
    fontSize: 24,
    color: '#1e293b',
    lineHeight: 2.0,
    alignment: 'start',
    direction: 'rtl',
  },
  body: {
    id: 'body',
    name: 'متن (Body Text)',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 18,
    color: '#172119',
    lineHeight: 1.9,
    alignment: 'start',
    direction: 'rtl',
  },
  poetry: {
    id: 'poetry',
    name: 'شعر (Poetry Couplet)',
    fontFamily: 'Gulzar',
    fontSize: 20,
    color: '#0f766e',
    lineHeight: 2.1,
    alignment: 'center',
    direction: 'rtl',
  },
};
