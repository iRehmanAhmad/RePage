import type { Page, PageObject, Rect, TextWrapMode } from '../document/types';

export interface ExclusionZone {
  objectId: string;
  rect: Rect;
  wrapMode: TextWrapMode;
}

/**
 * Calculates exclusion zones for floating objects on a page that wrap text (Square, Tight, Top-Bottom).
 */
export function getPageExclusionZones(page: Page, objects: Record<string, PageObject>): ExclusionZone[] {
  const zones: ExclusionZone[] = [];

  for (const objectId of page.objectOrder) {
    const obj = objects[objectId];
    if (!obj || obj.hidden || !obj.wrapMode || obj.wrapMode === 'inline' || obj.wrapMode === 'behind' || obj.wrapMode === 'in-front') {
      continue;
    }

    const wrapDist = obj.wrapDistance || { top: 6, right: 6, bottom: 6, left: 6 };
    const paddedRect: Rect = {
      x: obj.frame.x - wrapDist.left,
      y: obj.frame.y - wrapDist.top,
      width: obj.frame.width + wrapDist.left + wrapDist.right,
      height: obj.frame.height + wrapDist.top + wrapDist.bottom,
      rotation: obj.frame.rotation || 0,
    };

    zones.push({
      objectId: obj.id,
      rect: paddedRect,
      wrapMode: obj.wrapMode,
    });
  }

  return zones;
}

/**
 * Checks if a given text line or paragraph vertical space intersects with an exclusion zone.
 */
export function intersectsExclusionZone(topY: number, bottomY: number, zone: ExclusionZone): boolean {
  const zoneTop = zone.rect.y;
  const zoneBottom = zone.rect.y + zone.rect.height;

  return !(bottomY <= zoneTop || topY >= zoneBottom);
}
