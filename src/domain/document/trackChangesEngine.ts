import type { RePageDocument, TrackedRevision } from './types';
import { PRIMARY_STORY_ID } from './createDocument';

export type EditMode = 'editing' | 'reviewing' | 'viewing';

/**
 * Records a new tracked revision in document metadata.
 */
export function recordRevision(
  doc: RePageDocument,
  revision: Omit<TrackedRevision, 'id' | 'timestamp'>,
): RePageDocument {
  const existing = doc.revisions || [];
  const newRev: TrackedRevision = {
    ...revision,
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...doc,
    revisions: [...existing, newRev],
  };
}

/**
 * Accepts a specific tracked revision.
 */
export function acceptRevision(doc: RePageDocument, revisionId: string): RePageDocument {
  const existing = doc.revisions || [];
  const target = existing.find((r) => r.id === revisionId);
  if (!target) return doc;

  const remainingRevisions = existing.filter((r) => r.id !== revisionId);
  const primaryStory = doc.stories[PRIMARY_STORY_ID];

  if (!primaryStory?.content?.content) {
    return { ...doc, revisions: remainingRevisions };
  }

  // If revision was a deletion, remove the paragraph content upon acceptance
  if (target.type === 'delete') {
    const updatedParagraphs = primaryStory.content.content.filter(
      (_, idx) => idx !== target.paragraphIndex,
    );

    return {
      ...doc,
      revisions: remainingRevisions,
      stories: {
        ...doc.stories,
        [PRIMARY_STORY_ID]: {
          ...primaryStory,
          content: {
            ...primaryStory.content,
            content: updatedParagraphs,
          },
        },
      },
    };
  }

  return {
    ...doc,
    revisions: remainingRevisions,
  };
}

/**
 * Rejects a specific tracked revision.
 */
export function rejectRevision(doc: RePageDocument, revisionId: string): RePageDocument {
  const existing = doc.revisions || [];
  const target = existing.find((r) => r.id === revisionId);
  if (!target) return doc;

  const remainingRevisions = existing.filter((r) => r.id !== revisionId);
  const primaryStory = doc.stories[PRIMARY_STORY_ID];

  if (!primaryStory?.content?.content) {
    return { ...doc, revisions: remainingRevisions };
  }

  // If revision was an insertion, remove the inserted paragraph upon rejection
  if (target.type === 'insert') {
    const updatedParagraphs = primaryStory.content.content.filter(
      (_, idx) => idx !== target.paragraphIndex,
    );

    return {
      ...doc,
      revisions: remainingRevisions,
      stories: {
        ...doc.stories,
        [PRIMARY_STORY_ID]: {
          ...primaryStory,
          content: {
            ...primaryStory.content,
            content: updatedParagraphs,
          },
        },
      },
    };
  }

  return {
    ...doc,
    revisions: remainingRevisions,
  };
}

/**
 * Accepts all pending tracked revisions.
 */
export function acceptAllRevisions(doc: RePageDocument): RePageDocument {
  let result = doc;
  const revisions = [...(doc.revisions || [])];

  for (const rev of revisions) {
    result = acceptRevision(result, rev.id);
  }

  return {
    ...result,
    revisions: [],
  };
}

/**
 * Rejects all pending tracked revisions.
 */
export function rejectAllRevisions(doc: RePageDocument): RePageDocument {
  let result = doc;
  const revisions = [...(doc.revisions || [])];

  for (const rev of revisions) {
    result = rejectRevision(result, rev.id);
  }

  return {
    ...result,
    revisions: [],
  };
}
