/**
 * Style Commands for Canonical Document Stories
 *
 * Applies built-in Urdu typography presets ('normal', 'heading-1', 'heading-2', 'poetry', 'quote')
 * directly to target paragraphs and text runs in RePage canonical document models.
 */

import type { RePageDocument, TextStory } from '../../domain/document/types';
import type { ParagraphNode, TextMark } from '../../domain/rich-text/types';

export interface StylePreset {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  lineHeight: number;
  alignment: 'start' | 'center' | 'end' | 'justify';
  direction: 'rtl' | 'ltr';
}

export const URDU_STYLE_PRESETS: Record<string, StylePreset> = {
  normal: {
    id: 'normal',
    name: 'عام متن',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 14,
    color: '#172119',
    lineHeight: 1.5,
    alignment: 'end',
    direction: 'rtl',
  },
  standard: {
    id: 'standard',
    name: 'عام تحریر',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 14,
    color: '#172119',
    lineHeight: 1.5,
    alignment: 'end',
    direction: 'rtl',
  },
  prose: {
    id: 'prose',
    name: 'ناول و کالم',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 13,
    color: '#1e293b',
    lineHeight: 1.5,
    alignment: 'justify',
    direction: 'rtl',
  },
  poetry: {
    id: 'poetry',
    name: 'شاعری و نعت',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 16,
    color: '#172119',
    lineHeight: 2.0,
    alignment: 'center',
    direction: 'rtl',
  },
  heading: {
    id: 'heading',
    name: 'سرخی و عنوان',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 22,
    color: '#0f172a',
    lineHeight: 1.3,
    alignment: 'end',
    direction: 'rtl',
  },
  'heading-1': {
    id: 'heading-1',
    name: 'عنوان ۱',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 22,
    color: '#0f172a',
    lineHeight: 1.3,
    alignment: 'end',
    direction: 'rtl',
  },
  'heading-2': {
    id: 'heading-2',
    name: 'عنوان ۲',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 18,
    color: '#0369a1',
    lineHeight: 1.5,
    alignment: 'end',
    direction: 'rtl',
  },
  citation: {
    id: 'citation',
    name: 'آیات و اقتباس',
    fontFamily: 'Amiri',
    fontSize: 18,
    color: '#1e1b4b',
    lineHeight: 1.8,
    alignment: 'center',
    direction: 'rtl',
  },
  quote: {
    id: 'quote',
    name: 'اقتباس',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 16,
    color: '#475569',
    lineHeight: 1.9,
    alignment: 'center',
    direction: 'rtl',
  },
  'heading-3': {
    id: 'heading-3',
    name: 'عنوان ۳',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 16,
    color: '#0284c7',
    lineHeight: 1.5,
    alignment: 'end',
    direction: 'rtl',
  },
  quran: {
    id: 'quran',
    name: 'آیات و احادیث',
    fontFamily: 'Amiri',
    fontSize: 18,
    color: '#047857',
    lineHeight: 1.8,
    alignment: 'center',
    direction: 'rtl',
  },
};

/**
 * Applies a built-in Urdu style preset to the story content of a canonical RePageDocument.
 */
export function applyStyleToStory(
  doc: RePageDocument,
  storyId: string,
  styleId: string,
): RePageDocument {
  const preset: StylePreset = URDU_STYLE_PRESETS[styleId] || URDU_STYLE_PRESETS['normal'] || {
    id: 'normal',
    name: 'عام متن',
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 18,
    color: '#172119',
    lineHeight: 1.8,
    alignment: 'start',
    direction: 'rtl',
  };

  const updatedDoc: RePageDocument = JSON.parse(JSON.stringify(doc));
  const story: TextStory | undefined = updatedDoc.stories[storyId];

  if (!story || !story.content || !Array.isArray(story.content.content)) {
    return doc;
  }

  for (const paragraph of story.content.content as ParagraphNode[]) {
    paragraph.alignment = preset.alignment;
    paragraph.direction = preset.direction;
    paragraph.lineHeight = preset.lineHeight;

    if (paragraph.content && Array.isArray(paragraph.content)) {
      for (const run of paragraph.content) {
        if (run.type === 'text') {
          const marks: TextMark[] = run.marks ? [...run.marks] : [];
          
          // Remove old font/size/color marks
          const filtered: TextMark[] = marks.filter(
            (m) => m.type !== 'fontFamily' && m.type !== 'fontSize' && m.type !== 'color'
          );

          // Add updated marks
          filtered.push({ type: 'fontFamily', family: preset.fontFamily });
          filtered.push({ type: 'fontSize', size: preset.fontSize });
          filtered.push({ type: 'color', color: preset.color });

          run.marks = filtered;
        }
      }
    }
  }

  return updatedDoc;
}
