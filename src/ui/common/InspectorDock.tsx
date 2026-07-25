import React, { useState } from 'react';
import { PageObject, RePageDocument } from '../../domain/document/types';
import { getDocumentNotes, insertFootnote, insertEndnote, convertFootnotesToEndnotes, convertEndnotesToFootnotes } from '../../domain/rich-text/notesEngine';

export interface InspectorDockProps {
  document: RePageDocument;
  selectedObject: PageObject | null;
  onUpdateGeometry?: (objectId: string, coords: { x?: number; y?: number; width?: number; height?: number }) => void;
  onOpenLanguageTools: () => void;
  onOpenOcr: () => void;
  onExportPdf: () => void;
  onExportEpub: () => void;
}

export const InspectorDock: React.FC<InspectorDockProps> = ({
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
          خواص (Props)
        </button>
        <button
          onClick={() => setActiveTab('typography')}
          className={`tab-btn ${activeTab === 'typography' ? 'active' : ''}`}
        >
          خطاطی (Type)
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
        >
          آلات (Tools)
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
        >
          حواشی/برآمد
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs dir-rtl text-slate-200">
        {/* Tab 1: Properties */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            <div className="sidebar-header -mx-4 -mt-4 mb-4">
              <span>صفحہ و عنصر کی پیمائش</span>
              <small>v1 Canonical</small>
            </div>

            {selectedObject ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <div className="font-bold text-emerald-400 flex justify-between">
                    <span>منتخب عنصر:</span>
                    <span>{selectedObject.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">آئی ڈی: {selectedObject.id}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                    <label className="block text-[10px] text-slate-400">مقام (X pt):</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.frame.x)}
                      onChange={(e) =>
                        onUpdateGeometry?.(selectedObject.id, { x: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-center text-slate-100"
                    />
                  </div>

                  <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                    <label className="block text-[10px] text-slate-400">مقام (Y pt):</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.frame.y)}
                      onChange={(e) =>
                        onUpdateGeometry?.(selectedObject.id, { y: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-center text-slate-100"
                    />
                  </div>

                  <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                    <label className="block text-[10px] text-slate-400">چوڑائی (Width pt):</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.frame.width)}
                      onChange={(e) =>
                        onUpdateGeometry?.(selectedObject.id, { width: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-center text-slate-100"
                    />
                  </div>

                  <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                    <label className="block text-[10px] text-slate-400">لمبائی (Height pt):</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.frame.height)}
                      onChange={(e) =>
                        onUpdateGeometry?.(selectedObject.id, { height: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-center text-slate-100"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-center text-slate-400">
                کینوس پر کوئی عنصر منتخب نہیں۔ عنصر کے خواص دیکھنے کے لیے اس پر کلک کریں۔
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Typography */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            <div className="sidebar-header -mx-4 -mt-4 mb-4">
              <span>اردو خطاطی و اسٹائل</span>
              <small>Nastaliq Layout</small>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">خط (Urdu Font):</label>
                <div className="text-emerald-400 font-bold">جمیل نوری نستعلیق / Noto Nastaliq</div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">سطر کا فاصلہ (Line Height):</label>
                <input type="range" min="1.0" max="3.0" step="0.1" defaultValue="1.8" className="w-full accent-emerald-500" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">حروف کا درمیانی فاصلہ (Tracking):</label>
                <input type="range" min="-2" max="10" defaultValue="0" className="w-full accent-emerald-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tools */}
        {activeTab === 'tools' && (
          <div className="space-y-3">
            <div className="sidebar-header -mx-4 -mt-4 mb-4">
              <span>اردو زبان و OCR آلات</span>
              <small>AI Suite</small>
            </div>

            <button
              onClick={onOpenLanguageTools}
              className="w-full p-3 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 rounded-lg text-right flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🌐</span>
                <div>
                  <div className="font-bold text-emerald-400">اردو زبان کے آلات</div>
                  <div className="text-[10px] text-slate-400">املاء، لغت، رومن اردو، نرمائلائزیشن</div>
                </div>
              </div>
              <span>➔</span>
            </button>

            <button
              onClick={onOpenOcr}
              className="w-full p-3 bg-slate-900 hover:bg-slate-800 border border-sky-500/40 rounded-lg text-right flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">📷</span>
                <div>
                  <div className="font-bold text-sky-400">تصویر / PDF متن شناسی (OCR)</div>
                  <div className="text-[10px] text-slate-400">اعتماد اور ساتھ ساتھ تصحیح</div>
                </div>
              </div>
              <span>➔</span>
            </button>
          </div>
        )}

        {/* Tab 4: Export & Notes */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="sidebar-header -mx-4 -mt-4 mb-4">
              <span>حواشی، تعلیقات و برآمد</span>
              <small>Footnotes & ePUB</small>
            </div>

            {/* Notes Section */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
              <label className="block text-slate-400 font-bold mb-1">حاشیہ یا تعلیق شامل کریں:</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="حاشیے کا متن..."
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 h-16 focus:outline-none focus:border-emerald-500 text-xs"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddFootnote}
                  className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold"
                >
                  + ذیلی حاشیہ (Footnote)
                </button>
                <button
                  onClick={handleAddEndnote}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-bold"
                >
                  + تعلیق (Endnote)
                </button>
              </div>

              {notes.length > 0 && (
                <div className="pt-2 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={() => convertFootnotesToEndnotes(document.id)}
                    className="flex-1 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] border border-slate-700 rounded"
                  >
                    تمام حواشی ➔ تعلیقات
                  </button>
                  <button
                    onClick={() => convertEndnotesToFootnotes(document.id)}
                    className="flex-1 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] border border-slate-700 rounded"
                  >
                    تمام تعلیقات ➔ حواشی
                  </button>
                </div>
              )}
            </div>

            {/* Export Section */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
              <div className="font-bold text-slate-300 mb-1">فائل برآمد کریں (Export):</div>
              <button
                onClick={onExportPdf}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center justify-center gap-2"
              >
                <span>📄</span> High-DPI Vector PDF (1200 DPI)
              </button>
              <button
                onClick={onExportEpub}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded flex items-center justify-center gap-2"
              >
                <span>📚</span> ePUB 3.0 Mobile Reader Package
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
