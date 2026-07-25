import React, { useState } from 'react';
import type { UiLanguage, Translations } from '../i18n/menuTranslation';

export type ActiveTool = 'select' | 'text' | 'rectangle' | 'image' | 'pan';
export type RibbonTab = 'home' | 'insert' | 'urdu-tools' | 'layout' | 'collab' | 'export';

export interface MsWordRibbonProps {
  t: Translations;
  lang: UiLanguage;
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activeFontFamily: string;
  onFontFamilyChange: (font: string) => void;
  activeFontSize: number;
  onFontSizeChange: (size: number) => void;
  isKashidaEnabled: boolean;
  onToggleKashida: () => void;
  activeAlignment: string;
  onAlignmentChange: (align: string) => void;
  onAddPage: () => void;
  onRemovePage: () => void;
  onAddFootnote: () => void;
  onAddEndnote: () => void;
  onOpenLanguageTools: () => void;
  onOpenOcr: () => void;
  onExportPdf: () => void;
  onExportEpub: () => void;
  onRunPreflight: () => void;
  onToggleCollab: () => void;
}

export const MsWordRibbon: React.FC<MsWordRibbonProps> = ({
  t,
  activeTool,
  onSelectTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  activeFontFamily,
  onFontFamilyChange,
  activeFontSize,
  onFontSizeChange,
  isKashidaEnabled,
  onToggleKashida,
  activeAlignment,
  onAlignmentChange,
  onAddPage,
  onRemovePage,
  onAddFootnote,
  onAddEndnote,
  onOpenLanguageTools,
  onOpenOcr,
  onExportPdf,
  onExportEpub,
  onRunPreflight,
  onToggleCollab,
}) => {
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');

  return (
    <div className="ms-word-ribbon-container">
      {/* Ribbon Top Tab Header Navigation */}
      <div className="ribbon-tabs-header">
        <button
          onClick={() => setActiveTab('home')}
          className={`ribbon-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
        >
          <span>🏠</span> {t.tabHome}
        </button>
        <button
          onClick={() => setActiveTab('insert')}
          className={`ribbon-tab-btn ${activeTab === 'insert' ? 'active' : ''}`}
        >
          <span>➕</span> {t.tabInsert}
        </button>
        <button
          onClick={() => setActiveTab('urdu-tools')}
          className={`ribbon-tab-btn ${activeTab === 'urdu-tools' ? 'active' : ''}`}
        >
          <span>🌐</span> {t.tabUrduTools}
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`ribbon-tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
        >
          <span>📐</span> {t.tabPageLayout}
        </button>
        <button
          onClick={() => setActiveTab('collab')}
          className={`ribbon-tab-btn ${activeTab === 'collab' ? 'active' : ''}`}
        >
          <span>👥</span> {t.tabCollab}
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`ribbon-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
        >
          <span>📤</span> {t.tabExportView}
        </button>
      </div>

      {/* Ribbon Tool Toolbar Body */}
      <div className="ribbon-toolbar-body">
        {/* Tab 1: HOME */}
        {activeTab === 'home' && (
          <div className="ribbon-group-row">
            {/* History */}
            <div className="ribbon-chunk">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`ribbon-action-btn ${!canUndo ? 'disabled' : ''}`}
                title={t.undo}
              >
                <span>↩</span>
                <span>{t.undo}</span>
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`ribbon-action-btn ${!canRedo ? 'disabled' : ''}`}
                title={t.redo}
              >
                <span>↪</span>
                <span>{t.redo}</span>
              </button>
            </div>

            <div className="ribbon-v-divider" />

            {/* Tools */}
            <div className="ribbon-chunk">
              <button
                onClick={() => onSelectTool('select')}
                className={`ribbon-action-btn ${activeTool === 'select' ? 'active' : ''}`}
                title={t.select}
              >
                <span>↖</span>
                <span>{t.select}</span>
              </button>

              <button
                onClick={() => onSelectTool('text')}
                className={`ribbon-action-btn ${activeTool === 'text' ? 'active' : ''}`}
                title={t.textFrame}
              >
                <span>T</span>
                <span>{t.textFrame}</span>
              </button>

              <button
                onClick={() => onSelectTool('rectangle')}
                className={`ribbon-action-btn ${activeTool === 'rectangle' ? 'active' : ''}`}
                title={t.shape}
              >
                <span>▭</span>
                <span>{t.shape}</span>
              </button>

              <button
                onClick={() => onSelectTool('image')}
                className={`ribbon-action-btn ${activeTool === 'image' ? 'active' : ''}`}
                title={t.imageFrame}
              >
                <span>🖼</span>
                <span>{t.imageFrame}</span>
              </button>
            </div>

            <div className="ribbon-v-divider" />

            {/* Typography */}
            <div className="ribbon-chunk dir-rtl">
              <select
                value={activeFontFamily}
                onChange={(e) => onFontFamilyChange(e.target.value)}
                className="ribbon-select"
                title={t.fontFamily}
              >
                <option value="Noto Nastaliq Urdu">نستعلیق (Noto Nastaliq)</option>
                <option value="Jameel Noori Nastaleeq">جمیل نوری نستعلیق</option>
                <option value="Gulzar">گلزار (Gulzar)</option>
                <option value="InPage Ali Nastaliq">انپیج علی نستعلیق</option>
                <option value="InPage Lahori Nastaliq">انپیج لاہوری نستعلیق</option>
              </select>

              <input
                type="number"
                value={activeFontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="ribbon-number-input"
                min={8}
                max={144}
                title={t.fontSize}
              />

              <button
                onClick={onToggleKashida}
                className={`ribbon-action-btn ${isKashidaEnabled ? 'active' : ''}`}
                title={t.kashida}
              >
                <span>ـ</span>
                <span>{t.kashida}</span>
              </button>

              <div className="ribbon-align-group">
                <button
                  onClick={() => onAlignmentChange('start')}
                  className={`ribbon-align-btn ${activeAlignment === 'start' ? 'active' : ''}`}
                >
                  {t.alignRight}
                </button>
                <button
                  onClick={() => onAlignmentChange('center')}
                  className={`ribbon-align-btn ${activeAlignment === 'center' ? 'active' : ''}`}
                >
                  {t.alignCenter}
                </button>
                <button
                  onClick={() => onAlignmentChange('justify')}
                  className={`ribbon-align-btn ${activeAlignment === 'justify' ? 'active' : ''}`}
                >
                  {t.alignJustify}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: INSERT */}
        {activeTab === 'insert' && (
          <div className="ribbon-group-row">
            <div className="ribbon-chunk">
              <button onClick={onAddPage} className="ribbon-action-btn highlight">
                <span>📄</span>
                <span>{t.addPage}</span>
              </button>
              <button onClick={onRemovePage} className="ribbon-action-btn">
                <span>🗑</span>
                <span>{t.removePage}</span>
              </button>
            </div>

            <div className="ribbon-v-divider" />

            <div className="ribbon-chunk">
              <button onClick={() => onSelectTool('text')} className="ribbon-action-btn">
                <span>T</span>
                <span>{t.textFrame}</span>
              </button>
              <button onClick={() => onSelectTool('image')} className="ribbon-action-btn">
                <span>🖼</span>
                <span>{t.imageFrame}</span>
              </button>
              <button onClick={() => onSelectTool('rectangle')} className="ribbon-action-btn">
                <span>▭</span>
                <span>{t.shape}</span>
              </button>
            </div>

            <div className="ribbon-v-divider" />

            <div className="ribbon-chunk">
              <button onClick={onAddFootnote} className="ribbon-action-btn">
                <span>📜</span>
                <span>{t.addFootnote}</span>
              </button>
              <button onClick={onAddEndnote} className="ribbon-action-btn">
                <span>🔖</span>
                <span>{t.addEndnote}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: URDU TOOLS */}
        {activeTab === 'urdu-tools' && (
          <div className="ribbon-group-row">
            <div className="ribbon-chunk">
              <button onClick={onOpenLanguageTools} className="ribbon-action-btn highlight">
                <span>🌐</span>
                <span>{t.spellcheck} & {t.dictionary}</span>
              </button>
              <button onClick={onOpenLanguageTools} className="ribbon-action-btn">
                <span>✍</span>
                <span>{t.proofread} & {t.transliteration}</span>
              </button>
            </div>

            <div className="ribbon-v-divider" />

            <div className="ribbon-chunk">
              <button onClick={onOpenOcr} className="ribbon-action-btn sky">
                <span>📷</span>
                <span>{t.ocr}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: PAGE LAYOUT */}
        {activeTab === 'layout' && (
          <div className="ribbon-group-row">
            <div className="ribbon-chunk">
              <div className="ribbon-label-tag">
                <span>📄 {t.pageSize}: A4 (210 × 297 mm)</span>
              </div>
              <div className="ribbon-label-tag">
                <span>📐 {t.margins}: Top 36pt / Right 50pt</span>
              </div>
            </div>

            <div className="ribbon-v-divider" />

            <div className="ribbon-chunk">
              <div className="ribbon-label-tag">
                <span>📊 {t.columns}: Single Column Flow</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: COLLABORATION */}
        {activeTab === 'collab' && (
          <div className="ribbon-group-row">
            <div className="ribbon-chunk">
              <button onClick={onToggleCollab} className="ribbon-action-btn highlight">
                <span>👥</span>
                <span>{t.collabRoom}</span>
              </button>
              <button onClick={onToggleCollab} className="ribbon-action-btn">
                <span>🔗</span>
                <span>{t.shareLink}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 6: EXPORT & VIEW */}
        {activeTab === 'export' && (
          <div className="ribbon-group-row">
            <div className="ribbon-chunk">
              <button onClick={onExportPdf} className="ribbon-action-btn primary">
                <span>📄</span>
                <span>{t.exportPdf} (1200 DPI)</span>
              </button>
              <button onClick={onExportEpub} className="ribbon-action-btn gold">
                <span>📚</span>
                <span>{t.exportEpub}</span>
              </button>
            </div>

            <div className="ribbon-v-divider" />

            <div className="ribbon-chunk">
              <button onClick={onRunPreflight} className="ribbon-action-btn">
                <span>🔍</span>
                <span>{t.preflight}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
