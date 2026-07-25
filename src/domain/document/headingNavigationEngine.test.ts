import { describe, expect, it } from 'vitest';
import { createStarterDocument, PRIMARY_STORY_ID } from './createDocument';
import { extractHeadingTree, reorderHeadingSection } from './headingNavigationEngine';

describe('headingNavigationEngine (Phase UX-5)', () => {
  it('extracts heading tree from document story', () => {
    let doc = createStarterDocument();

    const story = doc.stories[PRIMARY_STORY_ID];
    if (story) {
      story.content.content = [
        {
          type: 'paragraph',
          alignment: 'start',
          direction: 'rtl',
          content: [
            {
              type: 'text',
              text: 'باب اول: تعارف',
              marks: [{ type: 'bold' }, { type: 'fontSize', size: 22 }],
            },
          ],
        },
        {
          type: 'paragraph',
          alignment: 'start',
          direction: 'rtl',
          content: [{ type: 'text', text: 'یہ پہلا پیراگراف ہے جو تفصیل بیان کرتا ہے۔' }],
        },
        {
          type: 'paragraph',
          alignment: 'start',
          direction: 'rtl',
          content: [
            {
              type: 'text',
              text: 'ذیلی عنوان ۱',
              marks: [{ type: 'bold' }, { type: 'fontSize', size: 16 }],
            },
          ],
        },
      ];
    }

    const tree = extractHeadingTree(doc);
    expect(tree.length).toBeGreaterThan(0);
    expect(tree[0]?.text).toContain('باب اول');
  });

  it('reorders heading sections up and down in document story', () => {
    let doc = createStarterDocument();
    const story = doc.stories[PRIMARY_STORY_ID];
    if (story) {
      story.content.content = [
        {
          type: 'paragraph',
          alignment: 'start',
          direction: 'rtl',
          content: [{ type: 'text', text: 'باب اول', marks: [{ type: 'bold' }, { type: 'fontSize', size: 22 }] }],
        },
        {
          type: 'paragraph',
          alignment: 'start',
          direction: 'rtl',
          content: [{ type: 'text', text: 'پیراگراف ۱' }],
        },
        {
          type: 'paragraph',
          alignment: 'start',
          direction: 'rtl',
          content: [{ type: 'text', text: 'باب دوم', marks: [{ type: 'bold' }, { type: 'fontSize', size: 22 }] }],
        },
        {
          type: 'paragraph',
          alignment: 'start',
          direction: 'rtl',
          content: [{ type: 'text', text: 'پیراگراف ۲' }],
        },
      ];
    }

    // Reorder Section 2 down or Section 1 down
    const movedDoc = reorderHeadingSection(doc, 0, 'down');
    const newStory = movedDoc.stories[PRIMARY_STORY_ID];
    const firstText = newStory?.content.content[0]?.content[0]?.type === 'text' ? newStory.content.content[0].content[0].text : '';
    expect(firstText).toBe('باب دوم');
  });
});
