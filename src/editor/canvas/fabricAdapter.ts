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
      perPixelTargetFind: false,
      targetFindTolerance: 6,
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
    assets?: Record<string, import('../../domain/document/types').AssetReference>,
    editingObjectId?: string | null,
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
          fill: (!obj.fill || obj.fill === 'transparent') ? 'rgba(255, 255, 255, 0.0001)' : obj.fill,
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
        const isEditing = editingObjectId && editingObjectId === obj.id;
        if (!isEditing && obj.storyId && stories && stories[obj.storyId]?.content?.content) {
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
            originX: 'left',
            originY: 'top',
          });
        } else {
          shapeVector.set({
            left: obj.frame.x,
            top: obj.frame.y,
            angle: obj.frame.rotation,
            opacity: obj.opacity,
            selectable: !obj.locked,
            originX: 'left',
            originY: 'top',
          });
          fabricObj = shapeVector;
        }
      } else if (obj.type === 'text-frame') {
        const fontDef = getFontDefinition(obj.fontFamily);
        const overflowText = obj.overflow ? ' [+] ⚠️' : '';
        const seqBadge = obj.sequenceIndex !== undefined ? ` [#${obj.sequenceIndex + 1}]` : '';

        const isEditing = editingObjectId && editingObjectId === obj.id;
        let displayContent = '';
        if (!isEditing && stories && stories[obj.storyId]?.content?.content) {
          displayContent = stories[obj.storyId]!.content.content
            .map((p) => p.content.map((run) => (run.type === 'text' ? run.text : '')).join(''))
            .join('\n');
        }

        const frameRect = new fabric.Rect({
          left: 0,
          top: 0,
          width: obj.frame.width,
          height: obj.frame.height,
          fill: 'rgba(255, 255, 255, 0.0001)',
          stroke: '#0284c7',
          strokeWidth: 1,
          strokeDashArray: [4, 4],
          originX: 'left',
          originY: 'top',
        });

        const fullText = `${displayContent}${isEditing ? '' : seqBadge}${isEditing ? '' : overflowText}`;
        if (fullText.trim()) {
          const textObj = new fabric.Textbox(fullText, {
            left: 4,
            top: 4,
            width: Math.max(10, obj.frame.width - 8),
            fill: obj.overflow ? '#dc2626' : obj.color,
            fontSize: obj.fontSize,
            fontFamily: fontDef.family,
            textAlign: 'right',
            originX: 'left',
            originY: 'top',
            editable: false,
          });

          fabricObj = new fabric.Group([frameRect, textObj], {
            left: obj.frame.x,
            top: obj.frame.y,
            width: obj.frame.width,
            height: obj.frame.height,
            angle: obj.frame.rotation,
            opacity: obj.opacity,
            selectable: !obj.locked,
            originX: 'left',
            originY: 'top',
          });
        } else {
          frameRect.set({
            left: obj.frame.x,
            top: obj.frame.y,
            angle: obj.frame.rotation,
            opacity: obj.opacity,
            selectable: !obj.locked,
            originX: 'left',
            originY: 'top',
          });
          fabricObj = frameRect;
        }
      } else if (obj.type === 'image-frame') {
        const asset = obj.assetId && assets ? assets[obj.assetId] : undefined;
        if (asset?.dataUrl) {
          const imgElement = new Image();
          imgElement.src = asset.dataUrl;

          const imgWidth = imgElement.naturalWidth || obj.frame.width || 100;
          const imgHeight = imgElement.naturalHeight || obj.frame.height || 100;

          const scaleX = obj.frame.width / imgWidth;
          const scaleY = obj.frame.height / imgHeight;

          const fabricImg = new fabric.Image(imgElement, {
            left: obj.frame.x,
            top: obj.frame.y,
            scaleX,
            scaleY,
            angle: obj.frame.rotation,
            opacity: obj.opacity,
            selectable: !obj.locked,
            originX: 'left',
            originY: 'top',
          });

          imgElement.onload = () => {
            if (this.canvas && fabricImg && imgElement.naturalWidth) {
              fabricImg.set({
                scaleX: obj.frame.width / imgElement.naturalWidth,
                scaleY: obj.frame.height / imgElement.naturalHeight,
              });
              this.canvas.renderAll();
            }
          };

          fabricObj = fabricImg;
        } else {
          // Placeholder Image Frame
          const placeholderRect = new fabric.Rect({
            left: 0,
            top: 0,
            width: obj.frame.width,
            height: obj.frame.height,
            fill: '#f8fafc',
            stroke: '#0284c7',
            strokeWidth: 1.5,
            strokeDashArray: [4, 4],
            originX: 'left',
            originY: 'top',
          });
          const fontDef = getFontDefinition('Noto Nastaliq Urdu');
          const placeholderText = new fabric.Textbox('🖼️ تصویر لاؤ (ڈبل کلک کریں)', {
            left: 4,
            top: Math.max(0, obj.frame.height / 2 - 14),
            width: Math.max(10, obj.frame.width - 8),
            fontSize: 14,
            fontFamily: fontDef.family,
            fill: '#0284c7',
            textAlign: 'center',
            originX: 'left',
            originY: 'top',
            editable: false,
          });
          fabricObj = new fabric.Group([placeholderRect, placeholderText], {
            left: obj.frame.x,
            top: obj.frame.y,
            width: obj.frame.width,
            height: obj.frame.height,
            angle: obj.frame.rotation,
            opacity: obj.opacity,
            selectable: !obj.locked,
            originX: 'left',
            originY: 'top',
          });
        }
      } else if (obj.type === 'table') {
        const rowCount = Math.max(1, obj.rows.length);
        const colCount = Math.max(1, obj.rows[0]?.cells.length || 1);
        const cellH = obj.frame.height / rowCount;
        const cellW = obj.frame.width / colCount;

        const groupObjects: fabric.FabricObject[] = [];

        // Outer border
        groupObjects.push(
          new fabric.Rect({
            left: 0,
            top: 0,
            width: obj.frame.width,
            height: obj.frame.height,
            fill: 'rgba(255, 255, 255, 0.95)',
            stroke: obj.borderColor || '#cbd5e1',
            strokeWidth: obj.borderWidth || 1,
            originX: 'left',
            originY: 'top',
          }),
        );

        // Internal row dividers
        for (let r = 1; r < rowCount; r++) {
          groupObjects.push(
            new fabric.Line([0, r * cellH, obj.frame.width, r * cellH], {
              stroke: obj.borderColor || '#cbd5e1',
              strokeWidth: obj.borderWidth || 1,
              originX: 'left',
              originY: 'top',
            }),
          );
        }

        // Internal column dividers
        for (let c = 1; c < colCount; c++) {
          groupObjects.push(
            new fabric.Line([c * cellW, 0, c * cellW, obj.frame.height], {
              stroke: obj.borderColor || '#cbd5e1',
              strokeWidth: obj.borderWidth || 1,
              originX: 'left',
              originY: 'top',
            }),
          );
        }

        // Cell text
        const fontDef = getFontDefinition('Noto Nastaliq Urdu');
        obj.rows.forEach((row, r) => {
          row.cells.forEach((cell, c) => {
            let cellText = '';
            const contentObj = cell.content as { content?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
            if (contentObj?.content) {
              cellText = contentObj.content
                .map((p) => p.content ? p.content.map((run) => (run.type === 'text' ? run.text || '' : '')).join('') : '')
                .join(' ');
            }
            if (cellText.trim()) {
              groupObjects.push(
                new fabric.Textbox(cellText, {
                  left: c * cellW + 4,
                  top: r * cellH + Math.max(0, cellH / 2 - 10),
                  width: Math.max(10, cellW - 8),
                  fontSize: 12,
                  fontFamily: fontDef.family,
                  fill: '#1e293b',
                  textAlign: 'right',
                  originX: 'left',
                  originY: 'top',
                  editable: false,
                }),
              );
            }
          });
        });

        fabricObj = new fabric.Group(groupObjects, {
          left: obj.frame.x,
          top: obj.frame.y,
          width: obj.frame.width,
          height: obj.frame.height,
          angle: obj.frame.rotation,
          opacity: obj.opacity,
          selectable: !obj.locked,
          originX: 'left',
          originY: 'top',
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
