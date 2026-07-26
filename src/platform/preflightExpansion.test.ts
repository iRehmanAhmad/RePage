import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import type { RePageDocument, ImageFrameObject, TextFrameObject } from '../domain/document/types';
import { runPreflightCheck } from '../domain/diagnostics/preflightEngine';

describe('Milestone M8 Phase 0 — Preflight Expansion & Print Production Diagnostics', () => {
  it('1. Detects low DPI raster images for press print target', () => {
    const doc = createStarterDocument();
    const activePageId = Object.keys(doc.pages)[0]!;

    const lowDpiImage: ImageFrameObject = {
      id: 'img-1',
      type: 'image-frame',
      pageId: activePageId,
      name: 'Hero Image',
      frame: { x: 50, y: 50, width: 500, height: 300, rotation: 0 }, // 500pt width (~6.9 inches)
      locked: false,
      hidden: false,
      opacity: 1,
      assetId: 'asset-hero-1',
      fit: 'contain',
    };

    const docWithImage: RePageDocument = {
      ...doc,
      objects: {
        ...doc.objects,
        [lowDpiImage.id]: lowDpiImage,
      },
      assets: {
        ...doc.assets,
        'asset-hero-1': {
          id: 'asset-hero-1',
          sha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          mediaType: 'image/png',
          byteSize: 10240,
          originalName: 'hero.png',
          packageEntry: 'assets/hero.png',
        },
      },
    };

    const res = runPreflightCheck(docWithImage, { targetDpi: 300 });
    const imgIssue = res.issues.find((i) => i.category === 'image' && i.targetId === 'img-1');

    expect(imgIssue).toBeDefined();
    expect(imgIssue?.message).toContain('DPI');
  });

  it('2. Detects objects extending beyond page boundary', () => {
    const doc = createStarterDocument();
    const activePageId = Object.keys(doc.pages)[0]!;
    const activePage = doc.pages[activePageId]!;

    const overflowObj: TextFrameObject = {
      id: 'tf-out',
      type: 'text-frame',
      pageId: activePageId,
      name: 'Overflow Frame',
      frame: { x: activePage.width - 20, y: 50, width: 100, height: 50, rotation: 0 }, // extends 80pt past page right boundary
      locked: false,
      hidden: false,
      opacity: 1,
      storyId: 'primary-body-story',
      fontFamily: 'Noto Nastaliq Urdu',
      fontSize: 16,
      color: '#000000',
      lineHeight: 1.2,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      overflow: false,
    };

    const docWithOverflow: RePageDocument = {
      ...doc,
      objects: {
        ...doc.objects,
        [overflowObj.id]: overflowObj,
      },
    };

    const res = runPreflightCheck(docWithOverflow, { pressReady: true });
    const boundaryIssue = res.issues.find((i) => i.category === 'boundary');

    expect(boundaryIssue).toBeDefined();
    expect(boundaryIssue?.severity).toBe('error');
  });

  it('3. Press-ready preflight enforces strict failure on errors', () => {
    const doc = createStarterDocument();
    const activePageId = Object.keys(doc.pages)[0]!;

    const oversetText: TextFrameObject = {
      id: 'tf-overset',
      type: 'text-frame',
      pageId: activePageId,
      name: 'Overset Frame',
      frame: { x: 10, y: 10, width: 100, height: 50, rotation: 0 },
      locked: false,
      hidden: false,
      opacity: 1,
      storyId: 'primary-body-story',
      fontFamily: 'Noto Nastaliq Urdu',
      fontSize: 16,
      color: '#000000',
      lineHeight: 1.2,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      overflow: true,
    };

    const testDoc: RePageDocument = {
      ...doc,
      objects: {
        ...doc.objects,
        [oversetText.id]: oversetText,
      },
    };

    const res = runPreflightCheck(testDoc, { pressReady: true });
    expect(res.passed).toBe(false);
    expect(res.errorCount).toBeGreaterThan(0);
  });
});
