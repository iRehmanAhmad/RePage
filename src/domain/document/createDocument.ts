import { PAGE_PRESETS, millimetresToPoints } from '../geometry/units';
import { paragraph } from '../rich-text/types';
import { createId } from './ids';
import type { Page, RePageDocument, TextStory } from './types';

function zeroInsets() {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

export function createBlankPage(name = 'Page 1'): Page {
  return {
    id: createId('page'),
    name,
    width: PAGE_PRESETS.a4.width,
    height: PAGE_PRESETS.a4.height,
    margins: {
      top: millimetresToPoints(15),
      right: millimetresToPoints(15),
      bottom: millimetresToPoints(15),
      left: millimetresToPoints(15),
    },
    bleed: zeroInsets(),
    background: '#ffffff',
    objectOrder: [],
  };
}

export const PRIMARY_STORY_ID = 'primary-body-story';

export function createDocument(title = 'Untitled RePage Document'): RePageDocument {
  const now = new Date().toISOString();
  const page = createBlankPage();

  const primaryStory: TextStory = {
    id: PRIMARY_STORY_ID,
    name: 'Primary Document Story',
    content: {
      type: 'doc',
      content: [paragraph('', 'rtl')],
    },
  };

  return {
    schemaVersion: 1,
    id: createId('doc'),
    metadata: {
      title,
      createdAt: now,
      modifiedAt: now,
      locale: 'ur-PK',
    },
    settings: { measurementUnit: 'mm' },
    pageOrder: [page.id],
    pages: { [page.id]: page },
    objects: {},
    stories: { [PRIMARY_STORY_ID]: primaryStory },
    styles: {},
    assets: {},
  };
}

export function createStarterDocument(): RePageDocument {
  const document = createDocument('میری پہلی اردو دستاویز');
  const primaryStory: TextStory = {
    id: PRIMARY_STORY_ID,
    name: 'Primary Document Story',
    content: {
      type: 'doc',
      content: [paragraph('یہاں کلک کریں اور ٹائپ کرنا شروع کریں...', 'rtl')],
    },
  };

  return {
    ...document,
    stories: { ...document.stories, [primaryStory.id]: primaryStory },
  };
}
