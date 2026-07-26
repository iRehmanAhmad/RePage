import React, { useState, useRef } from 'react';
import type { UiLanguage, Translations } from '../i18n/menuTranslation';
import type { ShapeKind, TextWrapMode, ViewMode } from '../../domain/document/types';
import type { TextAlignment, TextDirection } from '../../domain/rich-text/types';
import { FontColorPalette } from './FontColorPalette';
import { HighlightColorPalette } from './HighlightColorPalette';
import { ParagraphShadingPalette } from './ParagraphShadingPalette';
import { ParagraphBordersMenu } from './ParagraphBordersMenu';

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
  activeAlignment: TextAlignment;
  onAlignmentChange: (align: TextAlignment) => void;
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
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: (mode?: 'all' | 'special' | 'text-only' | 'merge') => void;
  onFormatPainter?: () => void;
  isFormatPainterActive?: boolean;
  isBold?: boolean;
  onToggleBold?: () => void;
  isItalic?: boolean;
  onToggleItalic?: () => void;
  isUnderline?: boolean;
  onToggleUnderline?: () => void;
  underlineStyle?: 'single' | 'double' | 'thick' | 'dotted' | 'dashed' | 'wave';
  onUnderlineStyleChange?: (style: 'single' | 'double' | 'thick' | 'dotted' | 'dashed' | 'wave') => void;
  underlineColor?: string;
  onUnderlineColorChange?: (color: string) => void;
  isStrikethrough?: boolean;
  onToggleStrikethrough?: () => void;
  isSubscript?: boolean;
  onToggleSubscript?: () => void;
  isSuperscript?: boolean;
  onToggleSuperscript?: () => void;
  highlightColor?: string | null;
  onHighlightColorChange?: (color: string | null) => void;
  fontColor?: string;
  onFontColorChange?: (color: string) => void;
  onChangeCase?: (mode: 'sentence' | 'lowercase' | 'uppercase' | 'capitalize' | 'toggle') => void;
  onClearFormatting?: () => void;
  onOpenFontDialog?: () => void;
  activeDirection?: TextDirection;
  onDirectionChange?: (dir: TextDirection) => void;
  isBulletList?: boolean;
  onToggleBulletList?: () => void;
  isOrderedList?: boolean;
  onToggleOrderedList?: () => void;
  onDecreaseIndent?: () => void;
  onIncreaseIndent?: () => void;
  onSortParagraphs?: () => void;
  showFormattingMarks?: boolean;
  onToggleFormattingMarks?: () => void;
  lineHeight?: number;
  onLineHeightChange?: (height: number) => void;
  paragraphShading?: string | null;
  onParagraphShadingChange?: (color: string | null) => void;
  onSelectParagraphBorder?: (side: 'bottom' | 'top' | 'left' | 'right' | 'box' | 'all' | 'none') => void;
  onOpenParagraphDialog?: () => void;
  activeStyleId?: string;
  onApplyStyle?: (styleId: string) => void;
  onOpenFind?: () => void;
  onOpenReplace?: () => void;
  onSelectAll?: () => void;
  onOpenAddins?: () => void;
}

export const MsWordRibbon: React.FC<MsWordRibbonProps> = ({
  t,
  lang,
  activeTool,
  onSelectTool,
  onUndo: _onUndo,
  onRedo: _onRedo,
  canUndo: _canUndo,
  canRedo: _canRedo,
  onOpenDocument,
  onSaveDocument,
  onSaveAsDocument,
  onShowRecentFiles,
  activeFontFamily,
  onFontFamilyChange,
  activeFontSize,
  onFontSizeChange,
  isKashidaEnabled: _isKashidaEnabled,
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
  onOpenDocStats: _onOpenDocStats,
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
  onCut,
  onCopy,
  onPaste,
  onFormatPainter,
  isFormatPainterActive = false,
  isBold = false,
  onToggleBold,
  isItalic = false,
  onToggleItalic,
  isUnderline = false,
  onToggleUnderline,
  underlineStyle: _underlineStyle = 'single',
  onUnderlineStyleChange,
  underlineColor: _underlineColor = '#000000',
  onUnderlineColorChange: _onUnderlineColorChange,
  isStrikethrough = false,
  onToggleStrikethrough,
  isSubscript = false,
  onToggleSubscript,
  isSuperscript = false,
  onToggleSuperscript,
  highlightColor = null,
  onHighlightColorChange,
  fontColor = '#172119',
  onFontColorChange,
  onChangeCase,
  onClearFormatting,
  onOpenFontDialog,
  activeDirection = 'rtl',
  onDirectionChange,
  isBulletList = false,
  onToggleBulletList,
  isOrderedList = false,
  onToggleOrderedList,
  onDecreaseIndent,
  onIncreaseIndent,
  onSortParagraphs,
  showFormattingMarks = false,
  onToggleFormattingMarks,
  lineHeight = 1.5,
  onLineHeightChange,
  paragraphShading = null,
  onParagraphShadingChange,
  onSelectParagraphBorder,
  onOpenParagraphDialog,
  activeStyleId = 'normal',
  onApplyStyle,
  onOpenFind,
  onOpenReplace,
  onSelectAll,
  onOpenAddins,
}) => {
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
  const [showShapeGallery, setShowShapeGallery] = useState(false);
  const [showPasteMenu, setShowPasteMenu] = useState(false);
  const [showUnderlineMenu, setShowUnderlineMenu] = useState(false);
  const [showCaseMenu, setShowCaseMenu] = useState(false);
  const [showFontColorPalette, setShowFontColorPalette] = useState(false);
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const [showJustifyMenu, setShowJustifyMenu] = useState(false);
  const [showLineSpacingMenu, setShowLineSpacingMenu] = useState(false);
  const [showParagraphShadingPalette, setShowParagraphShadingPalette] = useState(false);
  const [showParagraphBordersMenu, setShowParagraphBordersMenu] = useState(false);
  const [showSelectMenu, setShowSelectMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pasteMenuRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!showPasteMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pasteMenuRef.current && !pasteMenuRef.current.contains(e.target as Node)) {
        setShowPasteMenu(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showPasteMenu]);

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
            <div className="ribbon-group-box" style={{ justifyContent: 'center' }}>
              <div className="ribbon-chunk" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* MS Word 365 Paste Button with Dropdown Chevron */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <button
                    onClick={() => setShowPasteMenu((prev) => !prev)}
                    className="ribbon-action-btn"
                    title={`${t.paste} (${t.pasteSpecial})`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px 6px',
                      minWidth: '44px',
                      height: '38px',
                    }}
                  >
                    <span style={{ fontSize: '15px', lineHeight: 1 }}>📋</span>
                    <span style={{ fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', marginTop: '1px' }}>
                      {t.paste} <span style={{ fontSize: '7px' }}>▼</span>
                    </span>
                  </button>

                  {/* Theme-Aware Paste Options Dropdown Menu */}
                  {showPasteMenu && (
                    <div
                      ref={pasteMenuRef}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        zIndex: 9999,
                        backgroundColor: 'var(--panel-bg)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: '6px',
                        boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                        minWidth: '220px',
                        padding: '4px 0',
                      }}
                    >
                      <button
                        onClick={() => {
                          onPaste?.('all');
                          setShowPasteMenu(false);
                        }}
                        className="ribbon-menu-item"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'right', fontSize: '11px' }}
                      >
                        <span>📋</span>
                        <span>{t.paste} (Ctrl+V)</span>
                      </button>
                      <button
                        onClick={() => {
                          onPaste?.('special');
                          setShowPasteMenu(false);
                        }}
                        className="ribbon-menu-item"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'right', fontSize: '11px' }}
                      >
                        <span>✨</span>
                        <span>{t.pasteSpecial}</span>
                      </button>
                      <div style={{ height: '1px', backgroundColor: 'var(--panel-border)', margin: '4px 0' }} />
                      <button
                        onClick={() => {
                          onPaste?.('all');
                          setShowPasteMenu(false);
                        }}
                        className="ribbon-menu-item"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'right', fontSize: '11px' }}
                      >
                        <span>🎨</span>
                        <span>{t.keepSourceFormatting}</span>
                      </button>
                      <button
                        onClick={() => {
                          onPaste?.('merge');
                          setShowPasteMenu(false);
                        }}
                        className="ribbon-menu-item"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'right', fontSize: '11px' }}
                      >
                        <span>🔀</span>
                        <span>{t.mergeFormatting}</span>
                      </button>
                      <button
                        onClick={() => {
                          onPaste?.('text-only');
                          setShowPasteMenu(false);
                        }}
                        className="ribbon-menu-item"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'right', fontSize: '11px' }}
                      >
                        <span>📄</span>
                        <span>{t.keepTextOnly}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Stacked Cut, Copy, Format Painter Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <button
                    onClick={onCut}
                    className="ribbon-action-btn"
                    title={`${t.cut} (Ctrl+X)`}
                    style={{ padding: '1px 5px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 500, lineHeight: 1 }}
                  >
                    <span>✂️</span>
                    <span>{t.cut}</span>
                  </button>
                  <button
                    onClick={onCopy}
                    className="ribbon-action-btn"
                    title={`${t.copy} (Ctrl+C)`}
                    style={{ padding: '1px 5px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 500, lineHeight: 1 }}
                  >
                    <span>📄</span>
                    <span>{t.copy}</span>
                  </button>
                  <button
                    onClick={onFormatPainter}
                    className={`ribbon-action-btn ${isFormatPainterActive ? 'highlight' : ''}`}
                    title={t.formatPainter}
                    style={{ padding: '1px 5px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 500, lineHeight: 1 }}
                  >
                    <span>🖌️</span>
                    <span>{t.formatPainter}</span>
                  </button>
                </div>
              </div>
              <div className="ribbon-group-caption">{t.grpClipboard}</div>
            </div>

            {/* Group 2: Font */}
            <div className="ribbon-group-box" style={{ position: 'relative', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {/* Top Row: Family, Size, Grow A^, Shrink A_v, Change Case Aa, Clear Formatting A🧹 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <select
                    value={activeFontFamily}
                    onChange={(e) => onFontFamilyChange(e.target.value)}
                    className="ribbon-select"
                    title={t.fontFamily}
                    style={{ width: '130px', height: '22px', fontSize: '10px' }}
                  >
                    <option value="Noto Nastaliq Urdu">نستعلیق (Noto Nastaliq)</option>
                    <option value="Jameel Noori Nastaleeq">جمیل نوری نستعلیق</option>
                    <option value="Gulzar">گلزار (Gulzar)</option>
                    <option value="InPage Ali Nastaliq">انپیج علی نستعلیق</option>
                    <option value="InPage Lahori Nastaliq">انپیج لاہوری نستعلیق</option>
                    <option value="Aptos (Body)">Aptos (Body)</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                  </select>

                  <input
                    type="number"
                    value={activeFontSize}
                    onChange={(e) => onFontSizeChange(Number(e.target.value))}
                    className="ribbon-number-input"
                    min={8}
                    max={144}
                    title={t.fontSize}
                    style={{ width: '42px', height: '22px', fontSize: '10px', textAlign: 'center' }}
                  />

                  {/* Increase Font Size A^ */}
                  <button
                    onClick={() => {
                      const steps = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72, 144];
                      const next = steps.find((s) => s > activeFontSize) ?? Math.min(activeFontSize + 10, 144);
                      onFontSizeChange(next);
                    }}
                    className="ribbon-action-btn"
                    title="Increase Font Size (Ctrl+>)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    A<sup>^</sup>
                  </button>

                  {/* Decrease Font Size A_v */}
                  <button
                    onClick={() => {
                      const steps = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72, 144];
                      const prev = [...steps].reverse().find((s) => s < activeFontSize) ?? Math.max(activeFontSize - 2, 8);
                      onFontSizeChange(prev);
                    }}
                    className="ribbon-action-btn"
                    title="Decrease Font Size (Ctrl+<)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    A<sub>v</sub>
                  </button>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Change Case Aa ▼ Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowCaseMenu((prev) => !prev)}
                      className="ribbon-action-btn"
                      title="Change Case (Aa)"
                      style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <span>Aa</span>
                      <span style={{ fontSize: '7px' }}>▼</span>
                    </button>

                    {showCaseMenu && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          zIndex: 9999,
                          backgroundColor: 'var(--panel-bg)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '6px',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.5)',
                          minWidth: '160px',
                          padding: '4px 0',
                          fontSize: '11px',
                        }}
                      >
                        <button
                          onClick={() => { onChangeCase?.('sentence'); setShowCaseMenu(false); }}
                          className="ribbon-menu-item"
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                        >
                          Sentence case.
                        </button>
                        <button
                          onClick={() => { onChangeCase?.('lowercase'); setShowCaseMenu(false); }}
                          className="ribbon-menu-item"
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                        >
                          lowercase
                        </button>
                        <button
                          onClick={() => { onChangeCase?.('uppercase'); setShowCaseMenu(false); }}
                          className="ribbon-menu-item"
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                        >
                          UPPERCASE
                        </button>
                        <button
                          onClick={() => { onChangeCase?.('capitalize'); setShowCaseMenu(false); }}
                          className="ribbon-menu-item"
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                        >
                          Capitalize Each Word
                        </button>
                        <button
                          onClick={() => { onChangeCase?.('toggle'); setShowCaseMenu(false); }}
                          className="ribbon-menu-item"
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                        >
                          tOGGLE cASE
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Clear All Formatting A🧹 */}
                  <button
                    onClick={onClearFormatting}
                    className="ribbon-action-btn"
                    title="Clear All Formatting"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 600 }}
                  >
                    A🧹
                  </button>
                </div>

                {/* Bottom Row: B, I, U▼, ab, x₂, x², A▼ (Effects), 🖊️▼ (Highlight), A▼ (Color) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {/* Bold */}
                  <button
                    onClick={onToggleBold}
                    className={`ribbon-action-btn ${isBold ? 'active' : ''}`}
                    title="Bold (Ctrl+B)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    <b>B</b>
                  </button>

                  {/* Italic */}
                  <button
                    onClick={onToggleItalic}
                    className={`ribbon-action-btn ${isItalic ? 'active' : ''}`}
                    title="Italic (Ctrl+I)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontStyle: 'italic' }}
                  >
                    <i>I</i>
                  </button>

                  {/* Underline U ▼ Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowUnderlineMenu((prev) => !prev)}
                      className={`ribbon-action-btn ${isUnderline ? 'active' : ''}`}
                      title="Underline (Ctrl+U)"
                      style={{ padding: '1px 5px', fontSize: '10px', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <u>U</u>
                      <span style={{ fontSize: '7px' }}>▼</span>
                    </button>

                    {showUnderlineMenu && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          zIndex: 9999,
                          backgroundColor: 'var(--panel-bg)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '6px',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.5)',
                          minWidth: '150px',
                          padding: '4px 0',
                          fontSize: '11px',
                        }}
                      >
                        <button
                          onClick={() => { onToggleUnderline?.(); onUnderlineStyleChange?.('single'); setShowUnderlineMenu(false); }}
                          className="ribbon-menu-item"
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' }}
                        >
                          Single Line
                        </button>
                        <button
                          onClick={() => { onToggleUnderline?.(); onUnderlineStyleChange?.('double'); setShowUnderlineMenu(false); }}
                          className="ribbon-menu-item"
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left', textDecoration: 'underline double' }}
                        >
                          Double Line
                        </button>
                        <button
                          onClick={() => { onToggleUnderline?.(); onUnderlineStyleChange?.('wave'); setShowUnderlineMenu(false); }}
                          className="ribbon-menu-item"
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left', textDecoration: 'underline wavy' }}
                        >
                          Wave Line
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Strikethrough ab */}
                  <button
                    onClick={onToggleStrikethrough}
                    className={`ribbon-action-btn ${isStrikethrough ? 'active' : ''}`}
                    title="Strikethrough"
                    style={{ padding: '1px 5px', fontSize: '10px', textDecoration: 'line-through' }}
                  >
                    ab
                  </button>

                  {/* Subscript x₂ */}
                  <button
                    onClick={onToggleSubscript}
                    className={`ribbon-action-btn ${isSubscript ? 'active' : ''}`}
                    title="Subscript (Ctrl+=)"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    x<sub>2</sub>
                  </button>

                  {/* Superscript x² */}
                  <button
                    onClick={onToggleSuperscript}
                    className={`ribbon-action-btn ${isSuperscript ? 'active' : ''}`}
                    title="Superscript (Ctrl+Shift++)"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    x<sup>2</sup>
                  </button>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Text Effects A▼ */}
                  <button
                    className="ribbon-action-btn"
                    title="Text Effects & Typography"
                    style={{ padding: '1px 5px', fontSize: '10px', color: '#0284c7', fontWeight: 700 }}
                  >
                    A<span style={{ fontSize: '7px' }}>▼</span>
                  </button>

                  {/* Text Highlight Color 🖊️▼ Palette */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowHighlightPalette((prev) => !prev)}
                      className="ribbon-action-btn"
                      title="Text Highlight Color"
                      style={{ padding: '1px 5px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <span>🖊️</span>
                      <span style={{ fontSize: '7px' }}>▼</span>
                    </button>

                    {showHighlightPalette && (
                      <HighlightColorPalette
                        activeColor={highlightColor || undefined}
                        onSelectColor={(col) => onHighlightColorChange?.(col)}
                        onClose={() => setShowHighlightPalette(false)}
                      />
                    )}
                  </div>

                  {/* Font Color A▼ Palette */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowFontColorPalette((prev) => !prev)}
                      className="ribbon-action-btn"
                      title="Font Color"
                      style={{ padding: '1px 4px', fontSize: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '10px' }}>A</span>
                      <div style={{ width: '12px', height: '3px', backgroundColor: fontColor, borderRadius: '1px' }} />
                    </button>

                    {showFontColorPalette && (
                      <FontColorPalette
                        activeColor={fontColor}
                        onSelectColor={(col) => onFontColorChange?.(col)}
                        onClose={() => setShowFontColorPalette(false)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Right Corner Launcher Button ↗️ */}
              <button
                onClick={onOpenFontDialog}
                title="Font Dialog (Ctrl+D)"
                style={{
                  position: 'absolute',
                  right: '2px',
                  bottom: '0px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '8px',
                  color: 'var(--text-muted)',
                  padding: '0px',
                }}
              >
                ↗️
              </button>

              <div className="ribbon-group-caption">{t.grpFont}</div>
            </div>

            {/* Group 3: Paragraph */}
            <div className="ribbon-group-box" style={{ position: 'relative', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {/* Top Row: Bullets, Numbering, Multilevel, Indents, Directions, Sort, Show/Hide Marks */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {/* Bullets •= ▼ */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={onToggleBulletList}
                      className={`ribbon-action-btn ${isBulletList ? 'active' : ''}`}
                      title="Bullets"
                      style={{ padding: '1px 5px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <span>•=</span>
                      <span style={{ fontSize: '7px' }}>▼</span>
                    </button>
                  </div>

                  {/* Numbering 1 2 3 = ▼ */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={onToggleOrderedList}
                      className={`ribbon-action-btn ${isOrderedList ? 'active' : ''}`}
                      title="Numbering"
                      style={{ padding: '1px 5px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <span>1≡</span>
                      <span style={{ fontSize: '7px' }}>▼</span>
                    </button>
                  </div>

                  {/* Multilevel List 1 a i = ▼ */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={onToggleOrderedList}
                      className="ribbon-action-btn"
                      title="Multilevel List"
                      style={{ padding: '1px 5px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <span>1a-</span>
                      <span style={{ fontSize: '7px' }}>▼</span>
                    </button>
                  </div>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Decrease Indent ⬅≡ */}
                  <button
                    onClick={onDecreaseIndent}
                    className="ribbon-action-btn"
                    title="Decrease Indent"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    ⬅≡
                  </button>

                  {/* Increase Indent ≡➡️ */}
                  <button
                    onClick={onIncreaseIndent}
                    className="ribbon-action-btn"
                    title="Increase Indent"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    ≡➡️
                  </button>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Left-to-Right Direction >¶ */}
                  <button
                    onClick={() => onDirectionChange?.('ltr')}
                    className={`ribbon-action-btn ${activeDirection === 'ltr' ? 'active' : ''}`}
                    title="Left-to-Right Text Direction"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    &gt;¶
                  </button>

                  {/* Right-to-Left Direction ¶< */}
                  <button
                    onClick={() => onDirectionChange?.('rtl')}
                    className={`ribbon-action-btn ${activeDirection === 'rtl' ? 'active' : ''}`}
                    title="Right-to-Left Text Direction (Urdu)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    ¶&lt;
                  </button>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Sort A-Z ↓ */}
                  <button
                    onClick={onSortParagraphs}
                    className="ribbon-action-btn"
                    title="Sort Paragraphs or Text"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    A-Z↓
                  </button>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Show/Hide Formatting Marks ¶ */}
                  <button
                    onClick={onToggleFormattingMarks}
                    className={`ribbon-action-btn ${showFormattingMarks ? 'active' : ''}`}
                    title="Show/Hide Non-Printing Formatting Marks (Ctrl+*)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    ¶
                  </button>
                </div>

                {/* Bottom Row: Align Left, Center, Right, Justify, Line Spacing, Shading, Borders */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {/* Align Left */}
                  <button
                    onClick={() => onAlignmentChange?.('left')}
                    className={`ribbon-action-btn ${activeAlignment === 'left' ? 'active' : ''}`}
                    title="Align Left (Ctrl+L)"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    ≡
                  </button>

                  {/* Align Center */}
                  <button
                    onClick={() => onAlignmentChange?.('center')}
                    className={`ribbon-action-btn ${activeAlignment === 'center' ? 'active' : ''}`}
                    title="Center (Ctrl+E)"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    ≡
                  </button>

                  {/* Align Right */}
                  <button
                    onClick={() => onAlignmentChange?.('right')}
                    className={`ribbon-action-btn ${activeAlignment === 'right' || activeAlignment === 'start' ? 'active' : ''}`}
                    title="Align Right (Ctrl+R)"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    ≡
                  </button>

                  {/* Justify ≡ ▼ Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowJustifyMenu((prev) => !prev)}
                      className={`ribbon-action-btn ${activeAlignment === 'justify' ? 'active' : ''}`}
                      title="Justify (Ctrl+J)"
                      style={{ padding: '1px 5px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <span>≡</span>
                      <span style={{ fontSize: '7px' }}>▼</span>
                    </button>

                    {showJustifyMenu && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          zIndex: 9999,
                          backgroundColor: 'var(--panel-bg)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '6px',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.5)',
                          minWidth: '150px',
                          padding: '4px 0',
                          fontSize: '11px',
                        }}
                      >
                        <button
                          onClick={() => { onAlignmentChange?.('justify'); setShowJustifyMenu(false); }}
                          className="ribbon-menu-item"
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                        >
                          Justify
                        </button>
                        <button
                          onClick={() => { onAlignmentChange?.('justify'); onToggleKashida?.(); setShowJustifyMenu(false); }}
                          className="ribbon-menu-item"
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                        >
                          Urdu Kashida Justify (کشیدہ)
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Line & Paragraph Spacing ↕≡ ▼ Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowLineSpacingMenu((prev) => !prev)}
                      className="ribbon-action-btn"
                      title="Line and Paragraph Spacing"
                      style={{ padding: '1px 5px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <span>↕≡</span>
                      <span style={{ fontSize: '7px' }}>▼</span>
                    </button>

                    {showLineSpacingMenu && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          zIndex: 9999,
                          backgroundColor: 'var(--panel-bg)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '6px',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.5)',
                          minWidth: '170px',
                          padding: '4px 0',
                          fontSize: '11px',
                        }}
                      >
                        {[1.0, 1.15, 1.5, 2.0, 2.5, 3.0].map((lh) => (
                          <button
                            key={lh}
                            onClick={() => { onLineHeightChange?.(lh); setShowLineSpacingMenu(false); }}
                            className="ribbon-menu-item"
                            style={{
                              width: '100%',
                              padding: '5px 12px',
                              border: 'none',
                              background: lineHeight === lh ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                              color: lineHeight === lh ? 'var(--emerald-accent)' : 'var(--text-main)',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            {lh.toFixed(2)}
                          </button>
                        ))}
                        <div style={{ height: '1px', backgroundColor: 'var(--panel-border)', margin: '4px 0' }} />
                        <button
                          onClick={() => { onOpenParagraphDialog?.(); setShowLineSpacingMenu(false); }}
                          className="ribbon-menu-item"
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                        >
                          Line Spacing Options...
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Shading / Background Color 🪣 ▼ */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowParagraphShadingPalette((prev) => !prev)}
                      className="ribbon-action-btn"
                      title="Paragraph Shading / Background Color"
                      style={{ padding: '1px 5px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <span>🪣</span>
                      <span style={{ fontSize: '7px' }}>▼</span>
                    </button>

                    {showParagraphShadingPalette && (
                      <ParagraphShadingPalette
                        activeColor={paragraphShading || undefined}
                        onSelectColor={(col) => onParagraphShadingChange?.(col)}
                        onClose={() => setShowParagraphShadingPalette(false)}
                      />
                    )}
                  </div>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Borders 🔲 ▼ Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowParagraphBordersMenu((prev) => !prev)}
                      className="ribbon-action-btn"
                      title="Borders"
                      style={{ padding: '1px 5px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <span>🔲</span>
                      <span style={{ fontSize: '7px' }}>▼</span>
                    </button>

                    {showParagraphBordersMenu && (
                      <ParagraphBordersMenu
                        onSelectBorder={(side) => onSelectParagraphBorder?.(side)}
                        onClose={() => setShowParagraphBordersMenu(false)}
                        onOpenBorderDialog={onOpenParagraphDialog}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Right Corner Launcher Button ↘️ */}
              <button
                onClick={onOpenParagraphDialog}
                title="Paragraph Dialog"
                style={{
                  position: 'absolute',
                  right: '2px',
                  bottom: '0px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '8px',
                  color: 'var(--text-muted)',
                  padding: '0px',
                }}
              >
                ↘️
              </button>

              <div className="ribbon-group-caption">{t.grpParagraph}</div>
            </div>

            {/* Group 4: Styles */}
            <div className="ribbon-group-box" style={{ position: 'relative', minWidth: '320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '4px', overflowX: 'hidden', padding: '2px 0' }}>
                  {[
                    { id: 'normal', name: 'Normal', preview: 'AaBbCc', tag: '¶ Normal' },
                    { id: 'no-spacing', name: 'No Spac...', preview: 'AaBbCc', tag: '¶ No Spac...' },
                    { id: 'heading-1', name: 'Heading 1', preview: 'AaBb', tag: 'Heading 1' },
                    { id: 'heading-2', name: 'Heading 2', preview: 'AaBb', tag: 'Heading 2' },
                    { id: 'title', name: 'Title', preview: 'AaBb', tag: 'Title' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => onApplyStyle?.(st.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '56px',
                        height: '34px',
                        border: activeStyleId === st.id ? '2px solid var(--emerald-accent)' : '1px solid var(--panel-border)',
                        borderRadius: '4px',
                        backgroundColor: activeStyleId === st.id ? 'rgba(16, 185, 129, 0.1)' : '#ffffff',
                        color: '#172119',
                        cursor: 'pointer',
                        padding: '1px 2px',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '10px', lineHeight: 1, fontWeight: st.id.includes('heading') || st.id === 'title' ? 700 : 400, color: st.id.includes('heading') ? '#0284c7' : '#172119' }}>
                        {st.preview}
                      </span>
                      <span style={{ fontSize: '8px', lineHeight: 1, color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '52px' }}>
                        {st.tag}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Quick Scroll & Launcher */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <button onClick={onOpenStylesManager} className="ribbon-action-btn" title="Scroll Up" style={{ padding: '1px 4px', fontSize: '8px' }}>▲</button>
                  <button onClick={onOpenStylesManager} className="ribbon-action-btn" title="Scroll Down" style={{ padding: '1px 4px', fontSize: '8px' }}>▼</button>
                  <button onClick={onOpenStylesManager} className="ribbon-action-btn" title="More Styles" style={{ padding: '1px 4px', fontSize: '8px' }}>▼</button>
                </div>
              </div>

              {/* Styles Dialog Launcher Button ↘️ */}
              <button
                onClick={onOpenStylesManager}
                title="Styles Dialog"
                style={{
                  position: 'absolute',
                  right: '2px',
                  bottom: '0px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '8px',
                  color: 'var(--text-muted)',
                  padding: '0px',
                }}
              >
                ↘️
              </button>

              <div className="ribbon-group-caption">{lang === 'ur' ? 'اسٹائلز' : 'Styles'}</div>
            </div>

            {/* Group 5: Editing */}
            <div className="ribbon-group-box">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <button
                  onClick={onOpenFind}
                  className="ribbon-action-btn"
                  title="Find (Ctrl+F)"
                  style={{ padding: '1px 4px', height: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                >
                  <span style={{ fontSize: '9px' }}>🔍</span>
                  <span>{lang === 'ur' ? 'تلاش' : 'Find'}</span>
                  <span style={{ fontSize: '6px' }}>▼</span>
                </button>

                <button
                  onClick={onOpenReplace}
                  className="ribbon-action-btn"
                  title="Replace (Ctrl+H)"
                  style={{ padding: '1px 4px', height: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                >
                  <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '9px' }}>c🔁b</span>
                  <span>{lang === 'ur' ? 'تبدیل' : 'Replace'}</span>
                </button>

                {/* Select Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowSelectMenu((prev) => !prev)}
                    className="ribbon-action-btn"
                    title="Select"
                    style={{ padding: '1px 4px', height: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', width: '100%' }}
                  >
                    <span style={{ fontSize: '9px' }}>↖️</span>
                    <span>{lang === 'ur' ? 'انتخاب' : 'Select'}</span>
                    <span style={{ fontSize: '6px' }}>▼</span>
                  </button>

                  {showSelectMenu && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 2px)',
                        left: 0,
                        zIndex: 9999,
                        backgroundColor: 'var(--panel-bg)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: '6px',
                        boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.5)',
                        minWidth: '160px',
                        padding: '4px 0',
                        fontSize: '11px',
                      }}
                    >
                      <button
                        onClick={() => { onSelectAll?.(); setShowSelectMenu(false); }}
                        className="ribbon-menu-item"
                        style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                      >
                        Select All (Ctrl+A)
                      </button>
                      <button
                        onClick={() => { onSelectTool('select'); setShowSelectMenu(false); }}
                        className="ribbon-menu-item"
                        style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                      >
                        Select Objects
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'تدوین' : 'Editing'}</div>
            </div>

            {/* Group 6: Add-ins */}
            <div className="ribbon-group-box">
              <div className="ribbon-chunk" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '36px' }}>
                <button
                  onClick={onOpenAddins}
                  className="ribbon-action-btn"
                  title="Add-ins & Extensions"
                  style={{ padding: '2px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '10px' }}
                >
                  <span style={{ fontSize: '14px', color: '#ea580c' }}>▦</span>
                  <span>{lang === 'ur' ? 'ایڈ انز' : 'Add-ins'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'ایڈ انز' : 'Add-ins'}</div>
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

            {/* Moved Tools: Illustrations & Text Boxes */}
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
