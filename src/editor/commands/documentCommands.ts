import { createBlankPage } from '../../domain/document/createDocument';
import { cleanupDanglingSections, ensureDocumentSections } from '../../domain/layout/sectionEngine';
import { createId } from '../../domain/document/ids';
import type {
  AssetReference,
  ImageFrameObject,
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
import { applyChainOverflowFlags, computeChainTextSlices, getStoryPlainText, getTextFrameChain, splitStoryAtTextOffset, unlinkTextFrame } from '../../domain/document/textFlow';
import { linkTextFramesEngine } from '../../domain/document/textFlowEngine';

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

  const newDoc = touch({
    ...document,
    pageOrder: nextOrder,
    pages: { ...document.pages, [page.id]: page },
  });

  return ensureDocumentSections(newDoc);
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

  const docAfterRemoval = touch({
    ...document,
    pageOrder: document.pageOrder.filter((id) => id !== pageId),
    pages: nextPages,
    objects: nextObjects,
    stories: nextStories,
  });

  return cleanupDanglingSections(docAfterRemoval);
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

export function addImageFrame(
  document: RePageDocument,
  pageId: PageId,
  originalName?: string,
  dataUrl?: string,
  width: number = 240,
  height: number = 180,
): { document: RePageDocument; objectId: ObjectId } {
  const page = document.pages[pageId];
  if (!page) {
    throw new Error(`Page ${pageId} does not exist.`);
  }

  const assetId = createId('asset');
  const objectId = createId('object');

  const asset: AssetReference = {
    id: assetId,
    sha256: '',
    mediaType: dataUrl?.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
    byteSize: dataUrl?.length || 0,
    originalName: originalName || 'picture.png',
    packageEntry: `assets/${assetId}.png`,
    ...(dataUrl ? { dataUrl } : {}),
  };

  const imageFrame: ImageFrameObject = {
    id: objectId,
    pageId,
    type: 'image-frame',
    name: originalName ? `تصویر (${originalName})` : 'تصویر (Image Frame)',
    frame: {
      x: 72,
      y: 100,
      width: Math.min(page.width - 144, width),
      height: Math.min(page.height - 200, height),
      rotation: 0,
    },
    locked: false,
    hidden: false,
    opacity: 1,
    assetId: dataUrl ? assetId : null,
    fit: 'contain',
  };

  const nextAssets = dataUrl
    ? { ...document.assets, [assetId]: asset }
    : document.assets;

  const nextDoc = touch({
    ...document,
    pages: {
      ...document.pages,
      [pageId]: { ...page, objectOrder: [...page.objectOrder, objectId] },
    },
    objects: { ...document.objects, [objectId]: imageFrame },
    assets: nextAssets,
  });

  return { document: nextDoc, objectId };
}


/**
 * Links two text frames so the source frame's story flows into the target frame.
 * Wraps the domain link engine, then recomputes per-frame overflow badges for the chain.
 * Throws on invalid frames or circular links (callers should surface the message).
 */
export function linkTextFramesCommand(
  document: RePageDocument,
  sourceFrameId: ObjectId,
  targetFrameId: ObjectId,
): RePageDocument {
  const linked = linkTextFramesEngine(document, sourceFrameId, targetFrameId);
  const withFlags = applyChainOverflowFlags(linked, sourceFrameId);
  return touch(withFlags);
}

/**
 * Breaks a text frame out of its flow chain AND forks its story.
 *
 * The detached frame's resulting subchain always gets its own independent
 * story copy with the text it was displaying; the other side keeps the
 * original story with its displayed text:
 * - Middle/tail frame: A→F→G becomes A (original story) and F→G (forked story).
 * - Head frame: A→B→C becomes A (forked story) and B→C (original story).
 *
 * After the fork, editing one side no longer affects the other. Overflow text
 * beyond the last frame travels with the forked (detached) side.
 *
 * Story text is split with the deterministic heuristic layout (the same
 * reference every headless path uses). Unlinking a frame that was never
 * linked only normalizes links.
 */
export function unlinkTextFrameCommand(
  document: RePageDocument,
  frameId: ObjectId,
): RePageDocument {
  const frame = document.objects[frameId];
  if (!frame || frame.type !== 'text-frame') return document;

  const chain = getTextFrameChain(document, frameId);
  const index = chain.findIndex((f) => f.id === frameId);
  if (index < 0 || chain.length < 2) {
    const unlinked = unlinkTextFrame(document, frameId);
    return touch(applyChainOverflowFlags(unlinked, frameId));
  }

  const storyId = chain[0]!.storyId;
  const story = document.stories[storyId];

  // 1. Slice the intact chain with the deterministic heuristic.
  const flow = computeChainTextSlices(document, chain);
  // Forked text span within the story: a middle/tail unlink forks
  // frames[index..] (text after the upstream slices); a head unlink forks
  // frames[0] only (its own first slice).
  let forkStart: number | null = null;
  let forkEnd: number | null = null;
  if (flow) {
    if (index > 0) {
      let start = 0;
      for (let k = 0; k < index; k++) start += (flow.slices[chain[k]!.id] ?? '').length;
      forkStart = start;
      forkEnd = null; // to end of story (includes the overflow remainder)
    } else {
      forkStart = 0;
      forkEnd = (flow.slices[chain[0]!.id] ?? '').length;
    }
  }

  // 2. Detach the frame.
  const detached = unlinkTextFrame(document, frameId);

  // 3. Fork the story: one split divides the paragraphs into the forked span
  // and the kept span. Without a story (or slices) there is nothing to split:
  // keep the detach but skip the fork.
  let next = detached;
  const detachedIds = index > 0 ? chain.slice(index).map((f) => f.id) : [frameId];
  const keptIds = index > 0 ? chain.slice(0, index).map((f) => f.id) : chain.slice(1).map((f) => f.id);
  if (story && forkStart !== null) {
    const totalLen = getStoryPlainText(story).length;
    const start = Math.min(forkStart, totalLen);
    const end = forkEnd === null ? totalLen : Math.min(forkEnd, totalLen);
    // Middle/tail: forked text is [start, end); the original story keeps [0, start).
    // Head: forked text is [0, end); the original story keeps [end, total).
    const splitAt = index > 0 ? start : end;
    const { head, tail } = splitStoryAtTextOffset(story, splitAt);
    const forkedParas = index > 0 ? tail : head;
    const keptParas = index > 0 ? head : tail;
    const forkedStoryId = createId('story');
    const forkedStory: TextStory = {
      id: forkedStoryId,
      name: `${story.name} (fork)`,
      content: { type: 'doc', content: forkedParas },
    };
    const updatedObjects = { ...next.objects };
    detachedIds.forEach((id, i) => {
      const f = updatedObjects[id] as TextFrameObject | undefined;
      if (f) updatedObjects[id] = { ...f, storyId: forkedStoryId, sequenceIndex: i };
    });
    keptIds.forEach((id, i) => {
      const f = updatedObjects[id] as TextFrameObject | undefined;
      if (f) updatedObjects[id] = { ...f, sequenceIndex: i };
    });
    next = {
      ...next,
      objects: updatedObjects,
      stories: {
        ...next.stories,
        [storyId]: { ...story, content: { type: 'doc', content: keptParas } },
        [forkedStoryId]: forkedStory,
      },
    };
  } else {
    const updatedObjects = { ...next.objects };
    detachedIds.forEach((id, i) => {
      const f = updatedObjects[id] as TextFrameObject | undefined;
      if (f) updatedObjects[id] = { ...f, sequenceIndex: i };
    });
    next = { ...next, objects: updatedObjects };
  }

  // 4. Recompute overflow badges for every resulting chain, then touch.
  let flagged = next;
  const flagRoots = index > 0 ? [chain[0]!.id, frameId] : [frameId, chain[1]!.id];
  for (const rootId of flagRoots) {
    flagged = applyChainOverflowFlags(flagged, rootId);
  }
  return touch(flagged);
}

/**
 * Returns the flow chain (in order) containing the given text frame.
 * Re-exported here so UI layers stay on the commands boundary.
 */
export function getLinkedFrameChain(document: RePageDocument, frameId: ObjectId) {
  return getTextFrameChain(document, frameId);
}
