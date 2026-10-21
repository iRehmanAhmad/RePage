import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { parseDocument } from '../../domain/document/schema';
import type { ImageFrameObject, RePageDocument } from '../../domain/document/types';
import { addImageFrame } from './documentCommands';
import { setImageCropCommand } from './objectCommands';

const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function docWithImage(): { doc: RePageDocument; objectId: string } {
  const doc = createStarterDocument();
  const pageId = doc.pageOrder[0]!;
  const res = addImageFrame(doc, pageId, 'pixel.png', PNG_DATA_URL, 120, 90);
  // addImageFrame leaves sha256 empty (filled in at package-save time); the
  // strict document schema requires a real hash, so patch the fixture asset
  // to a schema-valid value before parseDocument round-trips.
  const frame = res.document.objects[res.objectId] as ImageFrameObject;
  const asset = res.document.assets[frame.assetId!]!;
  const validDoc: RePageDocument = {
    ...res.document,
    assets: {
      ...res.document.assets,
      [asset.id]: { ...asset, sha256: 'a'.repeat(64) },
    },
  };
  return { doc: validDoc, objectId: res.objectId };
}

function imageOf(doc: RePageDocument, objectId: string): ImageFrameObject {
  return doc.objects[objectId] as ImageFrameObject;
}

describe('setImageCropCommand', () => {
  it('stores crop insets on the image frame', () => {
    const { doc, objectId } = docWithImage();
    const next = setImageCropCommand(doc, objectId, {
      left: 0.1,
      top: 0.05,
      right: 0.2,
      bottom: 0,
    });
    expect(imageOf(next, objectId).crop).toEqual({
      left: 0.1,
      top: 0.05,
      right: 0.2,
      bottom: 0,
    });
    // Original document is untouched (immutable command).
    expect(imageOf(doc, objectId).crop).toBeUndefined();
  });

  it('clamps insets to the schema maximum', () => {
    const { doc, objectId } = docWithImage();
    const next = setImageCropCommand(doc, objectId, {
      left: 0.9,
      top: 0,
      right: 0,
      bottom: 0,
    });
    expect(imageOf(next, objectId).crop?.left).toBe(0.45);
  });

  it('removes the crop when cleared or all-zero', () => {
    const { doc, objectId } = docWithImage();
    const cropped = setImageCropCommand(doc, objectId, {
      left: 0.1,
      top: 0,
      right: 0,
      bottom: 0,
    });
    expect(imageOf(cropped, objectId).crop).toBeDefined();

    const cleared = setImageCropCommand(cropped, objectId, null);
    expect(imageOf(cleared, objectId).crop).toBeUndefined();

    const zeroed = setImageCropCommand(cropped, objectId, {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    });
    expect(imageOf(zeroed, objectId).crop).toBeUndefined();
  });

  it('is a no-op for missing and non-image objects', () => {
    const { doc, objectId } = docWithImage();
    expect(setImageCropCommand(doc, 'missing-object', { left: 0.1, top: 0, right: 0, bottom: 0 })).toBe(doc);
    const textId = Object.keys(doc.objects).find((id) => id !== objectId);
    if (textId) {
      expect(
        setImageCropCommand(doc, textId, { left: 0.1, top: 0, right: 0, bottom: 0 }),
      ).toBe(doc);
    }
  });

  it('never alters the stored asset bytes (non-destructive)', () => {
    const { doc, objectId } = docWithImage();
    const assetBefore = doc.assets[imageOf(doc, objectId).assetId!]!;
    const next = setImageCropCommand(doc, objectId, {
      left: 0.25,
      top: 0.25,
      right: 0,
      bottom: 0,
    });
    expect(next.assets[assetBefore.id]).toBe(assetBefore);
    expect(next.assets[assetBefore.id]?.dataUrl).toBe(PNG_DATA_URL);
  });
});

describe('crop in the document schema', () => {
  it('round-trips through parseDocument (save/load safety)', () => {
    const { doc, objectId } = docWithImage();
    const cropped = setImageCropCommand(doc, objectId, {
      left: 0.1,
      top: 0.2,
      right: 0.3,
      bottom: 0.05,
    });
    const parsed = parseDocument(JSON.parse(JSON.stringify(cropped)));
    expect(imageOf(parsed, objectId).crop).toEqual({
      left: 0.1,
      top: 0.2,
      right: 0.3,
      bottom: 0.05,
    });
  });

  it('rejects crop insets outside the 0–0.45 range', () => {
    const { doc, objectId } = docWithImage();
    const invalid = JSON.parse(JSON.stringify(doc)) as RePageDocument;
    (invalid.objects[objectId] as ImageFrameObject).crop = {
      left: 0.46,
      top: 0,
      right: 0,
      bottom: 0,
    };
    expect(() => parseDocument(invalid)).toThrow();
  });
});
