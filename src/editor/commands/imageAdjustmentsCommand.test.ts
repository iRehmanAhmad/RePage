import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { parseDocument } from '../../domain/document/schema';
import type { ImageFrameObject, RePageDocument, TextFrameObject } from '../../domain/document/types';
import { addImageFrame, addTextBox } from './documentCommands';
import { setImageAdjustmentsCommand, setTextOnPathCommand } from './objectCommands';

const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function docWithImage(): { doc: RePageDocument; objectId: string } {
  const doc = createStarterDocument();
  const pageId = doc.pageOrder[0]!;
  const res = addImageFrame(doc, pageId, 'pixel.png', PNG_DATA_URL, 120, 90);
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

describe('setImageAdjustmentsCommand', () => {
  it('stores adjustments on the image frame, immutably', () => {
    const { doc, objectId } = docWithImage();
    const next = setImageAdjustmentsCommand(doc, objectId, {
      brightness: 120,
      contrast: 90,
      flipH: true,
      flipV: false,
    });
    expect((next.objects[objectId] as ImageFrameObject).adjustments).toEqual({
      brightness: 120,
      contrast: 90,
      flipH: true,
      flipV: false,
    });
    expect((doc.objects[objectId] as ImageFrameObject).adjustments).toBeUndefined();
    // The result stays schema-valid.
    expect(() => parseDocument(next)).not.toThrow();
  });

  it('clamps out-of-range percentages', () => {
    const { doc, objectId } = docWithImage();
    const next = setImageAdjustmentsCommand(doc, objectId, {
      brightness: 999,
      contrast: -3,
      flipH: false,
      flipV: true,
    });
    expect((next.objects[objectId] as ImageFrameObject).adjustments).toEqual({
      brightness: 200,
      contrast: 0,
      flipH: false,
      flipV: true,
    });
  });

  it('removes the field for neutral values and for null (reset)', () => {
    const { doc, objectId } = docWithImage();
    const adjusted = setImageAdjustmentsCommand(doc, objectId, {
      brightness: 150,
      contrast: 100,
      flipH: false,
      flipV: false,
    });
    const neutralized = setImageAdjustmentsCommand(adjusted, objectId, {
      brightness: 100,
      contrast: 100,
      flipH: false,
      flipV: false,
    });
    expect((neutralized.objects[objectId] as ImageFrameObject).adjustments).toBeUndefined();
    const cleared = setImageAdjustmentsCommand(adjusted, objectId, null);
    expect((cleared.objects[objectId] as ImageFrameObject).adjustments).toBeUndefined();
  });

  it('is a no-op for non-image objects and unknown ids', () => {
    const { doc } = docWithImage();
    expect(
      setImageAdjustmentsCommand(doc, 'missing', {
        brightness: 150,
        contrast: 100,
        flipH: false,
        flipV: false,
      }),
    ).toBe(doc);
  });
});

describe('setTextOnPathCommand', () => {
  function docWithTextFrame(): { doc: RePageDocument; objectId: string } {
    const doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    const res = addTextBox(doc, pageId);
    return { doc: res.document, objectId: res.objectId };
  }

  it('stores the circle config with a normalized angle, immutably', () => {
    const { doc, objectId } = docWithTextFrame();
    const next = setTextOnPathCommand(doc, objectId, {
      kind: 'circle',
      startAngleDeg: 450,
      flip: true,
    });
    expect((next.objects[objectId] as TextFrameObject).textOnPath).toEqual({
      kind: 'circle',
      startAngleDeg: 90,
      flip: true,
    });
    expect((doc.objects[objectId] as TextFrameObject).textOnPath).toBeUndefined();
    expect(() => parseDocument(next)).not.toThrow();
  });

  it('normalizes negative angles into [0, 360)', () => {
    const { doc, objectId } = docWithTextFrame();
    const next = setTextOnPathCommand(doc, objectId, {
      kind: 'circle',
      startAngleDeg: -90,
      flip: false,
    });
    expect((next.objects[objectId] as TextFrameObject).textOnPath?.startAngleDeg).toBe(270);
  });

  it('clears the config with null and no-ops on identical values', () => {
    const { doc, objectId } = docWithTextFrame();
    const set = setTextOnPathCommand(doc, objectId, {
      kind: 'circle',
      startAngleDeg: 30,
      flip: false,
    });
    const again = setTextOnPathCommand(set, objectId, {
      kind: 'circle',
      startAngleDeg: 30,
      flip: false,
    });
    expect(again).toBe(set);
    const cleared = setTextOnPathCommand(set, objectId, null);
    expect((cleared.objects[objectId] as TextFrameObject).textOnPath).toBeUndefined();
  });

  it('is a no-op for image frames', () => {
    const { doc, objectId } = docWithImage();
    expect(
      setTextOnPathCommand(doc, objectId, { kind: 'circle', startAngleDeg: 0, flip: false }),
    ).toBe(doc);
  });
});
