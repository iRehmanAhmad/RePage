import type { ParagraphNode, RichTextDocument, TextRun } from '../rich-text/types';
import { formatPageNumber } from '../unicode/pageNumbering';
import type { IndexEntry, RePageDocument, TextFrameObject } from './types';

export interface IndexGroup {
  letter: string;
  entries: {
    term: string;
    subterm?: string;
    pageNumbers: string[];
  }[];
}

/**
 * Compiles a structured Subject Index (فہرست اشاریہ) grouped alphabetically by first letter.
 */
export function generateSubjectIndex(doc: RePageDocument, lang: 'ur' | 'en' = 'ur'): IndexGroup[] {
  const rawEntries: IndexEntry[] = doc.indexEntries ? [...doc.indexEntries] : [];

  // Also scan XE markers in primary document text frames
  doc.pageOrder.forEach((pageId, pageIndex) => {
    const page = doc.pages[pageId];
    if (!page) return;

    for (const objId of page.objectOrder) {
      const obj = doc.objects[objId];
      if (obj?.type === 'text-frame') {
        const story = doc.stories[(obj as TextFrameObject).storyId];
        if (!story?.content?.content) continue;

        for (const paragraph of story.content.content) {
          const rawText = paragraph.content
            .map((run) => (run.type === 'text' ? run.text : ''))
            .join(' ');

          // Look for XE index tag syntax: {XE "term"} or [INDEX: term]
          const xeMatch = rawText.match(/\{XE\s+"([^"]+)"\}/i) || rawText.match(/\[INDEX:\s*([^\]]+)\]/i);
          if (xeMatch && xeMatch[1]) {
            const term = xeMatch[1].trim();
            const formattedPageNumber = formatPageNumber(pageIndex, { style: lang === 'ur' ? 'urdu' : 'western' });
            rawEntries.push({
              id: `xe_${pageId}_${rawEntries.length + 1}`,
              term,
              pageId,
              formattedPageNumber,
            });
          }
        }
      }
    }
  });

  if (rawEntries.length === 0) return [];

  // Consolidate entries by term
  const termMap = new Map<string, Set<string>>();
  for (const entry of rawEntries) {
    const existing = termMap.get(entry.term) || new Set<string>();
    existing.add(entry.formattedPageNumber);
    termMap.set(entry.term, existing);
  }

  // Group alphabetically by first character
  const groupMap = new Map<string, { term: string; pageNumbers: string[] }[]>();

  Array.from(termMap.entries()).sort((a, b) => a[0].localeCompare(b[0], lang === 'ur' ? 'ur' : 'en')).forEach(([term, pageSet]) => {
    const letter = term.charAt(0).toUpperCase();
    const existingGroup = groupMap.get(letter) || [];
    existingGroup.push({
      term,
      pageNumbers: Array.from(pageSet),
    });
    groupMap.set(letter, existingGroup);
  });

  return Array.from(groupMap.entries()).map(([letter, entries]) => ({
    letter,
    entries,
  }));
}

/**
 * Builds canonical RichTextDocument representing the Subject Index.
 */
export function buildIndexRichTextDocument(
  groups: IndexGroup[],
  title = 'فہرست اشاریہ (Subject Index)',
): RichTextDocument {
  const titleParagraph: ParagraphNode = {
    type: 'paragraph',
    alignment: 'center',
    direction: 'rtl',
    content: [
      {
        type: 'text',
        text: title,
        marks: [{ type: 'bold' }, { type: 'fontSize', size: 24 }],
      },
    ],
  };

  const paragraphs: ParagraphNode[] = [titleParagraph];

  for (const group of groups) {
    // Group Header Letter
    paragraphs.push({
      type: 'paragraph',
      alignment: 'start',
      direction: 'rtl',
      content: [
        {
          type: 'text',
          text: `--- ${group.letter} ---`,
          marks: [{ type: 'bold' }, { type: 'fontSize', size: 16 }],
        },
      ],
    });

    // Terms
    for (const item of group.entries) {
      const textRun: TextRun = {
        type: 'text',
        text: `${item.term} ................. ${item.pageNumbers.join(', ')}`,
      };

      paragraphs.push({
        type: 'paragraph',
        alignment: 'start',
        direction: 'rtl',
        content: [textRun],
      });
    }
  }

  return {
    type: 'doc',
    content: paragraphs,
  };
}
