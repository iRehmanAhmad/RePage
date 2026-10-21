import { describe, expect, it } from 'vitest';
import { createStarterDocument, PRIMARY_STORY_ID } from '../domain/document/createDocument';
import type { ParagraphNode } from '../domain/rich-text/types';
import { insertSectionBreakCommand } from '../editor/commands/pageLayoutCommands';
import { PRINT_PAGE_CLASS, renderPrintPages } from './pdfPrintExporter';

describe('pdfPrintExporter — parity blanks and break markers', () => {
  it('prints a genuine blank page for an odd-page break after page 1', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const next = insertSectionBreakCommand(doc, p1, 'odd-page');

    const root = renderPrintPages(next);
    const pages = root.querySelectorAll(`.${PRINT_PAGE_CLASS}`);
    // Page 1, the parity blank, then page 2.
    expect(pages).toHaveLength(3);
    const blank = root.querySelector('[data-repage-parity-blank="true"]');
    expect(blank).not.toBeNull();
    expect(blank!.classList.contains(PRINT_PAGE_CLASS)).toBe(true);
    // The blank carries the physical number it consumes (۲, previous
    // section's numbering) in its footer/header.
    expect(blank!.textContent).toContain('۲');
  });

  it('prints no blank for a next-page break (control)', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const next = insertSectionBreakCommand(doc, p1, 'next-page');

    const root = renderPrintPages(next);
    expect(root.querySelectorAll(`.${PRINT_PAGE_CLASS}`)).toHaveLength(2);
    expect(root.querySelector('[data-repage-parity-blank="true"]')).toBeNull();
  });

  it('prints no blank for an even-page break after page 1 (parity already even)', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const next = insertSectionBreakCommand(doc, p1, 'even-page');

    const root = renderPrintPages(next);
    expect(root.querySelectorAll(`.${PRINT_PAGE_CLASS}`)).toHaveLength(2);
    expect(root.querySelector('[data-repage-parity-blank="true"]')).toBeNull();
  });

  it('the editor break marker never appears in the print DOM', () => {
    const doc = createStarterDocument();
    const story = doc.stories[PRIMARY_STORY_ID]!;
    const paragraphs: ParagraphNode[] = [
      {
        type: 'paragraph',
        direction: 'rtl',
        content: [
          { type: 'text', text: 'آغاز ' },
          { type: 'break', breakType: 'page' },
          { type: 'text', text: 'اختتام' },
        ],
      },
    ];
    const withBreak = {
      ...doc,
      stories: {
        ...doc.stories,
        [PRIMARY_STORY_ID]: { ...story, content: { type: 'doc' as const, content: paragraphs } },
      },
    };

    const root = renderPrintPages(withBreak);
    expect(root.textContent).not.toContain('Page Break');
    expect(root.textContent).not.toContain('صفحہ بریک');
    expect(root.querySelector('[data-repage-break]')).toBeNull();
  });
});
