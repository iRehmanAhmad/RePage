import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import {
  applyPageSetup,
  cleanupDanglingSections,
  createDefaultSection,
  getPagesForSection,
  getSectionForPage,
  insertSectionBreak,
} from './sectionEngine';
import { parseDocument, validateDocumentReferences } from '../document/schema';
import { createUrdupPackage, readUrdupPackage } from '../../persistence/package/urdupPackage';

describe('sectionEngine (Phase 0 Section Model Foundation)', () => {
  it('creates starter document with a default section anchored at initial page', () => {
    const doc = createStarterDocument();
    expect(doc.sections).toBeDefined();
    expect(doc.sections?.length).toBeGreaterThanOrEqual(1);
    expect(doc.sections?.[0]?.startPageId).toBe(doc.pageOrder[0]);
  });

  it('inserts a Next Page section break, creating a new page and a new DocumentSection', () => {
    const doc = createStarterDocument();
    const initialPages = doc.pageOrder.length;
    const firstPageId = doc.pageOrder[0]!;

    const updatedDoc = insertSectionBreak(doc, 'next-page', firstPageId);
    expect(updatedDoc.pageOrder.length).toBe(initialPages + 1);
    expect(updatedDoc.sections?.length).toBe(2);

    const secondPageId = updatedDoc.pageOrder[1]!;
    expect(updatedDoc.sections?.[1]?.startPageId).toBe(secondPageId);
  });

  it('resolves correct section for pages in a multi-section document', () => {
    let doc = createStarterDocument();
    const page1 = doc.pageOrder[0]!;

    doc = insertSectionBreak(doc, 'next-page', page1);
    const page2 = doc.pageOrder[1]!;

    doc = insertSectionBreak(doc, 'next-page', page2);
    const page3 = doc.pageOrder[2]!;

    expect(getSectionForPage(doc, page1).startPageId).toBe(page1);
    expect(getSectionForPage(doc, page2).startPageId).toBe(page2);
    expect(getSectionForPage(doc, page3).startPageId).toBe(page3);

    const sec1 = doc.sections![0]!.id;
    const sec2 = doc.sections![1]!.id;
    const sec3 = doc.sections![2]!.id;

    expect(getPagesForSection(doc, sec1)).toEqual([page1]);
    expect(getPagesForSection(doc, sec2)).toEqual([page2]);
    expect(getPagesForSection(doc, sec3)).toEqual([page3]);
  });

  it('cleans up dangling sections when a section start page is deleted', () => {
    let doc = createStarterDocument();
    const page1 = doc.pageOrder[0]!;

    doc = insertSectionBreak(doc, 'next-page', page1);
    const page2 = doc.pageOrder[1]!;

    // Delete page2 manually
    const pages = { ...doc.pages };
    delete pages[page2];
    const pageOrder = doc.pageOrder.filter((id) => id !== page2);

    const docWithDeletedPage = {
      ...doc,
      pages,
      pageOrder,
    };

    const cleanedDoc = cleanupDanglingSections(docWithDeletedPage);
    expect(cleanedDoc.sections?.length).toBe(1);
    expect(cleanedDoc.sections?.[0]?.startPageId).toBe(page1);
  });

  it('validates section schema references and detects invalid or duplicate start pages', () => {
    const doc = createStarterDocument();
    const page1 = doc.pageOrder[0]!;

    // Create duplicate start page section
    const invalidDoc = {
      ...doc,
      sections: [
        createDefaultSection(page1),
        createDefaultSection(page1),
      ],
    };

    const errors = validateDocumentReferences(invalidDoc as any);
    expect(errors.some((e) => e.includes('Duplicate section start page'))).toBe(true);
  });

  it('preserves sections without data loss through parseDocument and .urdup package roundtrip', async () => {
    let doc = createStarterDocument();
    const page1 = doc.pageOrder[0]!;
    doc = insertSectionBreak(doc, 'next-page', page1);

    // 1. Zod parse validation
    const parsed = parseDocument(doc);
    expect(parsed.sections).toBeDefined();
    expect(parsed.sections?.length).toBe(2);

    // 2. Package roundtrip validation
    const pkg = await createUrdupPackage(doc);
    const reloadedDoc = await readUrdupPackage(new Uint8Array(pkg.buffer));

    expect(reloadedDoc.sections).toBeDefined();
    expect(reloadedDoc.sections?.length).toBe(2);
    expect(reloadedDoc.sections?.[0]?.startPageId).toBe(doc.pageOrder[0]);
    expect(reloadedDoc.sections?.[1]?.startPageId).toBe(doc.pageOrder[1]);
  });

  it('applies page orientation and dimension changes to page', () => {
    const doc = createStarterDocument();
    const firstPageId = doc.pageOrder[0]!;

    const updatedDoc = applyPageSetup(doc, firstPageId, { orientation: 'landscape' });
    const page = updatedDoc.pages[firstPageId]!;

    expect(page.width).toBeGreaterThan(page.height);
  });
});

