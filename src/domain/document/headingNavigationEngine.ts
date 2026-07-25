import type { ParagraphNode } from '../rich-text/types';
import { PRIMARY_STORY_ID } from './createDocument';
import type { RePageDocument } from './types';

export interface HeadingNode {
  id: string;
  text: string;
  level: number;
  paragraphIndex: number;
  storyId: string;
  children: HeadingNode[];
}

/**
 * Determines the heading level of a paragraph (1 for H1/Headline, 2 for H2/Subheading, 3 for H3, 0 for body).
 */
export function getParagraphHeadingLevel(paragraph: ParagraphNode): number {
  const rawText = paragraph.content
    .map((run) => (run.type === 'text' ? run.text : ''))
    .join('')
    .trim();

  if (!rawText) return 0;

  const firstRun = paragraph.content[0];
  if (firstRun?.type === 'text' && firstRun.marks) {
    const isBold = firstRun.marks.some((m) => m.type === 'bold');
    const sizeMark = firstRun.marks.find((m) => m.type === 'fontSize');
    const fontSize = sizeMark && 'size' in sizeMark ? (sizeMark.size as number) : 12;

    if (fontSize >= 20 || (isBold && fontSize >= 16)) return 1;
    if (fontSize >= 15 || (isBold && fontSize >= 13)) return 2;
    if (isBold && fontSize >= 11) return 3;
  }

  // Heading prefix keyword heuristic (Urdu / English)
  if (/^(باب|عنوان|فصل|مضمون|Chapter|Section|Heading|H\d)\b/i.test(rawText)) {
    return 1;
  }

  return 0;
}

/**
 * Extracts a hierarchical tree of headings from the primary document story.
 */
export function extractHeadingTree(
  doc: RePageDocument,
  storyId = PRIMARY_STORY_ID,
): HeadingNode[] {
  const story = doc.stories[storyId];
  if (!story?.content?.content) return [];

  const flatNodes: HeadingNode[] = [];

  story.content.content.forEach((paragraph, index) => {
    const level = getParagraphHeadingLevel(paragraph);
    if (level > 0) {
      const text = paragraph.content
        .map((run) => (run.type === 'text' ? run.text : ''))
        .join('')
        .trim();

      flatNodes.push({
        id: `heading_${storyId}_${index}`,
        text,
        level,
        paragraphIndex: index,
        storyId,
        children: [],
      });
    }
  });

  const root: HeadingNode[] = [];
  const stack: HeadingNode[] = [];

  for (const node of flatNodes) {
    while (stack.length > 0 && stack[stack.length - 1]!.level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1]!.children.push(node);
    }

    stack.push(node);
  }

  return root;
}

/**
 * Safely reorders a heading section (the heading and all its child paragraphs) up or down in the story.
 */
export function reorderHeadingSection(
  doc: RePageDocument,
  headingParagraphIndex: number,
  direction: 'up' | 'down',
  storyId = PRIMARY_STORY_ID,
): RePageDocument {
  const story = doc.stories[storyId];
  if (!story?.content?.content) return doc;

  const paragraphs = [...story.content.content];
  const targetHeading = paragraphs[headingParagraphIndex];
  if (!targetHeading) return doc;

  const targetLevel = getParagraphHeadingLevel(targetHeading);
  if (targetLevel === 0) return doc;

  let targetEndIndex = headingParagraphIndex + 1;
  while (targetEndIndex < paragraphs.length) {
    const p = paragraphs[targetEndIndex]!;
    const level = getParagraphHeadingLevel(p);
    if (level > 0 && level <= targetLevel) {
      break;
    }
    targetEndIndex++;
  }

  const targetSection = paragraphs.slice(headingParagraphIndex, targetEndIndex);

  if (direction === 'up') {
    let prevHeadingIndex = -1;
    for (let i = headingParagraphIndex - 1; i >= 0; i--) {
      const level = getParagraphHeadingLevel(paragraphs[i]!);
      if (level > 0 && level <= targetLevel) {
        prevHeadingIndex = i;
        break;
      }
    }

    if (prevHeadingIndex === -1) return doc;

    const remaining = [
      ...paragraphs.slice(0, headingParagraphIndex),
      ...paragraphs.slice(targetEndIndex),
    ];
    remaining.splice(prevHeadingIndex, 0, ...targetSection);

    const updatedStory = {
      ...story,
      content: {
        ...story.content,
        content: remaining,
      },
    };

    return {
      ...doc,
      stories: {
        ...doc.stories,
        [storyId]: updatedStory,
      },
    };
  } else {
    if (targetEndIndex >= paragraphs.length) return doc;

    let nextSectionEndIndex = targetEndIndex + 1;
    while (nextSectionEndIndex < paragraphs.length) {
      const p = paragraphs[nextSectionEndIndex]!;
      const level = getParagraphHeadingLevel(p);
      if (level > 0 && level <= targetLevel) {
        break;
      }
      nextSectionEndIndex++;
    }

    const nextSection = paragraphs.slice(targetEndIndex, nextSectionEndIndex);

    const before = paragraphs.slice(0, headingParagraphIndex);
    const after = paragraphs.slice(nextSectionEndIndex);

    const reordered = [...before, ...nextSection, ...targetSection, ...after];

    const updatedStory = {
      ...story,
      content: {
        ...story.content,
        content: reordered,
      },
    };

    return {
      ...doc,
      stories: {
        ...doc.stories,
        [storyId]: updatedStory,
      },
    };
  }
}
