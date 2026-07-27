import type {
  Insets,
  PageGuide,
  PageId,
  RePageDocument,
  SectionBreakType,
} from '../../domain/document/types';
import {
  applyPageSetup,
  ensureDocumentSections,
  getPagesForSection,
  insertSectionBreak,
} from '../../domain/layout/sectionEngine';

export type PageLayoutTarget =
  | { kind: 'current-page'; pageId: PageId }
  | { kind: 'selected-pages'; pageIds: PageId[] }
  | { kind: 'current-section'; sectionId: string }
  | { kind: 'whole-document' };

function touch(doc: RePageDocument): RePageDocument {
  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      modifiedAt: new Date().toISOString(),
    },
  };
}

/**
 * Resolves the target list of page IDs for a page layout command.
 */
export function resolveTargetPageIds(doc: RePageDocument, target: PageLayoutTarget): PageId[] {
  switch (target.kind) {
    case 'current-page':
      return doc.pages[target.pageId] ? [target.pageId] : [];
    case 'selected-pages':
      return target.pageIds.filter((id) => Boolean(doc.pages[id]));
    case 'current-section':
      return getPagesForSection(doc, target.sectionId);
    case 'whole-document':
      return [...doc.pageOrder];
  }
}

/**
 * Applies page setup (width, height, orientation, margins) to pages identified by target.
 */
export function applyPageSetupCommand(
  doc: RePageDocument,
  target: PageLayoutTarget,
  setup: {
    width?: number;
    height?: number;
    orientation?: 'portrait' | 'landscape';
    margins?: Insets;
  },
): RePageDocument {
  const pageIds = resolveTargetPageIds(doc, target);
  if (pageIds.length === 0) return doc;

  let nextDoc = doc;
  for (const pageId of pageIds) {
    nextDoc = applyPageSetup(nextDoc, pageId, setup);
  }

  return touch(nextDoc);
}

/**
 * Inserts a section break into the document.
 */
export function insertSectionBreakCommand(
  doc: RePageDocument,
  anchorPageId: PageId,
  type: SectionBreakType = 'next-page',
): RePageDocument {
  return touch(insertSectionBreak(doc, type, anchorPageId));
}

/**
 * Updates column settings for a document section.
 */
export function updateSectionColumnsCommand(
  doc: RePageDocument,
  sectionId: string,
  columns: 1 | 2 | 3 | 4,
  gap = 18,
  rtlColumnOrder = true,
): RePageDocument {
  const docWithSections = ensureDocumentSections(doc);
  const sections = docWithSections.sections || [];
  const sectionIndex = sections.findIndex((s) => s.id === sectionId);
  if (sectionIndex === -1) return doc;

  const updatedSections = [...sections];
  updatedSections[sectionIndex] = {
    ...updatedSections[sectionIndex]!,
    columns,
    columnGap: gap,
    rtlColumnOrder,
  };

  return touch({
    ...docWithSections,
    sections: updatedSections,
  });
}

/**
 * Sets print bleed insets for targeted pages.
 */
export function setPageBleedCommand(
  doc: RePageDocument,
  target: PageLayoutTarget,
  bleed: Insets,
): RePageDocument {
  const pageIds = resolveTargetPageIds(doc, target);
  if (pageIds.length === 0) return doc;

  const nextPages = { ...doc.pages };
  for (const pageId of pageIds) {
    const page = nextPages[pageId];
    if (page) {
      nextPages[pageId] = {
        ...page,
        bleed: { ...bleed },
      };
    }
  }

  return touch({
    ...doc,
    pages: nextPages,
  });
}

/**
 * Sets background color for targeted pages.
 */
export function setPageBackgroundCommand(
  doc: RePageDocument,
  target: PageLayoutTarget,
  color: string,
): RePageDocument {
  const pageIds = resolveTargetPageIds(doc, target);
  if (pageIds.length === 0) return doc;

  const nextPages = { ...doc.pages };
  for (const pageId of pageIds) {
    const page = nextPages[pageId];
    if (page) {
      nextPages[pageId] = {
        ...page,
        background: color,
      };
    }
  }

  return touch({
    ...doc,
    pages: nextPages,
  });
}

/**
 * Toggles rulers visibility setting.
 */
export function toggleRulersCommand(doc: RePageDocument, enabled?: boolean): RePageDocument {
  const current = doc.settings.showRulers ?? false;
  const nextValue = enabled ?? !current;

  return touch({
    ...doc,
    settings: {
      ...doc.settings,
      showRulers: nextValue,
    },
  });
}

/**
 * Toggles grid overlay visibility setting.
 */
export function toggleGridCommand(doc: RePageDocument, enabled?: boolean): RePageDocument {
  const current = doc.settings.showGrid ?? false;
  const nextValue = enabled ?? !current;

  return touch({
    ...doc,
    settings: {
      ...doc.settings,
      showGrid: nextValue,
    },
  });
}

/**
 * Toggles snap-to-guides setting.
 */
export function toggleSnapToGuidesCommand(doc: RePageDocument, enabled?: boolean): RePageDocument {
  const current = doc.settings.snapToGuides ?? false;
  const nextValue = enabled ?? !current;

  return touch({
    ...doc,
    settings: {
      ...doc.settings,
      snapToGuides: nextValue,
    },
  });
}

/**
 * Updates guidelines for a specific page.
 */
export function updateGuidesCommand(
  doc: RePageDocument,
  pageId: PageId,
  guides: PageGuide[],
): RePageDocument {
  const page = doc.pages[pageId];
  if (!page) return doc;

  return touch({
    ...doc,
    pages: {
      ...doc.pages,
      [pageId]: {
        ...page,
        guides: [...guides],
      },
    },
  });
}
