import { millimetresToPoints, PAGE_PRESETS } from '../geometry/units';
import { createId } from '../document/ids';
import type { MasterPage, MasterPageId, PageId, PageObject, RePageDocument } from '../document/types';

/**
 * Creates a new MasterPage definition.
 */
export function createMasterPage(
  name = 'A-Master',
  width = PAGE_PRESETS.a4.width,
  height = PAGE_PRESETS.a4.height,
): MasterPage {
  return {
    id: createId('master'),
    name,
    width,
    height,
    margins: {
      top: millimetresToPoints(15),
      right: millimetresToPoints(15),
      bottom: millimetresToPoints(15),
      left: millimetresToPoints(15),
    },
    objectOrder: [],
    objects: {},
  };
}

/**
 * Applies a master page to a target list of page IDs.
 */
export function applyMasterToPages(
  doc: RePageDocument,
  masterPageId: MasterPageId,
  pageIds: PageId[],
): RePageDocument {
  if (!doc.masterPages?.[masterPageId]) {
    throw new Error(`Master page '${masterPageId}' does not exist in document`);
  }

  const updatedPages = { ...doc.pages };

  for (const pageId of pageIds) {
    const page = updatedPages[pageId];
    if (page) {
      updatedPages[pageId] = {
        ...page,
        masterPageId,
      };
    }
  }

  return {
    ...doc,
    pages: updatedPages,
  };
}

/**
 * Sets per-page overrides for a master object on a specific page.
 */
export function overrideMasterObject(
  doc: RePageDocument,
  pageId: PageId,
  masterObjectId: string,
  overrides: Partial<PageObject>,
): RePageDocument {
  const page = doc.pages[pageId];
  if (!page) return doc;

  const currentOverrides = page.masterOverrides ?? {};

  const updatedPage = {
    ...page,
    masterOverrides: {
      ...currentOverrides,
      [masterObjectId]: {
        ...(currentOverrides[masterObjectId] ?? {}),
        ...overrides,
      },
    },
  };

  return {
    ...doc,
    pages: {
      ...doc.pages,
      [pageId]: updatedPage,
    },
  };
}

/**
 * Resolves all rendering objects for a page (Master Page objects + local Page objects merged).
 */
export function resolvePageCompositeObjects(
  doc: RePageDocument,
  pageId: PageId,
): PageObject[] {
  const page = doc.pages[pageId];
  if (!page) return [];

  const composite: PageObject[] = [];

  // Inherit master page objects if assigned
  if (page.masterPageId && doc.masterPages?.[page.masterPageId]) {
    const master = doc.masterPages[page.masterPageId]!;
    const overridesMap = page.masterOverrides ?? {};

    for (const masterObjId of master.objectOrder) {
      const masterObj = master.objects[masterObjId];
      if (!masterObj || masterObj.hidden) continue;

      const overrideProps = overridesMap[masterObjId] ?? {};
      const resolvedObj: PageObject = {
        ...masterObj,
        ...overrideProps,
        pageId: page.id, // Re-bind pageId to target page
      } as PageObject;

      composite.push(resolvedObj);
    }
  }

  // Append local page objects
  for (const localObjId of page.objectOrder) {
    const localObj = doc.objects[localObjId];
    if (localObj && !localObj.hidden) {
      composite.push(localObj);
    }
  }

  return composite;
}
