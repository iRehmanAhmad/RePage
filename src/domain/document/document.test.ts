import { describe, expect, it } from 'vitest';
import { addPage, addRectangle, deleteObject, removePage, updateObjectGeometry } from '../../editor/commands/documentCommands';
import { createDocument, createStarterDocument } from './createDocument';
import { parseDocument } from './schema';

import { extractPlainText } from '../rich-text/types';

describe('canonical document', () => {
  it('creates a valid UTF-8 starter document', () => {
    const document = createStarterDocument();
    const parsed = parseDocument(document);
    const story = Object.values(parsed.stories)[0];

    expect(story ? extractPlainText(story.content) : '').toContain('اردو');
  });

  it('adds pages and objects through commands', () => {
    const initial = createDocument();
    const withPage = addPage(initial, initial.pageOrder[0]);
    const activePageId = withPage.pageOrder[1]!;
    const withRectangle = addRectangle(withPage, activePageId);

    expect(withRectangle.pageOrder).toHaveLength(2);
    expect(withRectangle.pages[activePageId]?.objectOrder).toHaveLength(1);
    expect(() => parseDocument(withRectangle)).not.toThrow();
  });

  it('never removes the last page', () => {
    const document = createDocument();
    expect(() => removePage(document, document.pageOrder[0]!)).toThrow(
      'A document must contain at least one page.',
    );
  });

  it('updates object geometry and validates frame values', () => {
    const starter = createStarterDocument();
    const objectId = Object.keys(starter.objects)[0]!;

    const updated = updateObjectGeometry(starter, objectId, { x: 120, y: 150, width: 250, height: 180, rotation: 15 });
    expect(updated.objects[objectId]!.frame).toEqual({ x: 120, y: 150, width: 250, height: 180, rotation: 15 });
    expect(() => parseDocument(updated)).not.toThrow();
  });

  it('deletes an object from page and document object map', () => {
    const starter = createStarterDocument();
    const objectId = Object.keys(starter.objects)[0]!;
    const pageId = starter.pageOrder[0]!;

    const deleted = deleteObject(starter, objectId);
    expect(deleted.objects[objectId]).toBeUndefined();
    expect(deleted.pages[pageId]!.objectOrder).not.toContain(objectId);
    expect(() => parseDocument(deleted)).not.toThrow();
  });
});
