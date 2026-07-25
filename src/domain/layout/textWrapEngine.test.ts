import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import type { RectangleObject } from '../document/types';
import { getPageExclusionZones, intersectsExclusionZone } from './textWrapEngine';

describe('textWrapEngine (Phase UX-4)', () => {
  it('calculates exclusion zones for floating objects with wrap mode square', () => {
    const doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    const page = doc.pages[pageId]!;

    const shape: RectangleObject = {
      id: 'rect_1',
      pageId,
      name: 'Rectangle 1',
      type: 'rectangle',
      frame: { x: 100, y: 100, width: 200, height: 150, rotation: 0 },
      locked: false,
      hidden: false,
      opacity: 1,
      wrapMode: 'square',
      wrapDistance: { top: 10, right: 10, bottom: 10, left: 10 },
      fill: '#38bdf8',
      stroke: '#0284c7',
      strokeWidth: 2,
      cornerRadius: 4,
    };

    const updatedPage = {
      ...page,
      objectOrder: [...page.objectOrder, shape.id],
    };

    const objects = { ...doc.objects, [shape.id]: shape };

    const zones = getPageExclusionZones(updatedPage, objects);
    expect(zones.length).toBe(1);
    expect(zones[0]?.rect.x).toBe(90); // 100 - 10
    expect(zones[0]?.rect.width).toBe(220); // 200 + 20
  });

  it('correctly detects intersection between text line bounds and exclusion zones', () => {
    const zone = {
      objectId: 'obj_1',
      rect: { x: 100, y: 200, width: 200, height: 100, rotation: 0 },
      wrapMode: 'square' as const,
    };

    expect(intersectsExclusionZone(50, 150, zone)).toBe(false);
    expect(intersectsExclusionZone(180, 220, zone)).toBe(true);
    expect(intersectsExclusionZone(350, 400, zone)).toBe(false);
  });
});
