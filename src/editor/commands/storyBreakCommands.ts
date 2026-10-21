import type { RePageDocument, StoryId } from '../../domain/document/types';
import type { InlineNode, ParagraphNode } from '../../domain/rich-text/types';

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
 * Plain-text length of a paragraph in the coordinates used by the story
 * engines: text runs count their characters; zero-width nodes (hard
 * breaks, breaks) count 0.
 */
function paragraphTextLength(paragraph: ParagraphNode): number {
  return paragraph.content.reduce(
    (sum, node) => sum + (node.type === 'text' ? node.text.length : 0),
    0,
  );
}

/**
 * Inserts an explicit break node ('page' | 'column') into a story
 * paragraph at a plain-text character offset, splitting a text run when
 * the offset falls inside one. Marks of a split run are preserved on both
 * halves; zero-width nodes sitting exactly at the offset stay before the
 * break. Returns the document unchanged for an unknown story or an
 * out-of-range paragraph index; the offset is clamped to the paragraph.
 *
 * This is the canonical mutation for story breaks: the live editors
 * insert the same node through the Tiptap RePageBreak extension and the
 * result reaches the document through the normal story commit, while
 * headless callers (tests, importers, automation) use this command.
 */
export function insertStoryBreakCommand(
  doc: RePageDocument,
  storyId: StoryId,
  paragraphIndex: number,
  charOffset: number,
  breakType: 'page' | 'column',
): RePageDocument {
  const story = doc.stories[storyId];
  if (!story || paragraphIndex < 0 || paragraphIndex >= story.content.content.length) {
    return doc;
  }

  const paragraph = story.content.content[paragraphIndex]!;
  const target = Math.max(0, Math.min(charOffset, paragraphTextLength(paragraph)));

  const content: InlineNode[] = [];
  let acc = 0;
  let inserted = false;
  for (const node of paragraph.content) {
    if (inserted) {
      content.push(node);
      continue;
    }
    if (node.type !== 'text') {
      // Zero-width nodes at or before the offset stay before the break;
      // the break is emitted when the offset point is reached (below).
      content.push(node);
      continue;
    }
    const len = node.text.length;
    if (acc + len < target) {
      content.push(node);
      acc += len;
      continue;
    }
    // The offset falls inside (or at the end of) this run: split it.
    const cut = target - acc;
    if (cut > 0) content.push({ ...node, text: node.text.slice(0, cut) });
    content.push({ type: 'break', breakType });
    inserted = true;
    if (cut < len) content.push({ ...node, text: node.text.slice(cut) });
    acc += len;
  }
  if (!inserted) {
    // Offset at the very end of the paragraph.
    content.push({ type: 'break', breakType });
  }

  const paragraphs = [...story.content.content];
  paragraphs[paragraphIndex] = { ...paragraph, content };

  return touch({
    ...doc,
    stories: {
      ...doc.stories,
      [storyId]: {
        ...story,
        content: { ...story.content, content: paragraphs },
      },
    },
  });
}

/**
 * Sets (or clears) a paragraph's pageBreakBefore flag. This is the
 * command-path counterpart of the Paragraph dialog's "Page break before"
 * checkbox, which reaches the same field through the editor's paragraph
 * attributes. Absent/false are equivalent; clearing removes the key so
 * saved documents stay minimal.
 */
export function setParagraphPageBreakBeforeCommand(
  doc: RePageDocument,
  storyId: StoryId,
  paragraphIndex: number,
  value: boolean,
): RePageDocument {
  const story = doc.stories[storyId];
  if (!story || paragraphIndex < 0 || paragraphIndex >= story.content.content.length) {
    return doc;
  }

  const paragraph = story.content.content[paragraphIndex]!;
  if ((paragraph.pageBreakBefore ?? false) === value) return doc;

  const paragraphs = [...story.content.content];
  if (value) {
    paragraphs[paragraphIndex] = { ...paragraph, pageBreakBefore: true };
  } else {
    // Remove the key entirely so saved documents stay minimal.
    const { pageBreakBefore: _removed, ...rest } = paragraph;
    paragraphs[paragraphIndex] = rest;
  }

  return touch({
    ...doc,
    stories: {
      ...doc.stories,
      [storyId]: {
        ...story,
        content: { ...story.content, content: paragraphs },
      },
    },
  });
}
