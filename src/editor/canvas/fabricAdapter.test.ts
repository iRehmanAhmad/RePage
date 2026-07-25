import * as fabric from 'fabric';
import { describe, expect, it } from 'vitest';
import type { RectangleObject } from '../../domain/document/types';
import { fabricToObjectGeometry } from './fabricAdapter';

describe('Fabric Adapter Geometry Conversion', () => {
  it('converts unscaled Fabric object properties to canonical geometry', () => {
    const rect = new fabric.Rect({
      left: 100,
      top: 150,
      width: 200,
      height: 120,
      angle: 45,
    });

    const geom = fabricToObjectGeometry(rect);

    expect(geom.x).toBe(100);
    expect(geom.y).toBe(150);
    expect(geom.width).toBe(200);
    expect(geom.height).toBe(120);
    expect(geom.rotation).toBe(45);
  });

  it('correctly calculates width and height when Fabric object is scaled via drag handles', () => {
    const rect = new fabric.Rect({
      left: 50,
      top: 50,
      width: 100,
      height: 100,
      scaleX: 1.5,
      scaleY: 2.0,
      angle: 0,
    });

    const geom = fabricToObjectGeometry(rect);

    expect(geom.x).toBe(50);
    expect(geom.y).toBe(50);
    expect(geom.width).toBe(150);
    expect(geom.height).toBe(200);
  });

  it('guarantees minimum positive dimensions', () => {
    const canonicalRect: RectangleObject = {
      id: 'obj-1',
      pageId: 'page-1',
      type: 'rectangle',
      name: 'Test',
      frame: { x: 10, y: 10, width: 0, height: -5, rotation: 0 },
      locked: false,
      hidden: false,
      opacity: 1,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      cornerRadius: 0,
    };

    const rect = new fabric.Rect({
      left: canonicalRect.frame.x,
      top: canonicalRect.frame.y,
      width: canonicalRect.frame.width,
      height: canonicalRect.frame.height,
    });

    const geom = fabricToObjectGeometry(rect);

    expect(geom.width).toBeGreaterThan(0);
    expect(geom.height).toBeGreaterThan(0);
  });
});
