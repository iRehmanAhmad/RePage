import { millimetresToPoints } from '../geometry/units';
import { createDocument } from '../document/createDocument';
import { createId } from '../document/ids';
import type { RePageDocument, TextFrameObject, TextStory } from '../document/types';
import { paragraph } from '../rich-text/types';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'newspaper' | 'book' | 'stationery' | 'poster';
  createDocument: (title?: string) => RePageDocument;
}

export function createNewspaperTemplate(title = 'روزنامہ اردو - خاص ایڈیشن'): RePageDocument {
  const doc = createDocument(title);
  const pageId = doc.pageOrder[0]!;

  const storyHeader: TextStory = {
    id: createId('story'),
    name: 'Newspaper Main Headline',
    content: {
      type: 'doc',
      content: [paragraph('روزنامہ اردو — قومی و بین الاقوامی خبریں')],
    },
  };

  const storyCol1: TextStory = {
    id: createId('story'),
    name: 'Column 1 Article',
    content: {
      type: 'doc',
      content: [paragraph('پاکستان اور دنیا بھر سے تازہ ترین اہم خبریں اور تجزئیے۔')],
    },
  };

  const frameHeader: TextFrameObject = {
    id: createId('object'),
    pageId,
    type: 'text-frame',
    name: 'Main Header Frame',
    storyId: storyHeader.id,
    frame: {
      x: millimetresToPoints(15),
      y: millimetresToPoints(15),
      width: millimetresToPoints(180),
      height: millimetresToPoints(35),
      rotation: 0,
    },
    locked: false,
    hidden: false,
    opacity: 1,
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 28,
    color: '#0f172a',
    lineHeight: 2.0,
    padding: { top: 6, right: 6, bottom: 6, left: 6 },
    columns: 1,
  };

  const frameBody: TextFrameObject = {
    id: createId('object'),
    pageId,
    type: 'text-frame',
    name: 'Three Column Body Frame',
    storyId: storyCol1.id,
    frame: {
      x: millimetresToPoints(15),
      y: millimetresToPoints(55),
      width: millimetresToPoints(180),
      height: millimetresToPoints(220),
      rotation: 0,
    },
    locked: false,
    hidden: false,
    opacity: 1,
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 1.9,
    padding: { top: 6, right: 6, bottom: 6, left: 6 },
    columns: 3,
    columnGap: 12,
  };

  return {
    ...doc,
    pages: {
      ...doc.pages,
      [pageId]: {
        ...doc.pages[pageId]!,
        objectOrder: [frameHeader.id, frameBody.id],
      },
    },
    objects: {
      [frameHeader.id]: frameHeader,
      [frameBody.id]: frameBody,
    },
    stories: {
      [storyHeader.id]: storyHeader,
      [storyCol1.id]: storyCol1,
    },
  };
}

export function createPoetryBookTemplate(title = 'دیوانِ غالب — منتخب کلام'): RePageDocument {
  const doc = createDocument(title);
  const pageId = doc.pageOrder[0]!;

  const poetryStory: TextStory = {
    id: createId('story'),
    name: 'Ghalib Ghazal',
    content: {
      type: 'doc',
      content: [
        paragraph('دلِ ناداں تجھے ہوا کیا ہے'),
        paragraph('آخر اس درد کی دوا کیا ہے'),
      ],
    },
  };

  const poetryFrame: TextFrameObject = {
    id: createId('object'),
    pageId,
    type: 'text-frame',
    name: 'Poetry Couplet Frame',
    storyId: poetryStory.id,
    frame: {
      x: millimetresToPoints(25),
      y: millimetresToPoints(50),
      width: millimetresToPoints(160),
      height: millimetresToPoints(180),
      rotation: 0,
    },
    locked: false,
    hidden: false,
    opacity: 1,
    fontFamily: 'Gulzar',
    fontSize: 22,
    color: '#0f766e',
    lineHeight: 2.2,
    padding: { top: 12, right: 12, bottom: 12, left: 12 },
  };

  return {
    ...doc,
    pages: {
      ...doc.pages,
      [pageId]: {
        ...doc.pages[pageId]!,
        objectOrder: [poetryFrame.id],
      },
    },
    objects: { [poetryFrame.id]: poetryFrame },
    stories: { [poetryStory.id]: poetryStory },
  };
}

export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
  newspaper: {
    id: 'newspaper',
    name: 'اخبار صفحہ (Urdu Newspaper)',
    description: 'A4 3-column Urdu newspaper front page layout.',
    category: 'newspaper',
    createDocument: createNewspaperTemplate,
  },
  poetry: {
    id: 'poetry',
    name: 'شاعری کتاب (Urdu Poetry Book)',
    description: 'Classical Urdu ghazal & poetry couplet layout.',
    category: 'book',
    createDocument: createPoetryBookTemplate,
  },
};

export function createDocumentFromTemplate(templateId: string, title?: string): RePageDocument {
  const template = DOCUMENT_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Template '${templateId}' not found`);
  }
  return template.createDocument(title);
}
