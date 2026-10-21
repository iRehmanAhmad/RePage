import React, { useRef } from 'react';
import type { ImageCropInsets, PageObject, RePageDocument } from '../../domain/document/types';
import { MAX_IMAGE_CROP_INSET } from '../../domain/geometry/imageCrop';
import { pointsToMillimetres } from '../../domain/geometry/units';
import type { Translations } from '../i18n/menuTranslation';
import { AppIcon } from '../icons/AppIcon';

export interface InspectorDockProps {
  t: Translations;
  document: RePageDocument;
  selectedObject: PageObject | null;
  onUpdateGeometry: (
    objectId: string,
    coords: Partial<{ x: number; y: number; width: number; height: number; rotation: number }>
  ) => void;
  onUpdateShapeStyle?: (
    objectId: string,
    styleProps: Partial<{ fill: string; stroke: string; strokeWidth: number; cornerRadius: number }>
  ) => void;
  /** Sets (or clears, with null) the non-destructive crop of an image frame. */
  onUpdateImageCrop?: (objectId: string, crop: ImageCropInsets | null) => void;
  isOpen?: boolean | undefined;
  onClose?: (() => void) | undefined;
  width?: number | undefined;
  onWidthChange?: ((width: number) => void) | undefined;
}

export const InspectorDock: React.FC<InspectorDockProps> = ({
  t,
  document,
  selectedObject,
  onUpdateGeometry,
  onUpdateShapeStyle,
  onUpdateImageCrop,
  isOpen = true,
  onClose,
  width = 260,
  onWidthChange,
}) => {
  const isDraggingRef = useRef(false);

  if (!isOpen) return null;

  const activePage = document.pages[document.pageOrder[0]!];

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = startX - moveEvent.clientX; // Dragging left increases width
      const newWidth = Math.max(180, Math.min(480, startWidth + deltaX));
      onWidthChange?.(newWidth);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <aside
      className="studio-inspector"
      style={{ width: `${width}px`, minWidth: `${width}px`, position: 'relative' }}
    >
      {/* Left Resizer Drag Handle */}
      <div
        onMouseDown={handleMouseDownResize}
        title={t.tipResizeInspector}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '5px',
          cursor: 'col-resize',
          zIndex: 20,
          backgroundColor: 'transparent',
        }}
      />

      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span><AppIcon name="settings" /> {t.inspectorProps}</span>
          <span className="save-badge">
            {selectedObject ? selectedObject.type.toUpperCase() : 'CANVAS'}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '2px 4px',
            }}
            title={t.tipCloseInspector}
          >
            <AppIcon name="dismiss" />
          </button>
        )}
      </div>

      <div className="inspector-content">
        {selectedObject ? (
          <div className="space-y-section">
            {/* Object Header */}
            <div className="inspector-card highlight">
              <div className="flex-between mb-1">
                <span className="card-title">{t.inspElementId} {selectedObject.id}</span>
                <span className="font-active-tag">{selectedObject.type}</span>
              </div>
              <div className="card-sub">{t.inspPosHint}</div>
            </div>

            {/* Geometry X, Y, W, H Inputs */}
            <div className="space-y-card">
              <span className="field-label">{t.inspGeometry}</span>
              <div className="grid-2">
                <div className="inspector-field">
                  <label>{t.lblCoordX}</label>
                  <input
                    type="number"
                    value={Math.round(selectedObject.frame.x)}
                    onChange={(e) =>
                      onUpdateGeometry(selectedObject.id, { x: Number(e.target.value) })
                    }
                    className="field-input"
                  />
                </div>
                <div className="inspector-field">
                  <label>{t.lblCoordY}</label>
                  <input
                    type="number"
                    value={Math.round(selectedObject.frame.y)}
                    onChange={(e) =>
                      onUpdateGeometry(selectedObject.id, { y: Number(e.target.value) })
                    }
                    className="field-input"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="inspector-field">
                  <label>{t.inspWidth}</label>
                  <input
                    type="number"
                    value={Math.round(selectedObject.frame.width)}
                    onChange={(e) =>
                      onUpdateGeometry(selectedObject.id, { width: Number(e.target.value) })
                    }
                    className="field-input"
                  />
                </div>
                <div className="inspector-field">
                  <label>{t.inspHeight}</label>
                  <input
                    type="number"
                    value={Math.round(selectedObject.frame.height)}
                    onChange={(e) =>
                      onUpdateGeometry(selectedObject.id, { height: Number(e.target.value) })
                    }
                    className="field-input"
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="inspector-card">
              <div className="flex-between mb-2">
                <span className="field-label">{t.inspRotation}</span>
                <span className="font-mono text-xs">{selectedObject.frame.rotation}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={selectedObject.frame.rotation}
                onChange={(e) =>
                  onUpdateGeometry(selectedObject.id, { rotation: Number(e.target.value) })
                }
                className="range-slider"
              />
            </div>

            {/* Shape Fill & Outline Formatting (for Rectangle/Shapes) */}
            {selectedObject.type === 'rectangle' && (
              <div className="space-y-card" style={{ marginTop: '12px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
                <span className="field-label" style={{ color: '#38bdf8', fontWeight: 700 }}>
                  {t.inspShapeFormat}
                </span>

                {/* Fill Color */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8' }}>{t.inspFillColor}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={selectedObject.fill}
                      onChange={(e) =>
                        onUpdateShapeStyle?.(selectedObject.id, { fill: e.target.value })
                      }
                      style={{ width: '32px', height: '24px', cursor: 'pointer', border: 'none', background: 'none' }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{selectedObject.fill}</span>
                  </div>
                </div>

                {/* Outline Color */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8' }}>{t.inspOutlineColor}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={selectedObject.stroke}
                      onChange={(e) =>
                        onUpdateShapeStyle?.(selectedObject.id, { stroke: e.target.value })
                      }
                      style={{ width: '32px', height: '24px', cursor: 'pointer', border: 'none', background: 'none' }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{selectedObject.stroke}</span>
                  </div>
                </div>

                {/* Outline Width */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  <div className="flex-between">
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>{t.inspStrokeWidth}</label>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{selectedObject.strokeWidth} pt</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    value={selectedObject.strokeWidth}
                    onChange={(e) =>
                      onUpdateShapeStyle?.(selectedObject.id, { strokeWidth: Number(e.target.value) })
                    }
                    className="range-slider"
                  />
                </div>

                {/* Corner Radius */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  <div className="flex-between">
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>{t.inspCornerRadius}</label>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{selectedObject.cornerRadius} pt</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={selectedObject.cornerRadius}
                    onChange={(e) =>
                      onUpdateShapeStyle?.(selectedObject.id, { cornerRadius: Number(e.target.value) })
                    }
                    className="range-slider"
                  />
                </div>
              </div>
            )}
            {/* Image Crop (non-destructive insets, for Image Frames) */}
            {selectedObject.type === 'image-frame' && onUpdateImageCrop && (
              <div className="space-y-card" style={{ marginTop: '12px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
                <div className="flex-between mb-2">
                  <span className="field-label" style={{ color: '#38bdf8', fontWeight: 700 }}>
                    {t.inspImageCrop}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateImageCrop(selectedObject.id, null)}
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                    }}
                  >
                    {t.cropReset}
                  </button>
                </div>
                {(
                  [
                    ['left', t.cropInsetLeft],
                    ['top', t.cropInsetTop],
                    ['right', t.cropInsetRight],
                    ['bottom', t.cropInsetBottom],
                  ] as const
                ).map(([edge, label]) => {
                  const crop = selectedObject.crop ?? { left: 0, top: 0, right: 0, bottom: 0 };
                  const pct = Math.round(crop[edge] * 100);
                  return (
                    <div key={edge} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                      <div className="flex-between">
                        <label style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</label>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{pct}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.round(MAX_IMAGE_CROP_INSET * 100)}
                        value={pct}
                        onChange={(e) =>
                          onUpdateImageCrop(selectedObject.id, {
                            ...crop,
                            [edge]: Number(e.target.value) / 100,
                          })
                        }
                        className="range-slider"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Document Page Overview when no object selected */
          <div className="space-y-section">
            <div className="inspector-card empty">
              <AppIcon name="document" size={24} className="block mb-1" />
              <span>{t.inspEmpty}</span>
            </div>

            {activePage && (
              <div className="inspector-card">
                <span className="card-title block mb-2">{t.inspPageDims}</span>
                <div className="space-y-1 text-xs">
                  <div className="flex-between">
                    <span className="text-slate-400">{t.inspSize}</span>
                    <span>
                      {Math.round(pointsToMillimetres(activePage.width))} ×{' '}
                      {Math.round(pointsToMillimetres(activePage.height))} mm
                    </span>
                  </div>
                  <div className="flex-between">
                    <span className="text-slate-400">{t.inspMarginTop}</span>
                    <span>{activePage.margins.top} pt</span>
                  </div>
                  <div className="flex-between">
                    <span className="text-slate-400">{t.inspMarginRight}</span>
                    <span>{activePage.margins.right} pt</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
