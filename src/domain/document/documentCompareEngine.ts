import type { RePageDocument } from './types';
import { PRIMARY_STORY_ID } from './createDocument';
import { recordRevision } from './trackChangesEngine';

/**
 * Compares two documents (Original vs Revised) and generates a unified document containing tracked revisions.
 */
export function compareDocuments(
  originalDoc: RePageDocument,
  revisedDoc: RePageDocument,
): RePageDocument {
  const origStory = originalDoc.stories[PRIMARY_STORY_ID];
  const revStory = revisedDoc.stories[PRIMARY_STORY_ID];

  if (!origStory?.content?.content || !revStory?.content?.content) {
    return originalDoc;
  }

  const origParas = origStory.content.content;
  const revParas = revStory.content.content;

  let resultDoc: RePageDocument = { ...revisedDoc, revisions: [] };

  // Identify inserted paragraphs in revised document
  revParas.forEach((para, idx) => {
    const text = para.content.map((r) => (r.type === 'text' ? r.text : '')).join('');
    const origMatch = origParas.find(
      (p) => p.content.map((r) => (r.type === 'text' ? r.text : '')).join('') === text,
    );

    if (!origMatch && text.trim()) {
      resultDoc = recordRevision(resultDoc, {
        type: 'insert',
        author: 'Compare Tool',
        text,
        paragraphIndex: idx,
      });
    }
  });

  // Identify deleted paragraphs from original document
  origParas.forEach((para, idx) => {
    const text = para.content.map((r) => (r.type === 'text' ? r.text : '')).join('');
    const revMatch = revParas.find(
      (p) => p.content.map((r) => (r.type === 'text' ? r.text : '')).join('') === text,
    );

    if (!revMatch && text.trim()) {
      resultDoc = recordRevision(resultDoc, {
        type: 'delete',
        author: 'Compare Tool',
        text,
        paragraphIndex: idx,
      });
    }
  });

  return resultDoc;
}
