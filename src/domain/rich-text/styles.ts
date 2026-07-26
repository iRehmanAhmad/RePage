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
  normal: {
    id: 'normal',
    name: 'عام متن',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 1.8,
    alignment: 'start',
    direction: 'rtl',
  },
  heading1: {
    id: 'heading1',
    name: 'عنوان ۱',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 24,
    color: '#0369a1',
    lineHeight: 1.6,
    alignment: 'start',
    direction: 'rtl',
  },
  heading2: {
    id: 'heading2',
    name: 'عنوان ۲',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 18,
    color: '#0f766e',
    lineHeight: 1.6,
    alignment: 'start',
    direction: 'rtl',
  },
  poetry: {
    id: 'poetry',
    name: 'شاعری',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 16,
    color: '#0f766e',
    lineHeight: 2.0,
    alignment: 'center',
    direction: 'rtl',
  },
  quote: {
    id: 'quote',
    name: 'اقتباس',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 13,
    color: '#475569',
    lineHeight: 1.7,
    alignment: 'start',
    direction: 'rtl',
  },
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
};

export const BUILTIN_URDU_CHARACTER_STYLES: Record<string, CharacterStyle> = {
  emphasis: {
    id: 'emphasis',
    name: 'تاکید (Emphasis)',
    bold: true,
    color: '#0f766e',
  },
  title_lead: {
    id: 'title_lead',
    name: 'سرخی کا پہلا حرف',
    fontSize: 24,
    bold: true,
  },
};

export const URDU_TYPOGRAPHY_PRESETS = {
  characterStyles: BUILTIN_URDU_CHARACTER_STYLES,
  paragraphStyles: BUILTIN_URDU_PARAGRAPH_STYLES,
};
