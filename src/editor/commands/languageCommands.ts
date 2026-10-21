import type { RePageDocument, TextStory } from '../../domain/document/types';
import type { InlineNode, ParagraphNode, TextRun } from '../../domain/rich-text/types';
import { validateLanguageChange } from '../../domain/language/languageToolScope';
import { normalizeForDictionary } from '../../domain/language/urduDictionary';
import type { LanguageChange } from '../../domain/language/types';

/**
 * Replaces character range [from, to] within a canonical TextStory,
 * preserving paragraph structure, rich text marks, and bidi/joiner controls.
 */
export function replaceRangeInStory(
  story: TextStory,
  from: number,
  to: number,
  replacement: string,
): TextStory {
  if (!story || !story.content || !story.content.content) return story;
  if (from < 0 || from > to) return story;

  const newBlocks: ParagraphNode[] = [];
  let currentOffset = 0;

  for (const block of story.content.content) {
    if (!block || !('content' in block) || !Array.isArray(block.content)) {
      newBlocks.push(block);
      continue;
    }

    const newInlineNodes: InlineNode[] = [];

    for (const node of block.content) {
      if (node.type === 'text' && typeof node.text === 'string') {
        const runLen = node.text.length;
        const runStart = currentOffset;
        const runEnd = runStart + runLen;

        if (to <= runStart || from >= runEnd) {
          // Range does not touch this run
          newInlineNodes.push(node);
        } else {
          // Range overlaps with this run
          const sliceBefore = node.text.substring(0, Math.max(0, from - runStart));
          const sliceAfter = node.text.substring(Math.min(runLen, to - runStart));

          // If this run covers the start of the replacement range (or range is entirely within run)
          const insertHere = from >= runStart && from <= runEnd;
          const newText = sliceBefore + (insertHere ? replacement : '') + sliceAfter;

          if (newText.length > 0) {
            const updatedRun: TextRun = {
              type: 'text',
              text: newText,
              ...(node.marks ? { marks: [...node.marks] } : {}),
            };
            newInlineNodes.push(updatedRun);
          }
        }

        currentOffset = runEnd;
      } else if (node.type === 'hardBreak') {
        const runStart = currentOffset;
        const runEnd = runStart + 1;

        if (to <= runStart || from >= runEnd) {
          newInlineNodes.push(node);
        }
        currentOffset = runEnd;
      } else {
        newInlineNodes.push(node);
      }
    }

    newBlocks.push({
      ...block,
      content: newInlineNodes,
    });

    currentOffset += 1; // paragraph break
  }

  return {
    ...story,
    content: {
      ...story.content,
      content: newBlocks,
    },
  };
}

/**
 * Applies a batch of proposed LanguageChange items to a RePageDocument as a single canonical transaction.
 *
 * Rules:
 * 1. Validates each change against the current document state; skips stale or invalid changes.
 * 2. Applies changes in reverse offset order (highest from/to first) so character indices remain valid.
 * 3. Preserves all rich text marks, paragraph formatting, bidi marks, ZWNJ/ZWJ joiners, and combining marks.
 * 4. Never uses DOM mutation. Returns a complete updated RePageDocument.
 */
export function applyLanguageChangesCommand(
  doc: RePageDocument,
  changes: LanguageChange[],
): RePageDocument {
  if (!doc || !changes || changes.length === 0) return doc;

  // Filter out changes that fail current document validation
  const validChanges = changes.filter((ch) => validateLanguageChange(doc, ch));
  if (validChanges.length === 0) return doc;

  // Sort valid changes in reverse offset order (highest storyId & from index first)
  const sortedChanges = [...validChanges].sort((a, b) => {
    if (a.storyId !== b.storyId) {
      return b.storyId.localeCompare(a.storyId);
    }
    return b.from - a.from;
  });

  let updatedStories = { ...doc.stories };

  for (const change of sortedChanges) {
    const currentStory = updatedStories[change.storyId];
    if (!currentStory) continue;

    const modifiedStory = replaceRangeInStory(
      currentStory,
      change.from,
      change.to,
      change.replacement,
    );

    updatedStories[change.storyId] = modifiedStory;
  }

  return {
    ...doc,
    stories: updatedStories,
  };
}

// --- Per-document spellcheck ignore list ---------------------------------------
// Stored in document metadata (schema-validated, persisted in the .urdup
// package). Distinct from the session ignore (memory-only) and the personal
// dictionary (global): these words are ignored in THIS document only.

function withIgnoredWords(
  doc: RePageDocument,
  words: string[] | undefined,
): RePageDocument {
  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      spellcheckIgnoredWords: words,
      modifiedAt: new Date().toISOString(),
    },
  };
}

/** Adds a word to the document's spellcheck ignore list (deduplicated). */
export function addDocumentIgnoredWordCommand(
  doc: RePageDocument,
  word: string,
): RePageDocument {
  const trimmed = word.trim();
  if (!trimmed) return doc;
  const current = doc.metadata.spellcheckIgnoredWords ?? [];
  // Dedupe on the engine's lookup keys so "Teh" after "teh" (or an aerab
  // variant) does not create a second entry for the same word.
  const key = normalizeForDictionary(trimmed);
  const latinKey = trimmed.toLowerCase();
  const exists = current.some(
    (w) => normalizeForDictionary(w) === key || w.toLowerCase() === latinKey,
  );
  if (exists) return doc;
  return withIgnoredWords(doc, [...current, trimmed]);
}

/** Removes one word from the document's spellcheck ignore list. */
export function removeDocumentIgnoredWordCommand(
  doc: RePageDocument,
  word: string,
): RePageDocument {
  const current = doc.metadata.spellcheckIgnoredWords;
  if (!current || current.length === 0) return doc;
  const next = current.filter((w) => w !== word);
  if (next.length === current.length) return doc;
  return withIgnoredWords(doc, next.length > 0 ? next : undefined);
}

/** Clears the document's whole spellcheck ignore list (flagging resumes). */
export function clearDocumentIgnoredWordsCommand(
  doc: RePageDocument,
): RePageDocument {
  if (!doc.metadata.spellcheckIgnoredWords) return doc;
  return withIgnoredWords(doc, undefined);
}
