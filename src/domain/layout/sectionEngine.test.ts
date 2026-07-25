import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import { applyPageSetup, insertSectionBreak } from './sectionEngine';

describe('sectionEngine (Phase UX-3)', () => {
  it('inserts a Next Page section break and creates a new page', () => {
    const doc = createStarterDocument();
    const initialPages = doc.pageOrder.length;

    const updatedDoc = insertSectionBreak(doc, 'next-page');
    expect(updatedDoc.pageOrder.length).toBe(initialPages + 1);
    expect(updatedDoc.sections?.length).toBe(1);
  });

  it('applies page orientation and dimension changes to page', () => {
    const doc = createStarterDocument();
    const firstPageId = doc.pageOrder[0]!;

    const updatedDoc = applyPageSetup(doc, firstPageId, { orientation: 'landscape' });
    const page = updatedDoc.pages[firstPageId]!;

    expect(page.width).toBeGreaterThan(page.height);
  });
});
