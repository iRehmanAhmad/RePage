import React, { useState } from 'react';
import { PageObject, RePageDocument } from '../../domain/document/types';
import { getDocumentNotes, insertFootnote, insertEndnote, convertFootnotesToEndnotes, convertEndnotesToFootnotes } from '../../domain/rich-text/notesEngine';
import type { Translations } from '../i18n/menuTranslation';

export interface InspectorDockProps {
  t: Translations;
  document: RePageDocument;
  selectedObject: PageObject | null;
  onUpdateGeometry?: (objectId: string, coords: { x?: number; y?: number; width?: number; height?: number }) => void;
  onOpenLanguageTools: () => void;
  onOpenOcr: () => void;
  onExportPdf: () => void;
  onExportEpub: () => void;
}

export const InspectorDock: React.FC<InspectorDockProps> = ({
  t,
  document,
  selectedObject,
  onUpdateGeometry,
  onOpenLanguageTools,
  onOpenOcr,
  onExportPdf,
  onExportEpub,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'typography' | 'tools' | 'export'>('properties');
  const [noteText, setNoteText] = useState('');

  const notes = getDocumentNotes(document.id);

  const handleAddFootnote = () => {
    if (!noteText.trim()) return;
    const storyId = selectedObject && selectedObject.type === 'text-frame' ? selectedObject.storyId : 'story-1';
    insertFootnote(document.id, storyId, noteText);
    setNoteText('');
  };

  const handleAddEndnote = () => {
    if (!noteText.trim()) return;
    const storyId = selectedObject && selectedObject.type === 'text-frame' ? selectedObject.storyId : 'story-1';
    insertEndnote(document.id, storyId, noteText);
    setNoteText('');
  };

  return (
    <aside className="studio-inspector">
      {/* Inspector Tab Bar */}
      <div className="tab-header-list">
        <button
          onClick={() => setActiveTab('properties')}
          className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
        >
          {t.inspectorProps}
        </button>
        <button
          onClick={() => setActiveTab('typography')}
          className={`tab-btn ${activeTab === 'typography' ? 'active' : ''}`}
        >
          {t.inspectorType}
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
        >
          {t.inspectorTools}
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
        >
          {t.inspectorExport}
        </button>
      </div>

      {/* Tab Content */}
      <div className="inspector-content dir-rtl">
        {/* Tab 1: Properties */}
        {activeTab === 'properties' && (
          <div className="space-y-section">
            <div className="sidebar-header -mx-card -mt-card mb-card">
              <span>صفحہ و عنصر کی پیمائش</span>
              <small>v1 Canonical</small>
            </div>

            {selectedObject ? (
              <div className="space-y-card">
                <div className="inspector-card highlight">
                  <div className="card-title flex-between">
                    <span>منتخب عنصر:</span>
                    <span>{selectedObject.name}</span>
                  </div>
                  <div className="card-sub">آئی ڈی: {selectedObject.id}</div>
                </div>

                <div className="grid-2">
                  <div className="inspector-field">
                    <label>مقام (X pt):</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.frame.x)}
                      onChange={(e) =>
                        onUpdateGeometry?.(selectedObject.id, { x: Number(e.target.value) })
                      }
                      className="field-input"
                    />
                  </div>

                  <div className="inspector-field">
                    <label>مقام (Y pt):</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.frame.y)}
                      onChange={(e) =>
                        onUpdateGeometry?.(selectedObject.id, { y: Number(e.target.value) })
                      }
                      className="field-input"
                    />
                  </div>

                  <div className="inspector-field">
                    <label>چوڑائی (W pt):</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.frame.width)}
                      onChange={(e) =>
                        onUpdateGeometry?.(selectedObject.id, { width: Number(e.target.value) })
                      }
                      className="field-input"
                    />
                  </div>

                  <div className="inspector-field">
                    <label>لمبائی (H pt):</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.frame.height)}
                      onChange={(e) =>
                        onUpdateGeometry?.(selectedObject.id, { height: Number(e.target.value) })
                      }
                      className="field-input"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="inspector-card empty">
                کینوس پر کوئی عنصر منتخب نہیں۔ عنصر کے خواص دیکھنے کے لیے اس پر کلک کریں۔
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Typography */}
        {activeTab === 'typography' && (
          <div className="space-y-section">
            <div className="sidebar-header -mx-card -mt-card mb-card">
              <span>اردو خطاطی و اسٹائل</span>
              <small>Nastaliq</small>
            </div>

            <div className="inspector-card space-y-card">
              <div>
                <label className="field-label">خط (Urdu Font):</label>
                <div className="font-active-tag">جمیل نوری نستعلیق / Noto Nastaliq</div>
              </div>

              <div>
                <label className="field-label">سطر کا فاصلہ (Line Height):</label>
                <input type="range" min="1.0" max="3.0" step="0.1" defaultValue="1.8" className="range-slider" />
              </div>

              <div>
                <label className="field-label">حروف کا فاصلہ (Tracking):</label>
                <input type="range" min="-2" max="10" defaultValue="0" className="range-slider" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tools */}
        {activeTab === 'tools' && (
          <div className="space-y-section">
            <div className="sidebar-header -mx-card -mt-card mb-card">
              <span>اردو زبان و OCR آلات</span>
              <small>AI Suite</small>
            </div>

            <button onClick={onOpenLanguageTools} className="tool-launch-card emerald">
              <div className="card-flex">
                <span className="icon">🌐</span>
                <div>
                  <div className="title">{t.tabUrduTools}</div>
                  <div className="desc">املاء، لغت، رومن اردو، نرمائلائزیشن</div>
                </div>
              </div>
              <span className="arrow">➔</span>
            </button>

            <button onClick={onOpenOcr} className="tool-launch-card sky">
              <div className="card-flex">
                <span className="icon">📷</span>
                <div>
                  <div className="title">{t.ocr}</div>
                  <div className="desc">اعتماد اور ساتھ ساتھ تصحیح</div>
                </div>
              </div>
              <span className="arrow">➔</span>
            </button>
          </div>
        )}

        {/* Tab 4: Export & Notes */}
        {activeTab === 'export' && (
          <div className="space-y-section">
            <div className="sidebar-header -mx-card -mt-card mb-card">
              <span>حواشی، تعلیقات و برآمد</span>
              <small>Footnotes & ePUB</small>
            </div>

            {/* Notes Section */}
            <div className="inspector-card space-y-card">
              <label className="field-label bold">حاشیہ یا تعلیق شامل کریں:</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="حاشیے کا متن..."
                className="note-textarea"
              />
              <div className="btn-row">
                <button onClick={handleAddFootnote} className="action-btn primary">
                  {t.addFootnote}
                </button>
                <button onClick={handleAddEndnote} className="action-btn secondary">
                  {t.addEndnote}
                </button>
              </div>

              {notes.length > 0 && (
                <div className="btn-row border-t pt-2">
                  <button onClick={() => convertFootnotesToEndnotes(document.id)} className="action-btn sm">
                    حواشی ➔ تعلیقات
                  </button>
                  <button onClick={() => convertEndnotesToFootnotes(document.id)} className="action-btn sm">
                    تعلیقات ➔ حواشی
                  </button>
                </div>
              )}
            </div>

            {/* Export Section */}
            <div className="inspector-card space-y-card">
              <div className="card-title">{t.tabExportView}:</div>
              <button onClick={onExportPdf} className="export-btn pdf">
                <span>📄</span> {t.exportPdf} (1200 DPI)
              </button>
              <button onClick={onExportEpub} className="export-btn epub">
                <span>📚</span> {t.exportEpub}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
