import { describe, expect, it } from 'vitest';
import { addTextFrame } from '../../editor/commands/documentCommands';
import { createStarterDocument } from '../document/createDocument';
import { runPreflightCheck } from './preflightEngine';
import type { ImageFrameObject, TextFrameObject } from '../document/types';

describe('preflightEngine (M3.6)', () => {
  it('passes preflight check for clean starter document', () => {
    const doc = createStarterDocument();
    const result = runPreflightCheck(doc);

    expect(result.passed).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it('detects overset text frame warnings', () => {
    const raw = createStarterDocument();
    const doc = addTextFrame(raw, raw.pageOrder[0]!);
    const firstObjId = Object.keys(doc.objects)[0]!;

    const oversetTextFrame = {
      ...doc.objects[firstObjId],
      overflow: true,
    } as TextFrameObject;

    doc.objects[firstObjId] = oversetTextFrame;

    const result = runPreflightCheck(doc);

    expect(result.warningCount).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.category === 'text-overflow')).toBe(true);
  });

  it('detects missing image asset errors', () => {
    const doc = createStarterDocument();

    const missingImgFrame: ImageFrameObject = {
      id: 'img_missing_1',
      pageId: doc.pageOrder[0]!,
      name: 'Missing Image Frame',
      type: 'image-frame',
      frame: { x: 10, y: 10, width: 100, height: 100, rotation: 0 },
      locked: false,
      hidden: false,
      opacity: 1,
      assetId: 'non_existent_asset_id',
      fit: 'contain',
    };

    doc.objects['img_missing_1'] = missingImgFrame;

    const result = runPreflightCheck(doc);

    expect(result.passed).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.category === 'image')).toBe(true);
  });
});
