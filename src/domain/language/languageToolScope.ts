import type { RePageDocument, TextStory } from '../document/types';
import type { LanguageChange, LanguageToolScope } from './types';

export interface ScopeTextSpan {
  storyId: string;
  fullText: string;
  scopeFrom: number;
  scopeTo: number;
  text: string;
}

/**
 * Extracts plain text from a canonical TextStory by walking paragraph nodes and text runs.
 */
export function extractPlainTextFromStory(story: TextStory): string {
  if (!story || !story.content || !story.content.content) return '';

  const paragraphs: string[] = [];

  for (const block of story.content.content) {
    if (block && 'content' in block && Array.isArray(block.content)) {
      let pText = '';
      for (const node of block.content) {
        if (node.type === 'text' && typeof node.text === 'string') {
          pText += node.text;
        } else if (node.type === 'hardBreak') {
          pText += '\n';
        }
      }
      paragraphs.push(pText);
    }
  }

  return paragraphs.join('\n');
}

/**
 * Resolves target scope into text spans for language analysis.
 */
export function getScopeSpans(
  doc: RePageDocument,
  scope: LanguageToolScope,
): ScopeTextSpan[] {
  if (!doc || !doc.stories) return [];

  if (scope.kind === 'selection') {
    const story = doc.stories[scope.storyId];
    if (!story) return [];
    const fullText = extractPlainTextFromStory(story);
    const from = Math.max(0, Math.min(scope.from, fullText.length));
    const to = Math.max(from, Math.min(scope.to, fullText.length));
    return [
      {
        storyId: scope.storyId,
        fullText,
        scopeFrom: from,
        scopeTo: to,
        text: fullText.substring(from, to),
      },
    ];
  }

  if (scope.kind === 'story') {
    const story = doc.stories[scope.storyId];
    if (!story) return [];
    const fullText = extractPlainTextFromStory(story);
    return [
      {
        storyId: scope.storyId,
        fullText,
        scopeFrom: 0,
        scopeTo: fullText.length,
        text: fullText,
      },
    ];
  }

  // scope.kind === 'document'
  const spans: ScopeTextSpan[] = [];
  for (const [storyId, story] of Object.entries(doc.stories)) {
    const fullText = extractPlainTextFromStory(story);
    spans.push({
      storyId,
      fullText,
      scopeFrom: 0,
      scopeTo: fullText.length,
      text: fullText,
    });
  }

  return spans;
}

/**
 * Validates whether a LanguageChange can be safely applied to the document.
 * Protects against stale selections or out-of-bound ranges.
 */
export function validateLanguageChange(
  doc: RePageDocument,
  change: LanguageChange,
): boolean {
  if (!doc || !doc.stories) return false;
  const story = doc.stories[change.storyId];
  if (!story) return false;

  const fullText = extractPlainTextFromStory(story);

  if (change.from < 0 || change.to > fullText.length || change.from > change.to) {
    return false;
  }

  if (change.originalText !== undefined) {
    const actualSub = fullText.substring(change.from, change.to);
    if (actualSub !== change.originalText) {
      return false;
    }
  }

  return true;
}
