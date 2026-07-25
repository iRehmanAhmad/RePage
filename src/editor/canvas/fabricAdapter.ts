import * as fabric from 'fabric';
import type { PageObject, Rect } from '../../domain/document/types';
import { getFontDefinition } from '../../domain/unicode/fontRegistry';

export interface AdapterCallbacks {
  onObjectModified?: (objectId: string, frame: Partial<Rect>) => void;
  onSelectionChanged?: (selectedObjectId: string | null) => void;
}

/**
 * Extracts canonical PDF-point geometry (x, y, width, height, rotation)
 * from an interacted Fabric canvas object.
 */
export function fabricToObjectGeometry(fabricObj: fabric.FabricObject): Rect {
  const scaleX = fabricObj.scaleX ?? 1;
  const scaleY = fabricObj.scaleY ?? 1;
  const rawWidth = fabricObj.width ?? 0;
  const rawHeight = fabricObj.height ?? 0;

  return {
    x: fabricObj.left ?? 0,
    y: fabricObj.top ?? 0,
    width: Math.max(1, rawWidth * scaleX),
    height: Math.max(1, rawHeight * scaleY),
    rotation: fabricObj.angle ?? 0,
  };
}

/**
 * FabricCanvasAdapter manages the lifecycle of an interactive Fabric canvas,
 * synchronizing canonical domain page objects without mutating canonical state directly.
 */
export class FabricCanvasAdapter {
  private canvas: fabric.Canvas | null = null;
  private objectMap = new Map<string, fabric.FabricObject>();
  private callbacks: AdapterCallbacks = {};

  public attach(canvasElement: HTMLCanvasElement, width: number, height: number, callbacks?: AdapterCallbacks): void {
    this.destroy();
    this.callbacks = callbacks ?? {};

    this.canvas = new fabric.Canvas(canvasElement, {
      width,
      height,
      selection: true,
      preserveObjectStacking: true,
    });

    this.canvas.on('object:modified', (e) => {
      const target = e.target;
      if (!target) return;

      const objectId = (target as unknown as { canonicalId?: string }).canonicalId;
      if (objectId && this.callbacks.onObjectModified) {
        const frame = fabricToObjectGeometry(target);
        this.callbacks.onObjectModified(objectId, frame);
      }
    });

    this.canvas.on('selection:created', (e) => this.handleSelection(e.selected));
    this.canvas.on('selection:updated', (e) => this.handleSelection(e.selected));
    this.canvas.on('selection:cleared', () => this.handleSelection([]));
  }

  private handleSelection(selected?: fabric.FabricObject[]): void {
    if (!this.callbacks.onSelectionChanged) return;
    const first = selected?.[0];
    const objectId = first ? (first as unknown as { canonicalId?: string }).canonicalId ?? null : null;
    this.callbacks.onSelectionChanged(objectId);
  }

  public syncObjects(objects: PageObject[]): void {
    if (!this.canvas) return;

    // Clear existing objects
    this.canvas.clear();
    this.objectMap.clear();

    for (const obj of objects) {
      if (obj.hidden) continue;

      let fabricObj: fabric.FabricObject | null = null;

      if (obj.type === 'rectangle') {
        fabricObj = new fabric.Rect({
          left: obj.frame.x,
          top: obj.frame.y,
          width: obj.frame.width,
          height: obj.frame.height,
          angle: obj.frame.rotation,
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          rx: obj.cornerRadius,
          ry: obj.cornerRadius,
          opacity: obj.opacity,
          selectable: !obj.locked,
        });
      } else if (obj.type === 'text-frame') {
        const fontDef = getFontDefinition(obj.fontFamily);
        const overflowText = obj.overflow ? ' [+] ⚠️' : '';
        const seqBadge = obj.sequenceIndex !== undefined ? ` [#${obj.sequenceIndex + 1}]` : '';
        fabricObj = new fabric.Textbox(`اردو پیج میں خوش آمدید${seqBadge}${overflowText}`, {
          left: obj.frame.x,
          top: obj.frame.y,
          width: obj.frame.width,
          height: obj.frame.height,
          angle: obj.frame.rotation,
          fill: obj.overflow ? '#dc2626' : obj.color,
          fontSize: obj.fontSize,
          fontFamily: fontDef.family,
          opacity: obj.opacity,
          selectable: !obj.locked,
          editable: false, // Rich text DOM overlay handles editing
        });
      } else if (obj.type === 'image-frame') {
        fabricObj = new fabric.Rect({
          left: obj.frame.x,
          top: obj.frame.y,
          width: obj.frame.width,
          height: obj.frame.height,
          angle: obj.frame.rotation,
          fill: '#e2e8f0',
          stroke: '#94a3b8',
          strokeWidth: 1,
          strokeDashArray: [4, 4],
          opacity: obj.opacity,
          selectable: !obj.locked,
        });
      }

      if (fabricObj) {
        (fabricObj as unknown as { canonicalId: string }).canonicalId = obj.id;
        this.objectMap.set(obj.id, fabricObj);
        this.canvas.add(fabricObj);
      }
    }

    this.canvas.renderAll();
  }

  public resizeCanvas(width: number, height: number): void {
    if (!this.canvas) return;
    this.canvas.setDimensions({ width, height });
    this.canvas.renderAll();
  }

  public destroy(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
    this.objectMap.clear();
  }
}
