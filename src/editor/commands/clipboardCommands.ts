/**
 * Canonical Document Clipboard Commands
 *
 * Implements Cut, Copy, Paste, and Paste Unformatted operating directly on
 * RePage canonical documents without relying on document.execCommand as primary path.
 * Preserves Urdu ZWNJ, ZWJ, and bidi control characters intact.
 */

import type { RePageDocument } from '../../domain/document/types';
import { copyToClipboard, readFromClipboard } from '../../platform/clipboard';

export interface SelectionRange {
  storyId: string;
  start: number;
  end: number;
  text?: string;
}

/**
 * Sanitizes plain text input ensuring Urdu ZWNJ, ZWJ, and bidi marks are preserved.
 */
export function preserveUrduText(text: string): string {
  // Normalize invalid control chars (ASCII 0-8, 11-12, 14-31) but explicitly preserve ZWNJ, ZWJ, RLM, LRM, ALM
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

/**
 * Copies active selection text or object payload to system clipboard.
 */
export async function copySelection(text: string): Promise<boolean> {
  const clean = preserveUrduText(text);
  return await copyToClipboard(clean);
}

/**
 * Cuts selection: copies selected text to clipboard and returns updated document with selection removed.
 */
export async function cutSelection(
  doc: RePageDocument,
  selection: SelectionRange,
): Promise<{ doc: RePageDocument; text: string }> {
  const story = doc.stories[selection.storyId];
  if (!story || selection.start >= selection.end) {
    return { doc, text: '' };
  }

  let extractedText = selection.text || '';
  const updatedDoc: RePageDocument = JSON.parse(JSON.stringify(doc));
  const targetStory = updatedDoc.stories[selection.storyId];

  if (targetStory && targetStory.content && Array.isArray(targetStory.content.content)) {
    let charCounter = 0;
    const slices: string[] = [];
    for (const paragraph of targetStory.content.content) {
      if (!paragraph.content) continue;
      for (const run of paragraph.content) {
        if (run.type === 'text' && typeof run.text === 'string') {
          const runLen = run.text.length;
          if (charCounter + runLen > selection.start && charCounter < selection.end) {
            const localStart = Math.max(0, selection.start - charCounter);
            const localEnd = Math.min(runLen, selection.end - charCounter);
            slices.push(run.text.slice(localStart, localEnd));
            run.text = run.text.slice(0, localStart) + run.text.slice(localEnd);
          }
          charCounter += runLen;
        }
      }
    }
    if (!extractedText && slices.length > 0) {
      extractedText = slices.join('');
    }
  }

  if (extractedText) {
    await copyToClipboard(preserveUrduText(extractedText));
  }

  return { doc: updatedDoc, text: extractedText };
}

/**
 * Pastes plain or formatted text into active story position.
 */
export function pasteText(
  doc: RePageDocument,
  selection: SelectionRange,
  incomingText: string,
): RePageDocument {
  const cleanText = preserveUrduText(incomingText);
  if (!cleanText) return doc;

  const updatedDoc: RePageDocument = JSON.parse(JSON.stringify(doc));
  const story = updatedDoc.stories[selection.storyId];
  if (!story || !story.content || !Array.isArray(story.content.content)) {
    return doc;
  }

  let charCounter = 0;
  let inserted = false;
  for (const paragraph of story.content.content) {
    if (!paragraph.content) paragraph.content = [];

    if (paragraph.content.length === 0) {
      paragraph.content.push({ type: 'text', text: cleanText });
      inserted = true;
      break;
    }

    for (const run of paragraph.content) {
      if (run.type === 'text' && typeof run.text === 'string') {
        const runLen = run.text.length;
        if (!inserted && charCounter <= selection.start && selection.start <= charCounter + runLen) {
          const offset = selection.start - charCounter;
          run.text = run.text.slice(0, offset) + cleanText + run.text.slice(offset);
          inserted = true;
          break;
        }
        charCounter += runLen;
      }
    }
    if (inserted) break;
  }

  if (!inserted && story.content.content.length > 0) {
    const firstP = story.content.content[0];
    if (firstP) {
      if (!firstP.content) firstP.content = [];
      if (firstP.content.length === 0) {
        firstP.content.push({ type: 'text', text: cleanText });
      } else {
        const firstRun = firstP.content[0];
        if (firstRun && firstRun.type === 'text') {
          firstRun.text = (firstRun.text || '') + cleanText;
        }
      }
    }
  }

  return updatedDoc;
}

/**
 * Pastes unformatted text from system clipboard, preserving Urdu bidi/joiners.
 */
export async function pasteUnformatted(
  doc: RePageDocument,
  selection: SelectionRange,
): Promise<RePageDocument> {
  const clipText = await readFromClipboard();
  if (!clipText) return doc;
  return pasteText(doc, selection, clipText);
}
