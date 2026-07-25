import * as Y from 'yjs';
import type { RePageDocument, Page, PageObject, TextStory } from '../domain/document/types';
import { parseDocument } from '../domain/document/schema';

export interface CommentItem {
  id: string;
  objectId?: string | undefined;
  author: string;
  text: string;
  createdAt: string;
}

/**
 * Maps a canonical RePageDocument to a Yjs Y.Doc shared state.
 */
export function canonicalToYjsDoc(doc: RePageDocument, ydoc: Y.Doc): void {
  ydoc.transact(() => {
    // 1. Metadata
    const yMeta = ydoc.getMap('metadata');
    yMeta.set('id', doc.id);
    yMeta.set('title', doc.metadata.title);
    yMeta.set('schemaVersion', doc.schemaVersion);
    yMeta.set('locale', doc.metadata.locale);
    yMeta.set('measurementUnit', doc.settings.measurementUnit);

    // 2. Page Order
    const yPageOrder = ydoc.getArray<string>('pageOrder');
    yPageOrder.delete(0, yPageOrder.length);
    yPageOrder.push(doc.pageOrder);

    // 3. Pages
    const yPages = ydoc.getMap<Y.Map<unknown>>('pages');
    for (const [pageId, page] of Object.entries(doc.pages)) {
      const yPage = new Y.Map<unknown>();
      yPage.set('id', page.id);
      yPage.set('name', page.name);
      yPage.set('width', page.width);
      yPage.set('height', page.height);
      yPage.set('margins', page.margins);
      yPage.set('background', page.background);
      yPage.set('objectOrder', page.objectOrder);
      yPages.set(pageId, yPage);
    }

    // 4. Objects
    const yObjects = ydoc.getMap<Y.Map<unknown>>('objects');
    for (const [objId, obj] of Object.entries(doc.objects)) {
      const yObj = new Y.Map<unknown>();
      for (const [k, v] of Object.entries(obj)) {
        yObj.set(k, v);
      }
      yObjects.set(objId, yObj);
    }

    // 5. Stories
    const yStories = ydoc.getMap<Y.Map<unknown>>('stories');
    for (const [storyId, story] of Object.entries(doc.stories)) {
      const yStory = new Y.Map<unknown>();
      yStory.set('id', story.id);
      yStory.set('name', story.name);
      yStory.set('content', story.content);
      yStories.set(storyId, yStory);
    }
  });
}

/**
 * Reconstructs a canonical RePageDocument from a Yjs Y.Doc shared state.
 */
export function yjsToCanonicalDoc(ydoc: Y.Doc): RePageDocument {
  const yMeta = ydoc.getMap('metadata');
  const yPageOrder = ydoc.getArray<string>('pageOrder');
  const yPages = ydoc.getMap<Y.Map<unknown>>('pages');
  const yObjects = ydoc.getMap<Y.Map<unknown>>('objects');
  const yStories = ydoc.getMap<Y.Map<unknown>>('stories');

  const pageOrder = yPageOrder.toArray();
  const pages: Record<string, Page> = {};
  const objects: Record<string, PageObject> = {};
  const stories: Record<string, TextStory> = {};

  yPages.forEach((yPage, pageId) => {
    pages[pageId] = {
      id: (yPage.get('id') as string) || pageId,
      name: (yPage.get('name') as string) || 'Page',
      width: (yPage.get('width') as number) || 595.28,
      height: (yPage.get('height') as number) || 841.89,
      margins: (yPage.get('margins') as Page['margins']) || { top: 36, right: 36, bottom: 36, left: 36 },
      bleed: { top: 0, right: 0, bottom: 0, left: 0 },
      background: (yPage.get('background') as string) || '#ffffff',
      objectOrder: (yPage.get('objectOrder') as string[]) || [],
    };
  });

  yObjects.forEach((yObj, objId) => {
    const rawObj: Record<string, unknown> = {};
    yObj.forEach((val, key) => {
      rawObj[key] = val;
    });
    objects[objId] = rawObj as unknown as PageObject;
  });

  yStories.forEach((yStory, storyId) => {
    stories[storyId] = {
      id: (yStory.get('id') as string) || storyId,
      name: (yStory.get('name') as string) || 'Story',
      content: yStory.get('content') as TextStory['content'],
    };
  });

  const docCandidate: RePageDocument = {
    schemaVersion: 1,
    id: (yMeta.get('id') as string) || 'doc-collaborative',
    metadata: {
      title: (yMeta.get('title') as string) || 'Collaborative RePage Document',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      locale: ((yMeta.get('locale') as string) === 'en' ? 'en' : 'ur-PK'),
    },
    settings: {
      measurementUnit: (yMeta.get('measurementUnit') as 'mm' | 'pt') || 'mm',
    },
    pageOrder,
    pages,
    objects,
    stories,
    styles: {},
    assets: {},
  };

  return parseDocument(docCandidate);
}
