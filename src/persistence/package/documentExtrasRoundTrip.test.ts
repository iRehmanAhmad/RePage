import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import type { ImageFrameObject } from '../../domain/document/types';
import { addImageFrame } from '../../editor/commands/documentCommands';
import { setImageCropCommand } from '../../editor/commands/objectCommands';
import { addDocumentIgnoredWordCommand } from '../../editor/commands/languageCommands';
import { createUrdupPackage, readUrdupPackage } from './urdupPackage';

/**
 * Phase 4 batch 8: the two new persisted document extras — image crop
 * insets and the per-document spellcheck ignore list — must survive the
 * .urdup package round-trip exactly.
 */
describe('.urdup package — crop + document ignore list', () => {
  it('round-trips image crop insets and spellcheckIgnoredWords unchanged', async () => {
    const starter = createStarterDocument();
    const pageId = starter.pageOrder[0]!;
    const img = addImageFrame(starter, pageId, 'photo.png', undefined, 200, 150);

    let doc = setImageCropCommand(img.document, img.objectId, {
      left: 0.12,
      top: 0.05,
      right: 0.2,
      bottom: 0.1,
    });
    doc = addDocumentIgnoredWordCommand(doc, 'پکستان');
    doc = addDocumentIgnoredWordCommand(doc, 'recieve');

    const bytes = await createUrdupPackage(doc);
    const reopened = await readUrdupPackage(bytes);

    expect(reopened).toEqual(doc);
    const frame = reopened.objects[img.objectId] as ImageFrameObject;
    expect(frame.crop).toEqual({ left: 0.12, top: 0.05, right: 0.2, bottom: 0.1 });
    expect(reopened.metadata.spellcheckIgnoredWords).toEqual(['پکستان', 'recieve']);
  });
});
