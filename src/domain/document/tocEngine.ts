import type { ParagraphNode, RichTextDocument, TextRun } from '../rich-text/types';
import { formatPageNumber, type PageNumberingOptions } from '../unicode/pageNumbering';
import type { PageId, RePageDocument, TextFrameObject } from './types';

export interface TocEntry {
  id: string;
  title: string;
  level: number;
  pageId: PageId;
  pageIndex: number;
  formattedPageNumber: string;
}

export interface TocOptions {
  targetParagraphStyles?: string[] | undefined;
  numberingOptions?: PageNumberingOptions | undefined;
  title?: string | undefined;
}

/**
 * Scans document pages to generate a structured Table of Contents (فہرست مضامین).
 */
export function generateTableOfContents(
  doc: RePageDocument,
  options: TocOptions = {},
): TocEntry[] {
  const {
    targetParagraphStyles = ['headline', 'subheading'],
    numberingOptions = { style: 'urdu', prefix: 'صفحہ ' },
  } = options;

  const entries: TocEntry[] = [];

  doc.pageOrder.forEach((pageId, pageIndex) => {
    const page = doc.pages[pageId];
    if (!page) return;

    for (const objId of page.objectOrder) {
      const obj = doc.objects[objId];
      if (obj?.type === 'text-frame') {
        const textFrame = obj as TextFrameObject;
        const story = doc.stories[textFrame.storyId];
        if (!story?.content?.content) continue;

        for (const paragraph of story.content.content) {
          // Check if paragraph style or first text run matches target heading criteria
          const rawText = paragraph.content
            .map((run) => (run.type === 'text' ? run.text : ''))
            .join('')
            .trim();

          if (!rawText) continue;

          // Simple heading heuristic: line starts with non-empty title or matches style
          const isHeading =
            targetParagraphStyles.includes(textFrame.fontFamily) ||
            rawText.length < 60;

          if (isHeading) {
            entries.push({
              id: `toc_entry_${entries.length + 1}`,
              title: rawText,
              level: 1,
              pageId,
              pageIndex,
              formattedPageNumber: formatPageNumber(pageIndex, numberingOptions),
            });
          }
        }
      }
    }
  });

  return entries;
}

/**
 * Resolves active running header title for a specific page (e.g., Chapter Title).
 */
export function generateRunningHeaderForPage(
  doc: RePageDocument,
  targetPageId: PageId,
): string {
  const pageIndex = doc.pageOrder.indexOf(targetPageId);
  if (pageIndex === -1) return '';

  // Scan backwards from target page to find last heading title
  for (let i = pageIndex; i >= 0; i--) {
    const pageId = doc.pageOrder[i]!;
    const page = doc.pages[pageId];
    if (!page) continue;

    for (const objId of page.objectOrder) {
      const obj = doc.objects[objId];
      if (obj?.type === 'text-frame') {
        const story = doc.stories[(obj as TextFrameObject).storyId];
        if (!story?.content?.content) continue;

        for (const paragraph of story.content.content) {
          const rawText = paragraph.content
            .map((run) => (run.type === 'text' ? run.text : ''))
            .join('')
            .trim();

          if (rawText && rawText.length < 60) {
            return rawText;
          }
        }
      }
    }
  }

  return doc.metadata.title || '';
}

/**
 * Constructs a canonical RichTextDocument representing the Table of Contents story.
 */
export function buildTocRichTextDocument(
  entries: TocEntry[],
  title = 'فہرست مضامین (Table of Contents)',
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

  const entryParagraphs: ParagraphNode[] = entries.map((entry) => {
    const textRun: TextRun = {
      type: 'text',
      text: `${entry.title} .................................... ${entry.formattedPageNumber}`,
    };

    return {
      type: 'paragraph',
      alignment: 'start',
      direction: 'rtl',
      content: [textRun],
    };
  });

  return {
    type: 'doc',
    content: [titleParagraph, ...entryParagraphs],
  };
}
