import React, { useState, useRef } from 'react';
import type { UiLanguage, Translations } from '../i18n/menuTranslation';
import type { ShapeKind, TextWrapMode, ViewMode } from '../../domain/document/types';

export type ActiveTool = 'select' | 'text' | 'rectangle' | 'image' | 'pan';
export type RibbonTab =
  | 'file'
  | 'home'
  | 'insert'
  | 'urdu-tools'
  | 'layout'
  | 'collab'
  | 'export'
  | 'shape-format'
  | 'picture-format'
  | 'table-format';

export interface MsWordRibbonProps {
  t: Translations;
  lang: UiLanguage;
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  onInsertShape?: (kind: ShapeKind) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenDocument: (file: File) => void;
  onSaveDocument: () => void;
  onSaveAsDocument: () => void;
  onShowRecentFiles: () => void;
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
  onOpenFileBackstage?: () => void;
  onToggleNavigationPane?: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onToggleOrientation?: () => void;
  onInsertSectionBreak?: (type: 'next-page' | 'continuous') => void;
  showRulers?: boolean;
  onToggleRulers?: () => void;
  selectedObjectType?: 'text-frame' | 'rectangle' | 'image-frame' | 'table' | null;
  onReorderObject?: (action: 'forward' | 'backward' | 'front' | 'back') => void;
  onAlignObjects?: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onSetWrapping?: (wrapMode: TextWrapMode) => void;
  onToggleSelectionPane?: () => void;
  onInsertTable?: () => void;
  onOpenStylesManager?: () => void;
  onOpenDocStats?: () => void;
  onInsertToc?: () => void;
  onInsertCaption?: () => void;
  onInsertBookmark?: () => void;
  onInsertIndex?: () => void;
  onOpenCharacterSubstitution?: () => void;
  onOpenKeyboardEditor?: () => void;
  editMode?: 'editing' | 'reviewing' | 'viewing';
  onEditModeChange?: (mode: 'editing' | 'reviewing' | 'viewing') => void;
  onToggleReviewingPane?: () => void;
  onOpenCompare?: () => void;
  onOpenVersionHistory?: () => void;
  onOpenShare?: () => void;
  onOpenAccessibilityChecker?: () => void;
  onOpenAccessibilitySettings?: () => void;
  onToggleReadAloud?: () => void;
  onToggleFocusMode?: () => void;
  isFocusMode?: boolean;
  onToggleInspector?: () => void;
  isInspectorOpen?: boolean;
}

export const MsWordRibbon: React.FC<MsWordRibbonProps> = ({
  t,
  lang,
  activeTool,
  onSelectTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenDocument,
  onSaveDocument,
  onSaveAsDocument,
  onShowRecentFiles,
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
  onAddEndnote: _onAddEndnote,
  onOpenLanguageTools,
  onOpenOcr,
  onExportPdf,
  onExportEpub,
  onRunPreflight,
  onToggleCollab,
  onOpenFileBackstage,
  onToggleNavigationPane: _onToggleNavigationPane,
  viewMode = 'print',
  onViewModeChange,
  onToggleOrientation,
  onInsertSectionBreak,
  showRulers = true,
  onToggleRulers,
  selectedObjectType,
  onReorderObject,
  onAlignObjects,
  onSetWrapping,
  onToggleSelectionPane,
  onInsertTable,
  onOpenStylesManager,
  onOpenDocStats,
  onInsertToc,
  onInsertCaption,
  onInsertBookmark,
  onInsertIndex,
  onOpenCharacterSubstitution,
  onOpenKeyboardEditor,
  editMode = 'editing',
  onEditModeChange,
  onToggleReviewingPane,
  onOpenCompare,
  onOpenVersionHistory,
  onOpenShare,
  onOpenAccessibilityChecker,
  onOpenAccessibilitySettings,
  onToggleReadAloud,
  onToggleFocusMode,
  isFocusMode = false,
  onToggleInspector,
  isInspectorOpen = true,
  onInsertShape,
}) => {
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
  const [showShapeGallery, setShowShapeGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (selectedObjectType === 'rectangle' || selectedObjectType === 'text-frame') {
      setActiveTab('shape-format');
    } else if (selectedObjectType === 'image-frame') {
      setActiveTab('picture-format');
    } else if (selectedObjectType === 'table') {
      setActiveTab('table-format');
    }
  }, [selectedObjectType]);

  const toggleCollapse = () => setIsRibbonCollapsed((prev) => !prev);

  return (
    <div className="ms-word-ribbon-container">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".urdup,.inp,.txt,.docx,.html,.rtf,.svg,.pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onOpenDocument(file);
        }}
      />

      {/* Ribbon Top Tab Header Navigation */}
      <div className="ribbon-tabs-header">
        {/* Special MS Word File Button */}
        <button
          onClick={() => {
            if (onOpenFileBackstage) {
              onOpenFileBackstage();
            } else {
              setActiveTab('file');
            }
          }}
          className={`ribbon-file-btn ${activeTab === 'file' ? 'active' : ''}`}
        >
          <span>📁</span> {t.tabFile}
        </button>

        <button
          onClick={() => {
            if (isRibbonCollapsed) setIsRibbonCollapsed(false);
            setActiveTab('home');
          }}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
        >
          <span>🏠</span> {t.tabHome}
        </button>
        <button
          onClick={() => {
            if (isRibbonCollapsed) setIsRibbonCollapsed(false);
            setActiveTab('insert');
          }}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'insert' ? 'active' : ''}`}
        >
          <span>➕</span> {t.tabInsert}
        </button>
        <button
          onClick={() => {
            if (isRibbonCollapsed) setIsRibbonCollapsed(false);
            setActiveTab('urdu-tools');
          }}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'urdu-tools' ? 'active' : ''}`}
        >
          <span>🌐</span> {t.tabUrduTools}
        </button>
        <button
          onClick={() => {
            if (isRibbonCollapsed) setIsRibbonCollapsed(false);
            setActiveTab('layout');
          }}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
        >
          <span>📐</span> {t.tabPageLayout}
        </button>
        <button
          onClick={() => {
            if (isRibbonCollapsed) setIsRibbonCollapsed(false);
            setActiveTab('collab');
          }}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'collab' ? 'active' : ''}`}
        >
          <span>👥</span> {t.tabCollab}
        </button>
        <button
          onClick={() => {
            if (isRibbonCollapsed) setIsRibbonCollapsed(false);
            setActiveTab('export');
          }}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
        >
          <span>📤</span> {t.tabExportView}
        </button>

        {/* Phase UX-4 Contextual Ribbon Tabs */}
        {(selectedObjectType === 'rectangle' || selectedObjectType === 'text-frame') && (
          <button
            onClick={() => {
              if (isRibbonCollapsed) setIsRibbonCollapsed(false);
              setActiveTab('shape-format');
            }}
            className={`ribbon-tab-btn highlight ${activeTab === 'shape-format' ? 'active' : ''}`}
          >
            <span>🎨</span> {lang === 'ur' ? 'شکل کی شکل (Shape Format)' : 'Shape Format'}
          </button>
        )}

        {selectedObjectType === 'image-frame' && (
          <button
            onClick={() => {
              if (isRibbonCollapsed) setIsRibbonCollapsed(false);
              setActiveTab('picture-format');
            }}
            className={`ribbon-tab-btn highlight ${activeTab === 'picture-format' ? 'active' : ''}`}
          >
            <span>🖼️</span> {lang === 'ur' ? 'تصویر فارمیٹ (Picture Format)' : 'Picture Format'}
          </button>
        )}

        {selectedObjectType === 'table' && (
          <button
            onClick={() => {
              if (isRibbonCollapsed) setIsRibbonCollapsed(false);
              setActiveTab('table-format');
            }}
            className={`ribbon-tab-btn highlight ${activeTab === 'table-format' ? 'active' : ''}`}
          >
            <span>📊</span> {lang === 'ur' ? 'جدول فارمیٹ (Table Design)' : 'Table Design'}
          </button>
        )}

        {/* Right-aligned Ribbon Minimize/Expand Arrow Toggle */}
        <button
          type="button"
          onClick={toggleCollapse}
          style={{
            marginLeft: 'auto',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            borderRadius: '4px',
          }}
          title={isRibbonCollapsed ? 'Expand Ribbon' : 'Minimize Ribbon'}
        >
          <span>{isRibbonCollapsed ? '▼ Expand Ribbon' : '▲ Minimize Ribbon'}</span>
        </button>
      </div>

      {/* Ribbon Tool Toolbar Body */}
      {!isRibbonCollapsed && (
        <div className="ribbon-toolbar-body">
        {/* Tab 0: FILE */}
        {activeTab === 'file' && (
          <div className="ribbon-group-row">
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="ribbon-action-btn highlight"
                >
                  <span>📂</span>
                  <span>{t.open}</span>
                </button>
                <button onClick={onSaveDocument} className="ribbon-action-btn primary">
                  <span>💾</span>
                  <span>{t.save}</span>
                </button>
                <button onClick={onSaveAsDocument} className="ribbon-action-btn gold">
                  <span>💾</span>
                  <span>{t.saveAs}</span>
                </button>
                <button onClick={onShowRecentFiles} className="ribbon-action-btn">
                  <span>📜</span>
                  <span>{t.recent}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.tabFile}</div>
            </div>
          </div>
        )}

        {/* Tab 1: HOME */}
        {activeTab === 'home' && (
          <div className="ribbon-group-row">
            {/* Group 1: Clipboard */}
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="ribbon-action-btn"
                  title={t.open}
                >
                  <span>📂</span>
                  <span>{t.open}</span>
                </button>
                <button onClick={onSaveDocument} className="ribbon-action-btn" title={t.save}>
                  <span>💾</span>
                  <span>{t.save}</span>
                </button>
                <button onClick={onSaveAsDocument} className="ribbon-action-btn gold" title={t.saveAs}>
                  <span>💾</span>
                  <span>{t.saveAs}</span>
                </button>
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
              <div className="ribbon-group-caption">{t.grpClipboard}</div>
            </div>

            {/* Group 2: Font */}
            <div className="ribbon-group-box">
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

                <button className="ribbon-action-btn sm-icon" title={t.bold}>
                  <b>B</b>
                </button>
                <button className="ribbon-action-btn sm-icon" title={t.italic}>
                  <i>I</i>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.grpFont}</div>
            </div>

            {/* Group 3: Paragraph */}
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
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

                <button
                  onClick={onToggleKashida}
                  className={`ribbon-action-btn ${isKashidaEnabled ? 'active' : ''}`}
                  title={t.kashida}
                >
                  <span>ـ</span>
                  <span>{t.kashida}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.grpParagraph}</div>
            </div>

            {/* Group 4: Tools */}
            <div className="ribbon-group-box">
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
              <div className="ribbon-group-caption">{t.grpTools}</div>
            </div>

            {/* Group 5: Styles & References */}
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  onClick={onOpenStylesManager}
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'اسٹائلز منیجر' : 'Styles Manager'}
                >
                  <span>🎨</span>
                  <span>{lang === 'ur' ? 'اسٹائلز' : 'Styles'}</span>
                </button>
                <button
                  onClick={onOpenDocStats}
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'دستاویز شماریات' : 'Document Statistics'}
                >
                  <span>📊</span>
                  <span>{lang === 'ur' ? 'شماریات' : 'Statistics'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'اسٹائل اور شماریات' : 'Styles & Stats'}</div>
            </div>
          </div>
        )}

        {/* Tab 2: INSERT */}
        {activeTab === 'insert' && (
          <div className="ribbon-group-row">
            <div className="ribbon-group-box">
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
              <div className="ribbon-group-caption">{t.grpPages}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  onClick={() => onSelectTool('text')}
                  className={`ribbon-action-btn ${activeTool === 'text' ? 'active' : ''}`}
                >
                  <span>📝</span>
                  <span>{t.textFrame}</span>
                </button>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    onClick={() => setShowShapeGallery((prev) => !prev)}
                    className={`ribbon-action-btn ${activeTool === 'rectangle' || showShapeGallery ? 'active' : ''}`}
                    title="Shapes Gallery"
                  >
                    <span>📐</span>
                    <span>{t.shape} ▾</span>
                  </button>

                  {showShapeGallery && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 9999,
                        width: '240px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        padding: '8px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                      }}
                    >
                      <button
                        title="Rectangle"
                        onClick={() => {
                          onInsertShape?.('rectangle');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ⏹️
                      </button>
                      <button
                        title="Rounded Rectangle"
                        onClick={() => {
                          onInsertShape?.('rounded-rectangle');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        🔲
                      </button>
                      <button
                        title="Oval / Circle"
                        onClick={() => {
                          onInsertShape?.('ellipse');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ⭕
                      </button>
                      <button
                        title="Triangle"
                        onClick={() => {
                          onInsertShape?.('triangle');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        🔺
                      </button>
                      <button
                        title="Diamond"
                        onClick={() => {
                          onInsertShape?.('diamond');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        💠
                      </button>
                      <button
                        title="Star"
                        onClick={() => {
                          onInsertShape?.('star');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ⭐
                      </button>
                      <button
                        title="Arrow Right"
                        onClick={() => {
                          onInsertShape?.('arrow-right');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ➡️
                      </button>
                      <button
                        title="Arrow Left"
                        onClick={() => {
                          onInsertShape?.('arrow-left');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ⬅️
                      </button>
                      <button
                        title="Arrow Up"
                        onClick={() => {
                          onInsertShape?.('arrow-up');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ⬆️
                      </button>
                      <button
                        title="Arrow Down"
                        onClick={() => {
                          onInsertShape?.('arrow-down');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ⬇️
                      </button>
                      <button
                        title="Hexagon"
                        onClick={() => {
                          onInsertShape?.('hexagon');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        🛑
                      </button>
                      <button
                        title="Speech Callout"
                        onClick={() => {
                          onInsertShape?.('callout');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        💬
                      </button>
                      <button
                        title="Line"
                        onClick={() => {
                          onInsertShape?.('line');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px', gridColumn: 'span 4' }}
                      >
                        ➖ Straight Line
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onSelectTool('image')}
                  className={`ribbon-action-btn ${activeTool === 'image' ? 'active' : ''}`}
                >
                  <span>🖼️</span>
                  <span>{t.imageFrame}</span>
                </button>
                <button
                  onClick={() => onInsertTable && onInsertTable()}
                  className="ribbon-action-btn primary"
                >
                  <span>📊</span>
                  <span>{lang === 'ur' ? 'جدول (Table)' : 'Table'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.grpIllustrations}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button onClick={onToggleSelectionPane} className="ribbon-action-btn highlight">
                  <span>📑</span>
                  <span>{lang === 'ur' ? 'انتخابی پینل' : 'Selection Pane'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'ترتیب' : 'Arrange'}</div>
            </div>

            {/* Group: References & Links */}
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  onClick={onInsertToc}
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'فہرست مضامین شامل کریں' : 'Insert Table of Contents'}
                >
                  <span>📚</span>
                  <span>{lang === 'ur' ? 'فہرست' : 'TOC'}</span>
                </button>
                <button
                  onClick={onAddFootnote}
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'حاشیہ شامل کریں' : 'Insert Footnote'}
                >
                  <span>¹</span>
                  <span>{lang === 'ur' ? 'حاشیہ' : 'Footnote'}</span>
                </button>
                <button
                  onClick={onInsertCaption}
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'عنوان (کیپشن) شامل کریں' : 'Insert Caption'}
                >
                  <span>🏷️</span>
                  <span>{lang === 'ur' ? 'کیپشن' : 'Caption'}</span>
                </button>
                <button
                  onClick={onInsertBookmark}
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'بک مارک شامل کریں' : 'Insert Bookmark'}
                >
                  <span>🔖</span>
                  <span>{lang === 'ur' ? 'بک مارک' : 'Bookmark'}</span>
                </button>
                <button
                  onClick={onInsertIndex}
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'اشاریہ (انڈیکس) شامل کریں' : 'Insert Index'}
                >
                  <span>📖</span>
                  <span>{lang === 'ur' ? 'اشاریہ' : 'Index'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'حوالہ جات' : 'References'}</div>
            </div>
          </div>
        )}

        {/* Phase UX-4 Contextual Tab 1: SHAPE FORMAT */}
        {activeTab === 'shape-format' && (
          <div className="ribbon-group-row">
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={() => onSetWrapping && onSetWrapping('inline')}
                  className="ribbon-action-btn"
                >
                  <span>🔤</span>
                  <span>{lang === 'ur' ? 'ان لائن (Inline)' : 'Inline'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetWrapping && onSetWrapping('square')}
                  className="ribbon-action-btn highlight"
                >
                  <span>🔳</span>
                  <span>{lang === 'ur' ? 'مربع (Square Wrap)' : 'Square Wrap'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetWrapping && onSetWrapping('top-bottom')}
                  className="ribbon-action-btn"
                >
                  <span>↕️</span>
                  <span>{lang === 'ur' ? 'اوپر نیچے (Top-Bottom)' : 'Top-Bottom'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'متن کی لپیٹ' : 'Text Wrapping'}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={() => onReorderObject && onReorderObject('front')}
                  className="ribbon-action-btn"
                >
                  <span>🔝</span>
                  <span>Bring to Front</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReorderObject && onReorderObject('forward')}
                  className="ribbon-action-btn"
                >
                  <span>▲</span>
                  <span>Bring Forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReorderObject && onReorderObject('backward')}
                  className="ribbon-action-btn"
                >
                  <span>▼</span>
                  <span>Send Backward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReorderObject && onReorderObject('back')}
                  className="ribbon-action-btn"
                >
                  <span>🔚</span>
                  <span>Send to Back</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'ترتیب (Arrange)' : 'Arrange Z-Order'}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={() => onAlignObjects && onAlignObjects('left')}
                  className="ribbon-action-btn"
                >
                  <span>├</span>
                  <span>Align Left</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAlignObjects && onAlignObjects('center')}
                  className="ribbon-action-btn"
                >
                  <span>┼</span>
                  <span>Align Center</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAlignObjects && onAlignObjects('right')}
                  className="ribbon-action-btn"
                >
                  <span>┤</span>
                  <span>Align Right</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'الائنمنٹ' : 'Alignment'}</div>
            </div>
          </div>
        )}

        {/* Phase UX-4 Contextual Tab 2: PICTURE FORMAT */}
        {activeTab === 'picture-format' && (
          <div className="ribbon-group-row">
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button type="button" className="ribbon-action-btn primary">
                  <span>✂️</span>
                  <span>{lang === 'ur' ? 'کراپ (Crop)' : 'Crop Picture'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'تصویر کاٹیں' : 'Crop & Size'}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={() => onSetWrapping && onSetWrapping('square')}
                  className="ribbon-action-btn highlight"
                >
                  <span>🔳</span>
                  <span>Square Wrap</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetWrapping && onSetWrapping('behind')}
                  className="ribbon-action-btn"
                >
                  <span>🔲</span>
                  <span>Behind Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetWrapping && onSetWrapping('in-front')}
                  className="ribbon-action-btn"
                >
                  <span>🖼️</span>
                  <span>In Front of Text</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'متن کی لپیٹ' : 'Text Wrapping'}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={() => onReorderObject && onReorderObject('forward')}
                  className="ribbon-action-btn"
                >
                  <span>▲</span>
                  <span>Bring Forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReorderObject && onReorderObject('backward')}
                  className="ribbon-action-btn"
                >
                  <span>▼</span>
                  <span>Send Backward</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'ترتیب' : 'Arrange'}</div>
            </div>
          </div>
        )}

        {/* Phase UX-4 Contextual Tab 3: TABLE FORMAT */}
        {activeTab === 'table-format' && (
          <div className="ribbon-group-row">
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button type="button" className="ribbon-action-btn primary">
                  <span>➕</span>
                  <span>{lang === 'ur' ? 'سطر شامل کریں' : 'Insert Row Below'}</span>
                </button>
                <button type="button" className="ribbon-action-btn primary">
                  <span>➕</span>
                  <span>{lang === 'ur' ? 'کالم شامل کریں' : 'Insert Column Right'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'جدول کی ترتیبات' : 'Rows & Columns'}</div>
            </div>
          </div>
        )}

        {/* Tab 3: URDU TOOLS */}
        {activeTab === 'urdu-tools' && (
          <div className="ribbon-group-row">
            <div className="ribbon-group-box">
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
              <div className="ribbon-group-caption">{t.grpProofing}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button onClick={onOpenCharacterSubstitution} className="ribbon-action-btn highlight" title="Correct Arabic Character Variants to Native Urdu">
                  <span>🔤</span>
                  <span>{lang === 'ur' ? 'حروف کی اصلاح' : 'Fix Characters'}</span>
                </button>
                <button onClick={onOpenKeyboardEditor} className="ribbon-action-btn" title="Custom Keyboard Layout Editor">
                  <span>⌨️</span>
                  <span>{lang === 'ur' ? 'کی بورڈ ایڈیٹر' : 'Keyboard Editor'}</span>
                </button>
                <button onClick={onOpenOcr} className="ribbon-action-btn sky">
                  <span>📷</span>
                  <span>{t.ocr}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.grpConversion}</div>
            </div>
          </div>
        )}

        {/* Tab 4: PAGE LAYOUT */}
        {/* Tab 4: PAGE LAYOUT */}
        {activeTab === 'layout' && (
          <div className="ribbon-group-row">
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={onToggleOrientation}
                  className="ribbon-action-btn"
                  title="Toggle Orientation (Portrait / Landscape)"
                >
                  <span>🔄</span>
                  <span>{lang === 'ur' ? 'رخ (Orientation)' : 'Orientation'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInsertSectionBreak && onInsertSectionBreak('next-page')}
                  className="ribbon-action-btn primary"
                  title="Insert Next Page Section Break"
                >
                  <span>📃</span>
                  <span>{lang === 'ur' ? 'نیا سیکشن (Next Page)' : 'Section Break'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInsertSectionBreak && onInsertSectionBreak('continuous')}
                  className="ribbon-action-btn"
                  title="Insert Continuous Section Break"
                >
                  <span>⚡</span>
                  <span>{lang === 'ur' ? 'جاری (Continuous)' : 'Continuous Break'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.grpPageSetup}</div>
            </div>
          </div>
        )}

        {/* Tab 5: COLLABORATION & REVIEW */}
        {activeTab === 'collab' && (
          <div className="ribbon-group-row">
            {/* Mode Switcher Group */}
            <div className="ribbon-group-box">
              <div className="ribbon-chunk" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                  {lang === 'ur' ? 'موڈ:' : 'Mode:'}
                </span>
                <select
                  value={editMode}
                  onChange={(e) => onEditModeChange && onEditModeChange(e.target.value as typeof editMode)}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <option value="editing">{lang === 'ur' ? '✏️ ایڈیٹنگ (Editing)' : '✏️ Editing'}</option>
                  <option value="reviewing">{lang === 'ur' ? '📝 ریویونگ (Reviewing)' : '📝 Reviewing'}</option>
                  <option value="viewing">{lang === 'ur' ? '👁️ ویونگ (Viewing)' : '👁️ Viewing'}</option>
                </select>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'موڈ منتقلی' : 'Editing Mode'}</div>
            </div>

            {/* Track Changes & Review Group */}
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={onToggleReviewingPane}
                  className={`ribbon-action-btn ${editMode === 'reviewing' ? 'highlight' : ''}`}
                  title="Open Reviewing Pane"
                >
                  <span>📝</span>
                  <span>{lang === 'ur' ? 'نظر ثانی پینل' : 'Reviewing Pane'}</span>
                </button>
                <button type="button" onClick={onOpenCompare} className="ribbon-action-btn" title="Compare Documents">
                  <span>⚖️</span>
                  <span>{lang === 'ur' ? 'موازنہ' : 'Compare'}</span>
                </button>
                <button type="button" onClick={onOpenVersionHistory} className="ribbon-action-btn" title="Version History">
                  <span>📜</span>
                  <span>{lang === 'ur' ? 'ورژن ہسٹری' : 'History'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'ٹریک تبدیلیاں' : 'Tracking & Compare'}</div>
            </div>

            {/* Live Session & Share Group */}
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button onClick={onOpenShare} className="ribbon-action-btn highlight">
                  <span>🔗</span>
                  <span>{lang === 'ur' ? 'شیئر کریں' : 'Share'}</span>
                </button>
                <button onClick={onToggleCollab} className="ribbon-action-btn sky">
                  <span>👥</span>
                  <span>{t.collabRoom}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.tabCollab}</div>
            </div>
          </div>
        )}

        {/* Tab 6: EXPORT & VIEW */}
        {activeTab === 'export' && (
          <div className="ribbon-group-row">
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={() => onViewModeChange && onViewModeChange('print')}
                  className={`ribbon-action-btn ${viewMode === 'print' ? 'highlight' : ''}`}
                >
                  <span>📄</span>
                  <span>{lang === 'ur' ? 'پرنٹ لے آؤٹ' : 'Print Layout'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange && onViewModeChange('web')}
                  className={`ribbon-action-btn ${viewMode === 'web' ? 'highlight' : ''}`}
                >
                  <span>🌐</span>
                  <span>{lang === 'ur' ? 'ویب لے آؤٹ' : 'Web View'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange && onViewModeChange('draft')}
                  className={`ribbon-action-btn ${viewMode === 'draft' ? 'highlight' : ''}`}
                >
                  <span>📝</span>
                  <span>{lang === 'ur' ? 'ڈرافٹ ویو' : 'Draft View'}</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleRulers}
                  className={`ribbon-action-btn ${showRulers ? 'primary' : ''}`}
                >
                  <span>📏</span>
                  <span>{lang === 'ur' ? 'رولر (Ruler)' : 'Toggle Ruler'}</span>
                </button>
                {onToggleInspector && (
                  <button
                    type="button"
                    onClick={onToggleInspector}
                    className={`ribbon-action-btn ${isInspectorOpen ? 'sky' : ''}`}
                    title="Toggle Right Properties Panel"
                  >
                    <span>⚙️</span>
                    <span>{lang === 'ur' ? 'خواص پینل' : 'Properties'}</span>
                  </button>
                )}
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'مناظر (Views)' : 'Views & Sidebars'}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={onToggleFocusMode}
                  className={`ribbon-action-btn ${isFocusMode ? 'highlight' : ''}`}
                  title="Focus Mode (Full Screen Distraction Free)"
                >
                  <span>🔍</span>
                  <span>{lang === 'ur' ? 'فوکس موڈ' : 'Focus Mode'}</span>
                </button>
                <button type="button" onClick={onToggleReadAloud} className="ribbon-action-btn highlight" title="Read Aloud Text Speech">
                  <span>🔊</span>
                  <span>{lang === 'ur' ? 'پڑھائی' : 'Read Aloud'}</span>
                </button>
                <button type="button" onClick={onOpenAccessibilityChecker} className="ribbon-action-btn" title="Accessibility Checker">
                  <span>♿</span>
                  <span>{lang === 'ur' ? 'رسائی چیکر' : 'Accessibility'}</span>
                </button>
                <button type="button" onClick={onOpenAccessibilitySettings} className="ribbon-action-btn" title="Display & Accessibility Settings">
                  <span>⚙️</span>
                  <span>{lang === 'ur' ? 'ڈسپلے ترتیبات' : 'UI Settings'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'رسائی اور فوکس' : 'Focus & Accessibility'}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button onClick={onExportPdf} className="ribbon-action-btn primary">
                  <span>📄</span>
                  <span>{t.exportPdf} (1200 DPI)</span>
                </button>
                <button onClick={onExportEpub} className="ribbon-action-btn gold">
                  <span>📚</span>
                  <span>{t.exportEpub}</span>
                </button>
                <button onClick={onRunPreflight} className="ribbon-action-btn">
                  <span>🔍</span>
                  <span>{t.preflight}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.tabExportView}</div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
