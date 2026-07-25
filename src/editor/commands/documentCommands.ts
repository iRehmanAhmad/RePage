import { createBlankPage } from '../../domain/document/createDocument';
import { createId } from '../../domain/document/ids';
import type {
  ObjectId,
  PageId,
  Rect,
  RectangleObject,
  RePageDocument,
  ShapeKind,
  TextFrameObject,
  TextStory,
} from '../../domain/document/types';
import { paragraph } from '../../domain/rich-text/types';

function touch(document: RePageDocument): RePageDocument {
  return {
    ...document,
    metadata: {
      ...document.metadata,
      modifiedAt: new Date().toISOString(),
    },
  };
}

export function renameDocument(document: RePageDocument, title: string): RePageDocument {
  const nextTitle = title.trim();
  if (!nextTitle) {
    throw new Error('Document title cannot be empty.');
  }

  return touch({
    ...document,
    metadata: { ...document.metadata, title: nextTitle },
  });
}

export function addPage(document: RePageDocument, afterPageId?: PageId): RePageDocument {
  const page = createBlankPage(`Page ${document.pageOrder.length + 1}`);
  const insertionIndex = afterPageId ? document.pageOrder.indexOf(afterPageId) + 1 : -1;
  const nextOrder = [...document.pageOrder];

  if (insertionIndex > 0) {
    nextOrder.splice(insertionIndex, 0, page.id);
  } else {
    nextOrder.push(page.id);
  }

  return touch({
    ...document,
    pageOrder: nextOrder,
    pages: { ...document.pages, [page.id]: page },
  });
}

export function removePage(document: RePageDocument, pageId: PageId): RePageDocument {
  if (document.pageOrder.length === 1) {
    throw new Error('A document must contain at least one page.');
  }

  const page = document.pages[pageId];
  if (!page) {
    throw new Error(`Page ${pageId} does not exist.`);
  }

  const removedObjectIds = new Set(page.objectOrder);
  const nextObjects = Object.fromEntries(
    Object.entries(document.objects).filter(([objectId]) => !removedObjectIds.has(objectId)),
  );
  const remainingStoryIds = new Set(
    Object.values(nextObjects)
      .filter((object) => object.type === 'text-frame')
      .map((object) => object.storyId),
  );
  const nextStories = Object.fromEntries(
    Object.entries(document.stories).filter(([storyId]) => remainingStoryIds.has(storyId)),
  );
  const { [pageId]: _removedPage, ...nextPages } = document.pages;
  void _removedPage;

  return touch({
    ...document,
    pageOrder: document.pageOrder.filter((id) => id !== pageId),
    pages: nextPages,
    objects: nextObjects,
    stories: nextStories,
  });
}

export function addRectangle(
  document: RePageDocument,
  pageId: PageId,
  shapeKind: ShapeKind = 'rectangle',
): RePageDocument {
  const page = document.pages[pageId];
  if (!page) {
    throw new Error(`Page ${pageId} does not exist.`);
  }

  const nameMap: Record<ShapeKind, string> = {
    rectangle: 'مستطیل (Rectangle)',
    'rounded-rectangle': 'گول مستطیل (Rounded Rectangle)',
    ellipse: 'بیضوی / دائرہ (Oval / Ellipse)',
    circle: 'دائرہ (Circle)',
    triangle: 'تثلیث (Triangle)',
    diamond: 'ہیرا (Diamond)',
    star: 'ستارہ (5-Point Star)',
    'arrow-right': 'دائیں تیر (Arrow Right)',
    'arrow-left': 'بائیں تیر (Arrow Left)',
    'arrow-up': 'اوپر تیر (Arrow Up)',
    'arrow-down': 'نیچے تیر (Arrow Down)',
    hexagon: 'مسدس (Hexagon)',
    callout: 'مکالمہ سائے (Callout)',
    line: 'لکیر (Line)',
  };

  const object: RectangleObject = {
    id: createId('object'),
    pageId,
    type: 'rectangle',
    shapeKind,
    name: nameMap[shapeKind] || 'شکل (Shape)',
    frame:
      shapeKind === 'line'
        ? { x: 72, y: 120, width: 200, height: 2, rotation: 0 }
        : shapeKind === 'circle'
          ? { x: 100, y: 100, width: 120, height: 120, rotation: 0 }
          : { x: 72, y: 72, width: 180, height: 108, rotation: 0 },
    locked: false,
    hidden: false,
    opacity: 1,
    fill: shapeKind === 'line' ? '#0284c7' : '#dce8dc',
    stroke: '#52705a',
    strokeWidth: shapeKind === 'line' ? 2 : 1,
    cornerRadius: shapeKind === 'rounded-rectangle' ? 16 : 4,
  };

  return touch({
    ...document,
    pages: {
      ...document.pages,
      [pageId]: { ...page, objectOrder: [...page.objectOrder, object.id] },
    },
    objects: { ...document.objects, [object.id]: object },
  });
}

export function addTextBox(
  document: RePageDocument,
  pageId: PageId,
): { document: RePageDocument; objectId: ObjectId } {
  const page = document.pages[pageId];
  if (!page) {
    throw new Error(`Page ${pageId} does not exist.`);
  }

  const storyId = createId('story');
  const objectId = createId('object');

  const story: TextStory = {
    id: storyId,
    name: 'New Text Box',
    content: {
      type: 'doc',
      content: [paragraph('', 'rtl')],
    },
  };

  const textFrame: TextFrameObject = {
    id: objectId,
    pageId,
    type: 'text-frame',
    name: 'Text Box',
    frame: { x: 72, y: 200, width: 360, height: 120, rotation: 0 },
    locked: false,
    hidden: false,
    opacity: 1,
    storyId,
    fontFamily: 'Noto Nastaliq Urdu',
    fontSize: 24,
    color: '#172119',
    lineHeight: 1.8,
    padding: { top: 8, right: 8, bottom: 8, left: 8 },
  };

  const updatedDoc = touch({
    ...document,
    pageOrder: document.pageOrder,
    pages: {
      ...document.pages,
      [pageId]: { ...page, objectOrder: [...page.objectOrder, objectId] },
    },
    objects: { ...document.objects, [objectId]: textFrame },
    stories: { ...document.stories, [storyId]: story },
  });

  return { document: updatedDoc, objectId };
}

export function addTextFrame(
  document: RePageDocument,
  pageId: PageId,
): RePageDocument {
  return addTextBox(document, pageId).document;
}

export function moveObject(
  document: RePageDocument,
  objectId: ObjectId,
  x: number,
  y: number,
): RePageDocument {
  const object = document.objects[objectId];
  if (!object) {
    throw new Error(`Object ${objectId} does not exist.`);
  }
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error('Object coordinates must be finite.');
  }

  return touch({
    ...document,
    objects: {
      ...document.objects,
      [objectId]: { ...object, frame: { ...object.frame, x, y } },
    },
  });
}

export function updateObjectGeometry(
  document: RePageDocument,
  objectId: ObjectId,
  frameProps: Partial<Rect>,
): RePageDocument {
  const object = document.objects[objectId];
  if (!object) {
    throw new Error(`Object ${objectId} does not exist.`);
  }

  const nextFrame: Rect = {
    x: frameProps.x ?? object.frame.x,
    y: frameProps.y ?? object.frame.y,
    width: Math.max(1, frameProps.width ?? object.frame.width),
    height: Math.max(1, frameProps.height ?? object.frame.height),
    rotation: frameProps.rotation ?? object.frame.rotation,
  };

  if (
    !Number.isFinite(nextFrame.x) ||
    !Number.isFinite(nextFrame.y) ||
    !Number.isFinite(nextFrame.width) ||
    !Number.isFinite(nextFrame.height) ||
    !Number.isFinite(nextFrame.rotation)
  ) {
    throw new Error('Object frame properties must be finite numbers.');
  }

  return touch({
    ...document,
    objects: {
      ...document.objects,
      [objectId]: { ...object, frame: nextFrame },
    },
  });
}

export function deleteObject(document: RePageDocument, objectId: ObjectId): RePageDocument {
  const object = document.objects[objectId];
  if (!object) {
    throw new Error(`Object ${objectId} does not exist.`);
  }

  const page = document.pages[object.pageId];
  const { [objectId]: _removedObject, ...nextObjects } = document.objects;
  void _removedObject;

  const nextPages = page
    ? {
        ...document.pages,
        [page.id]: {
          ...page,
          objectOrder: page.objectOrder.filter((id) => id !== objectId),
        },
      }
    : document.pages;

  return touch({
    ...document,
    pages: nextPages,
    objects: nextObjects,
  });
}

