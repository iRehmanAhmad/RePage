import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import { addPage, removePage } from '../../editor/commands/documentCommands';
import { insertSectionBreakCommand, setPageBackgroundCommand } from '../../editor/commands/pageLayoutCommands';
import { getSectionForPage, getPagesForSection } from './sectionEngine';

describe('Phase 3 Section Break & Background Engine', () => {
  it('re-anchors sections when their starting page is deleted', () => {
    const doc = createStarterDocument();

    // Add 2 extra pages
    const doc2 = addPage(doc);
    const p2 = doc2.pageOrder[1]!;
    const doc3 = addPage(doc2);

    // Insert section break after p2 (creates a 4th page for section 2)
    const docWithSection = insertSectionBreakCommand(doc3, p2, 'next-page');
    expect(docWithSection.sections?.length).toBe(2);
    expect(docWithSection.pageOrder.length).toBe(4);

    const section2StartPage = docWithSection.sections![1]!.startPageId;

    // Delete section2StartPage (which was startPageId of section 2)
    const docAfterRemoval = removePage(docWithSection, section2StartPage);
    expect(docAfterRemoval.pageOrder.length).toBe(3);
    expect(docAfterRemoval.pageOrder.includes(section2StartPage)).toBe(false);

    // Verify sections were cleaned up and re-anchored validly
    expect(docAfterRemoval.sections).toBeDefined();
    for (const section of docAfterRemoval.sections!) {
      expect(docAfterRemoval.pageOrder.includes(section.startPageId)).toBe(true);
    }
  });

  it('applies custom background color to pages via setPageBackgroundCommand', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    const updatedDoc = setPageBackgroundCommand(doc, { kind: 'current-page', pageId: p1 }, '#f8fafc');
    expect(updatedDoc.pages[p1]!.background).toBe('#f8fafc');
  });

  it('maps section boundaries and page ranges correctly across multiple sections', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const doc2 = addPage(doc);
    const p2 = doc2.pageOrder[1]!;
    const doc3 = insertSectionBreakCommand(doc2, p2, 'next-page');
    const pSection2 = doc3.sections![1]!.startPageId;

    const s1 = getSectionForPage(doc3, p1);
    const s2 = getSectionForPage(doc3, pSection2);

    expect(s1.id).not.toBe(s2.id);
    expect(getPagesForSection(doc3, s1.id)).toEqual([p1, p2]);
    expect(getPagesForSection(doc3, s2.id)).toEqual([pSection2]);
  });
});
