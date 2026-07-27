import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import { getExportReadinessReport, runPreflightCheck } from './preflightEngine';
import type { ImageFrameObject, TextFrameObject } from '../document/types';
import { createId } from '../document/ids';

describe('Phase 7 Preflight & PDF Export Readiness Engine', () => {
  it('detects text frame overflow errors/warnings', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    const frameId = createId('object');
    const oversetTextFrame: TextFrameObject = {
      id: frameId,
      name: 'Overset Frame',
      pageId: p1,
      type: 'text-frame',
      frame: { x: 50, y: 50, width: 200, height: 100, rotation: 0 },
      storyId: 'story-1',
      columns: 1,
      columnGap: 18,
      overflow: true,
      fontFamily: 'Jameel Noori Nastaliq',
      fontSize: 14,
      color: '#000000',
      lineHeight: 1.8,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      locked: false,
      hidden: false,
      opacity: 1,
    };

    const docWithOverflow = {
      ...doc,
      objects: {
        ...doc.objects,
        [frameId]: oversetTextFrame,
      },
    };

    const result = runPreflightCheck(docWithOverflow, { pressReady: true });
    expect(result.issues.some((i) => i.category === 'text-overflow')).toBe(true);
  });

  it('detects bleed boundary violations', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;
    const page = doc.pages[p1]!;

    // Set bleed insets
    const docWithBleed = {
      ...doc,
      pages: {
        ...doc.pages,
        [p1]: {
          ...page,
          bleed: { top: 9, right: 9, bottom: 9, left: 9 },
        },
      },
    };

    // Add object extending way beyond bleed boundary
    const frameId = createId('object');
    const outOfBoundsObject: TextFrameObject = {
      id: frameId,
      name: 'Bleed Violator',
      pageId: p1,
      type: 'text-frame',
      frame: { x: page.width + 50, y: 50, width: 200, height: 100, rotation: 0 },
      storyId: 'story-1',
      columns: 1,
      columnGap: 18,
      fontFamily: 'Jameel Noori Nastaliq',
      fontSize: 14,
      color: '#000000',
      lineHeight: 1.8,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      locked: false,
      hidden: false,
      opacity: 1,
    };

    const docViolatingBleed = {
      ...docWithBleed,
      objects: {
        ...docWithBleed.objects,
        [frameId]: outOfBoundsObject,
      },
    };

    const result = runPreflightCheck(docViolatingBleed, { pressReady: true });
    expect(result.issues.some((i) => i.category === 'boundary')).toBe(true);
  });

  it('detects low DPI image resolution', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    const assetId = createId('asset');
    const imgId = createId('object');

    const docWithLargeImage = {
      ...doc,
      assets: {
        [assetId]: {
          id: assetId,
          type: 'image' as const,
          originalName: 'test.jpg',
          mediaType: 'image/jpeg',
          packageEntry: 'assets/test.jpg',
          byteSize: 1024,
          sha256: '',
          width: 800,
          height: 600,
        },
      },
      objects: {
        ...doc.objects,
        [imgId]: {
          id: imgId,
          name: 'Large Image',
          pageId: p1,
          type: 'image-frame' as const,
          frame: { x: 50, y: 50, width: 600, height: 400, rotation: 0 }, // 600pt = 8.33 inches -> 800px / 8.33in = 96 DPI (< 300)
          assetId,
          fit: 'contain' as const,
          locked: false,
          hidden: false,
          opacity: 1,
        } as ImageFrameObject,
      },
    };

    const result = runPreflightCheck(docWithLargeImage, { targetDpi: 300, pressReady: true });
    expect(result.issues.some((i) => i.category === 'image')).toBe(true);
  });

  it('generates export readiness report with score and summary', () => {
    const doc = createStarterDocument();
    const report = getExportReadinessReport(doc);

    expect(report.isPdfReady).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.checks.length).toBe(5);
    expect(report.summary).toBeDefined();
  });
});
