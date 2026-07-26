import { describe, expect, it } from 'vitest';
import { createDocument, PRIMARY_STORY_ID } from '../../domain/document/createDocument';
import { paragraph } from '../../domain/rich-text/types';
import {
  copySelection,
  cutSelection,
  pasteText,
  preserveUrduText,
} from './clipboardCommands';

describe('Canonical Clipboard Commands', () => {
  it('preserves Urdu zero-width joiners (ZWNJ, ZWJ) and bidi marks in text', () => {
    const urduWithMarks = 'اردو\u200Cترجمہ \u200E(Urdu)\u200F \u061C';
    const cleaned = preserveUrduText(urduWithMarks);
    expect(cleaned).toBe(urduWithMarks);
    expect(cleaned).toContain('\u200C');
    expect(cleaned).toContain('\u200E');
    expect(cleaned).toContain('\u200F');
    expect(cleaned).toContain('\u061C');
  });

  it('pastes text into canonical document story', () => {
    const doc = createDocument();
    const primaryStory = doc.stories[PRIMARY_STORY_ID];
    if (primaryStory && primaryStory.content && primaryStory.content.content) {
      primaryStory.content.content = [paragraph('ابتدائی متن', 'rtl')];
    }

    const selection = { storyId: PRIMARY_STORY_ID, start: 0, end: 0 };
    const updated = pasteText(doc, selection, 'سلام دنیا ');

    const updatedStory = updated.stories[PRIMARY_STORY_ID];
    const textRun = updatedStory?.content?.content?.[0]?.content?.[0];
    expect(textRun).toBeDefined();
    if (textRun && textRun.type === 'text') {
      expect(textRun.text).toContain('سلام دنیا');
    }
  });

  it('cuts selected range from document story and returns deleted text', async () => {
    const doc = createDocument();
    const primaryStory = doc.stories[PRIMARY_STORY_ID];
    if (primaryStory && primaryStory.content && primaryStory.content.content) {
      primaryStory.content.content = [paragraph('یہاں کلک کریں', 'rtl')];
    }

    const selection = { storyId: PRIMARY_STORY_ID, start: 0, end: 4 };
    const { doc: updatedDoc, text } = await cutSelection(doc, selection);

    expect(text).toBe('یہاں');
    const updatedStory = updatedDoc.stories[PRIMARY_STORY_ID];
    const textRun = updatedStory?.content?.content?.[0]?.content?.[0];
    expect(textRun).toBeDefined();
    if (textRun && textRun.type === 'text') {
      expect(textRun.text).toBe(' کلک کریں');
    }
  });

  it('handles copySelection without throwing error', async () => {
    const result = await copySelection('Urdu copy test');
    expect(typeof result).toBe('boolean');
  });
});
