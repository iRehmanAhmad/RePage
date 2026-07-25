import * as fabric from 'fabric';
import type { PageObject, Rect } from '../../domain/document/types';
import { getFontDefinition } from '../../domain/unicode/fontRegistry';

export interface AdapterCallbacks {
  onObjectModified?: (objectId: string, frame: Partial<Rect>) => void;
  onSelectionChanged?: (selectedObjectId: string | null) => void;
  onObjectDoubleClicked?: (selectedObjectId: string) => void;
  /**
   * Fabric owns the full page-sized canvas. Forward clicks on empty canvas
   * space so the primary document editor can regain keyboard focus.
   */
  onBlankCanvasClick?: () => void;
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

    // Configure modern MS Word 365 style handles (solid white circular handles with blue border)
    fabric.InteractiveFabricObject.ownDefaults = {
      ...fabric.InteractiveFabricObject.ownDefaults,
      cornerStyle: 'circle',
      cornerColor: '#ffffff',
      cornerStrokeColor: '#0284c7',
      cornerSize: 8,
      transparentCorners: false,
      borderColor: '#0284c7',
      borderDashArray: [4, 4],
      padding: 2,
    };

    this.canvas.on('object:modified', (e) => {
      const target = e.target;
      if (!target) return;

      const objectId = (target as unknown as { canonicalId?: string }).canonicalId;
      if (objectId && this.callbacks.onObjectModified) {
        const frame = fabricToObjectGeometry(target);
        this.callbacks.onObjectModified(objectId, frame);
      }
    });

    this.canvas.on('mouse:dblclick', (e) => {
      const target = e.target;
      if (!target) return;

      const objectId = (target as unknown as { canonicalId?: string }).canonicalId;
      if (objectId && this.callbacks.onObjectDoubleClicked) {
        this.callbacks.onObjectDoubleClicked(objectId);
      }
    });

    this.canvas.on('mouse:down', (e) => {
      if (!e.target) {
        this.callbacks.onBlankCanvasClick?.();
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

  public syncObjects(
    objects: PageObject[],
    stories?: Record<string, import('../../domain/document/types').TextStory>,
    selectedObjectId?: string | null,
  ): void {
    if (!this.canvas) return;

    // Clear existing objects
    this.canvas.clear();
    this.objectMap.clear();

    let activeFabricObj: fabric.FabricObject | null = null;

    for (const obj of objects) {
      if (obj.hidden) continue;

      let fabricObj: fabric.FabricObject | null = null;

      if (obj.type === 'rectangle') {
        const w = obj.frame.width;
        const h = obj.frame.height;
        const kind = obj.shapeKind || 'rectangle';
        let shapeVector: fabric.FabricObject;

        const baseOpts = {
          left: 0,
          top: 0,
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          originX: 'left' as const,
          originY: 'top' as const,
        };

        if (kind === 'ellipse' || kind === 'circle') {
          shapeVector = new fabric.Ellipse({
            ...baseOpts,
            rx: w / 2,
            ry: h / 2,
          });
        } else if (kind === 'triangle') {
          shapeVector = new fabric.Triangle({
            ...baseOpts,
            width: w,
            height: h,
          });
        } else if (kind === 'diamond') {
          shapeVector = new fabric.Polygon(
            [
              { x: w / 2, y: 0 },
              { x: w, y: h / 2 },
              { x: w / 2, y: h },
              { x: 0, y: h / 2 },
            ],
            baseOpts,
          );
        } else if (kind === 'star') {
          // 5-point star
          const pts: { x: number; y: number }[] = [];
          const cx = w / 2;
          const cy = h / 2;
          const outerR = Math.min(w, h) / 2;
          const innerR = outerR * 0.4;
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
          }
          shapeVector = new fabric.Polygon(pts, baseOpts);
        } else if (kind === 'arrow-right') {
          shapeVector = new fabric.Polygon(
            [
              { x: 0, y: h * 0.25 },
              { x: w * 0.6, y: h * 0.25 },
              { x: w * 0.6, y: 0 },
              { x: w, y: h * 0.5 },
              { x: w * 0.6, y: h },
              { x: w * 0.6, y: h * 0.75 },
              { x: 0, y: h * 0.75 },
            ],
            baseOpts,
          );
        } else if (kind === 'arrow-left') {
          shapeVector = new fabric.Polygon(
            [
              { x: w * 0.4, y: 0 },
              { x: w * 0.4, y: h * 0.25 },
              { x: w, y: h * 0.25 },
              { x: w, y: h * 0.75 },
              { x: w * 0.4, y: h * 0.75 },
              { x: w * 0.4, y: h },
              { x: 0, y: h * 0.5 },
            ],
            baseOpts,
          );
        } else if (kind === 'arrow-up') {
          shapeVector = new fabric.Polygon(
            [
              { x: w * 0.5, y: 0 },
              { x: w, y: h * 0.4 },
              { x: w * 0.75, y: h * 0.4 },
              { x: w * 0.75, y: h },
              { x: w * 0.25, y: h },
              { x: w * 0.25, y: h * 0.4 },
              { x: 0, y: h * 0.4 },
            ],
            baseOpts,
          );
        } else if (kind === 'arrow-down') {
          shapeVector = new fabric.Polygon(
            [
              { x: w * 0.25, y: 0 },
              { x: w * 0.75, y: 0 },
              { x: w * 0.75, y: h * 0.6 },
              { x: w, y: h * 0.6 },
              { x: w * 0.5, y: h },
              { x: 0, y: h * 0.6 },
              { x: w * 0.25, y: h * 0.6 },
            ],
            baseOpts,
          );
        } else if (kind === 'hexagon') {
          shapeVector = new fabric.Polygon(
            [
              { x: w * 0.25, y: 0 },
              { x: w * 0.75, y: 0 },
              { x: w, y: h * 0.5 },
              { x: w * 0.75, y: h },
              { x: w * 0.25, y: h },
              { x: 0, y: h * 0.5 },
            ],
            baseOpts,
          );
        } else if (kind === 'callout') {
          shapeVector = new fabric.Polygon(
            [
              { x: 0, y: 0 },
              { x: w, y: 0 },
              { x: w, y: h * 0.75 },
              { x: w * 0.4, y: h * 0.75 },
              { x: w * 0.2, y: h },
              { x: w * 0.25, y: h * 0.75 },
              { x: 0, y: h * 0.75 },
            ],
            baseOpts,
          );
        } else if (kind === 'line') {
          shapeVector = new fabric.Line([0, 0, w, 0], {
            ...baseOpts,
            stroke: obj.fill || obj.stroke,
            strokeWidth: Math.max(2, obj.strokeWidth),
          });
        } else {
          // Default rectangle & rounded-rectangle
          shapeVector = new fabric.Rect({
            ...baseOpts,
            width: w,
            height: h,
            rx: kind === 'rounded-rectangle' ? Math.max(16, obj.cornerRadius) : obj.cornerRadius,
            ry: kind === 'rounded-rectangle' ? Math.max(16, obj.cornerRadius) : obj.cornerRadius,
          });
        }

        let shapeTextContent = '';
        if (obj.storyId && stories && stories[obj.storyId]?.content?.content) {
          shapeTextContent = stories[obj.storyId]!.content.content
            .map((p) => p.content.map((run) => (run.type === 'text' ? run.text : '')).join(''))
            .join('\n');
        }

        if (shapeTextContent.trim()) {
          const fontDef = getFontDefinition('Noto Nastaliq Urdu');
          const textObj = new fabric.Textbox(shapeTextContent, {
            left: 8,
            top: 8,
            width: Math.max(10, obj.frame.width - 16),
            fontSize: 20,
            fontFamily: fontDef.family,
            fill: '#1e293b',
            textAlign: 'center',
            originX: 'left',
            originY: 'top',
            editable: false,
          });

          fabricObj = new fabric.Group([shapeVector, textObj], {
            left: obj.frame.x,
            top: obj.frame.y,
            width: obj.frame.width,
            height: obj.frame.height,
            angle: obj.frame.rotation,
            opacity: obj.opacity,
            selectable: !obj.locked,
          });
        } else {
          shapeVector.set({
            left: obj.frame.x,
            top: obj.frame.y,
            angle: obj.frame.rotation,
            opacity: obj.opacity,
            selectable: !obj.locked,
          });
          fabricObj = shapeVector;
        }
      } else if (obj.type === 'text-frame') {
        const fontDef = getFontDefinition(obj.fontFamily);
        const overflowText = obj.overflow ? ' [+] ⚠️' : '';
        const seqBadge = obj.sequenceIndex !== undefined ? ` [#${obj.sequenceIndex + 1}]` : '';

        let displayContent = 'اردو متن';
        if (stories && stories[obj.storyId]?.content?.content) {
          displayContent = stories[obj.storyId]!.content.content
            .map((p) => p.content.map((run) => (run.type === 'text' ? run.text : '')).join(''))
            .join('\n');
        }

        fabricObj = new fabric.Textbox(`${displayContent}${seqBadge}${overflowText}`, {
          left: obj.frame.x,
          top: obj.frame.y,
          width: obj.frame.width,
          height: obj.frame.height,
          angle: obj.frame.rotation,
          fill: obj.overflow ? '#dc2626' : obj.color,
          fontSize: obj.fontSize,
          fontFamily: fontDef.family,
          textAlign: 'right',
          opacity: obj.opacity,
          selectable: !obj.locked,
          editable: false, // Rich text DOM overlay handles interactive editing on double click
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

        if (selectedObjectId && obj.id === selectedObjectId) {
          activeFabricObj = fabricObj;
        }
      }
    }

    if (activeFabricObj) {
      this.canvas.setActiveObject(activeFabricObj);
    } else {
      this.canvas.discardActiveObject();
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
