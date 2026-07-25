import { PAGE_PRESETS, millimetresToPoints } from '../geometry/units';
import { paragraph } from '../rich-text/types';
import { createId } from './ids';
import type { Page, RePageDocument, TextFrameObject, TextStory } from './types';

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

export function createDocument(title = 'Untitled RePage Document'): RePageDocument {
  const now = new Date().toISOString();
  const page = createBlankPage();

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
    stories: {},
    styles: {},
    assets: {},
  };
}

export function createStarterDocument(): RePageDocument {
  const document = createDocument('میری پہلی اردو دستاویز');
  const pageId = document.pageOrder[0];

  if (!pageId) {
    return document;
  }

  const story: TextStory = {
    id: createId('story'),
    name: 'Welcome story',
    content: {
      type: 'doc',
      content: [paragraph('اردو پیج میں خوش آمدید')],
    },
  };
  const frame: TextFrameObject = {
    id: createId('object'),
    pageId,
    type: 'text-frame',
    name: 'Welcome text',
    storyId: story.id,
    frame: {
      x: millimetresToPoints(25),
      y: millimetresToPoints(35),
      width: millimetresToPoints(160),
      height: millimetresToPoints(55),
      rotation: 0,
    },
    locked: false,
    hidden: false,
    opacity: 1,
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 30,
    color: '#172119',
    lineHeight: 2,
    padding: zeroInsets(),
  };

  return {
    ...document,
    pages: {
      ...document.pages,
      [pageId]: {
        ...document.pages[pageId]!,
        objectOrder: [frame.id],
      },
    },
    objects: { [frame.id]: frame },
    stories: { [story.id]: story },
  };
}
