import React from 'react';
import type { PageObject, RePageDocument } from '../../domain/document/types';
import { pointsToMillimetres } from '../../domain/geometry/units';
import type { Translations } from '../i18n/menuTranslation';

export interface InspectorDockProps {
  t: Translations;
  document: RePageDocument;
  selectedObject: PageObject | null;
  onUpdateGeometry: (
    objectId: string,
    coords: Partial<{ x: number; y: number; width: number; height: number; rotation: number }>
  ) => void;
}

export const InspectorDock: React.FC<InspectorDockProps> = ({
  t,
  document,
  selectedObject,
  onUpdateGeometry,
}) => {
  const activePage = document.pages[document.pageOrder[0]!];

  return (
    <aside className="studio-inspector">
      <div className="sidebar-header">
        <span>⚙ {t.inspectorProps}</span>
        <span className="save-badge">
          {selectedObject ? selectedObject.type.toUpperCase() : 'CANVAS'}
        </span>
      </div>

      <div className="inspector-content">
        {selectedObject ? (
          <div className="space-y-section">
            {/* Object Header */}
            <div className="inspector-card highlight">
              <div className="flex-between mb-1">
                <span className="card-title">عنصر ID: {selectedObject.id}</span>
                <span className="font-active-tag">{selectedObject.type}</span>
              </div>
              <div className="card-sub">پوزیشن اور پیمائش درج کریں (pt / mm)</div>
            </div>

            {/* Geometry X, Y, W, H Inputs */}
            <div className="space-y-card">
              <span className="field-label">مقام اور جسامت (Geometry)</span>
              <div className="grid-2">
                <div className="inspector-field">
                  <label>X (pt)</label>
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
                  <label>Y (pt)</label>
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
                  <label>چوڑائی Width (pt)</label>
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
                  <label>اونچائی Height (pt)</label>
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
                <span className="field-label">زاویہ (Rotation)</span>
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
          </div>
        ) : (
          /* Document Page Overview when no object selected */
          <div className="space-y-section">
            <div className="inspector-card empty">
              <span className="block text-xl mb-1">📄</span>
              <span>کینوس پر کوئی عنصر منتخب نہیں۔ عنصر کے خواص دیکھنے کے لیے اس پر کلک کریں۔</span>
            </div>

            {activePage && (
              <div className="inspector-card">
                <span className="card-title block mb-2">صفحہ کی پیمائش (Page Dimensions)</span>
                <div className="space-y-1 text-xs">
                  <div className="flex-between">
                    <span className="text-slate-400">سائز:</span>
                    <span>
                      {Math.round(pointsToMillimetres(activePage.width))} ×{' '}
                      {Math.round(pointsToMillimetres(activePage.height))} mm
                    </span>
                  </div>
                  <div className="flex-between">
                    <span className="text-slate-400">حواشی (Top):</span>
                    <span>{activePage.margins.top} pt</span>
                  </div>
                  <div className="flex-between">
                    <span className="text-slate-400">حواشی (Right):</span>
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
