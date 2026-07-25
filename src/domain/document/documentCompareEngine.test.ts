import { describe, expect, it } from 'vitest';
import { createStarterDocument } from './createDocument';
import { compareDocuments } from './documentCompareEngine';
import { PRIMARY_STORY_ID } from './createDocument';

describe('documentCompareEngine (Phase UX-7)', () => {
  it('compares two document versions and generates tracked revisions', () => {
    const docA = createStarterDocument();

    const docB = createStarterDocument();
    const storyB = docB.stories[PRIMARY_STORY_ID]!;
    docB.stories[PRIMARY_STORY_ID] = {
      ...storyB,
      content: {
        ...storyB.content,
        content: [
          ...storyB.content.content,
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'اضافی جدید پیراگراف' }],
          },
        ],
      },
    };

    const diffDoc = compareDocuments(docA, docB);

    expect(diffDoc.revisions).toBeDefined();
    expect(diffDoc.revisions?.length).toBeGreaterThan(0);
    expect(diffDoc.revisions?.[0]?.text).toContain('اضافی جدید پیراگراف');
  });
});
