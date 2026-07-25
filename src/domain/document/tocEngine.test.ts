import { describe, expect, it } from 'vitest';
import { addTextFrame } from '../../editor/commands/documentCommands';
import { createStarterDocument } from './createDocument';
import {
  buildTocRichTextDocument,
  generateRunningHeaderForPage,
  generateTableOfContents,
} from './tocEngine';

import { paragraph } from '../rich-text/types';

describe('tocEngine (M3.8)', () => {
  it('generates Table of Contents entries from document pages', () => {
    const raw = createStarterDocument();
    const doc = addTextFrame(raw, raw.pageOrder[0]!);
    const objectId = Object.keys(doc.objects)[0]!;
    const textFrame = doc.objects[objectId] as any;
    doc.stories[textFrame.storyId] = {
      id: textFrame.storyId,
      name: 'Heading Story',
      content: { type: 'doc', content: [paragraph('پہلا باب: تعارف', 'rtl')] },
    };

    const entries = generateTableOfContents(doc, { targetParagraphStyles: ['Noto Nastaliq Urdu'] });

    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]?.formattedPageNumber).toContain('صفحہ');
    expect(entries[0]?.title).toBeDefined();
  });

  it('resolves running header text for target document page', () => {
    const raw = createStarterDocument();
    const doc = addTextFrame(raw, raw.pageOrder[0]!);
    const firstPageId = doc.pageOrder[0]!;

    const header = generateRunningHeaderForPage(doc, firstPageId);

    expect(header).toBeDefined();
    expect(typeof header).toBe('string');
  });

  it('constructs TOC RichTextDocument with title and leader dots', () => {
    const raw = createStarterDocument();
    const doc = addTextFrame(raw, raw.pageOrder[0]!);
    const objectId = Object.keys(doc.objects)[0]!;
    const textFrame = doc.objects[objectId] as any;
    doc.stories[textFrame.storyId] = {
      id: textFrame.storyId,
      name: 'Heading Story',
      content: { type: 'doc', content: [paragraph('پہلا باب: تعارف', 'rtl')] },
    };

    const entries = generateTableOfContents(doc, { targetParagraphStyles: ['Noto Nastaliq Urdu'] });
    const tocDoc = buildTocRichTextDocument(entries);

    expect(tocDoc.type).toBe('doc');
    expect(tocDoc.content.length).toBeGreaterThan(1);
    const firstRun = tocDoc.content[0]?.content[0];
    expect(firstRun?.type).toBe('text');
    if (firstRun?.type === 'text') {
      expect(firstRun.text).toContain('فہرست مضامین');
    }
  });
});
