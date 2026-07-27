import React, { useState, useRef } from 'react';
import type { UiLanguage, Translations } from '../i18n/menuTranslation';
import type { ShapeKind, TextWrapMode, ViewMode } from '../../domain/document/types';
import type { TextAlignment, TextDirection } from '../../domain/rich-text/types';
import { BUNDLED_URDU_FONTS, UNAVAILABLE_INPAGE_FONTS, URDU_FONTS_LIST, WINDOWS_STANDARD_FONTS } from '../../domain/unicode/fontRegistry';
import type { KeyboardMode } from '../../domain/unicode/keyboardLayouts';
import { FontColorPalette } from './FontColorPalette';
import { AppIcon } from '../icons/AppIcon';
import { HighlightColorPalette } from './HighlightColorPalette';

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
  onOpenLanguageTools: (tab?: 'spelling' | 'proofread' | 'transliteration' | 'normalization' | 'character-fix') => void;
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
  onSetOrientation?: (orientation: 'portrait' | 'landscape') => void;
  onInsertSectionBreak?: (type: 'next-page' | 'continuous') => void;
  onOpenPageSetupModal?: () => void;
  onOpenHeaderFooterModal?: () => void;
  onOpenExportDialog?: () => void;
  onApplySizePreset?: (preset: 'a4' | 'a5' | 'a3' | 'letter' | 'legal' | 'book6x9') => void;
  onApplyMarginPreset?: (preset: 'normal' | 'narrow' | 'moderate' | 'wide' | 'mirrored') => void;
  onApplyColumns?: (count: 1 | 2 | 3 | 4) => void;
  showRulers?: boolean;
  onToggleRulers?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  selectedObjectType?: 'text-frame' | 'rectangle' | 'image-frame' | 'table' | null;
  onReorderObject?: (action: 'forward' | 'backward' | 'front' | 'back') => void;
  onAlignObjects?: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onSetWrapping?: (wrapMode: TextWrapMode) => void;
  onToggleSelectionPane?: () => void;
  onInsertTable?: (rows?: number, cols?: number) => void;
  onInsertTableRowAbove?: () => void;
  onInsertTableRowBelow?: () => void;
  onInsertTableColLeft?: () => void;
  onInsertTableColRight?: () => void;
  onDeleteTableRow?: () => void;
  onDeleteTableCol?: () => void;
  onDeleteTable?: () => void;
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
  keyboardMode?: KeyboardMode;
  onKeyboardModeChange?: (mode: KeyboardMode) => void;
  isTransliterationEnabled?: boolean;
  onToggleTransliteration?: () => void;
  showVisualKeyboard?: boolean;
  onToggleVisualKeyboard?: () => void;
  numeralSystem?: 'urdu' | 'western';
  onNumeralSystemChange?: (sys: 'urdu' | 'western') => void;
  onApplyQuickUrduPreset?: () => void;
  onOpenSelectionPane?: () => void;
  detectedScript?: 'urdu' | 'latin';
  activeUrduFont?: string;
  onUrduFontChange?: (font: string) => void;
  recentUrduFonts?: string[];
  activeEnglishFont?: string;
  onEnglishFontChange?: (font: string) => void;
  recentEnglishFonts?: string[];
}

export const MsWordRibbon: React.FC<MsWordRibbonProps & { activeTab?: RibbonTab; onTabChange?: (tab: RibbonTab) => void }> = ({
  t,
  lang,
  activeTab: controlledActiveTab,
  onTabChange,
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
  activeFontFamily: _activeFontFamily,
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
  onExportEpub: _onExportEpub,
  onRunPreflight,
  onToggleCollab,
  onOpenFileBackstage,
  onToggleNavigationPane: _onToggleNavigationPane,
  viewMode = 'print',
  onViewModeChange,
  onToggleOrientation: _onToggleOrientation,
  onSetOrientation,
  onInsertSectionBreak,
  onOpenPageSetupModal,
  onOpenHeaderFooterModal,
  onOpenExportDialog,
  onApplySizePreset,
  onApplyMarginPreset,
  onApplyColumns,
  showRulers = false,
  onToggleRulers,
  showGrid = false,
  onToggleGrid,
  selectedObjectType,
  onReorderObject,
  onAlignObjects,
  onSetWrapping,
  onToggleSelectionPane,
  onInsertTable,
  onInsertTableRowAbove,
  onInsertTableRowBelow,
  onInsertTableColLeft,
  onInsertTableColRight,
  onDeleteTableRow,
  onDeleteTableCol,
  onDeleteTable,
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
  onFormatPainter: _onFormatPainter,
  isFormatPainterActive: _isFormatPainterActive = false,
  isBold = false,
  onToggleBold,
  isItalic = false,
  onToggleItalic,
  isUnderline = false,
  onToggleUnderline,
  underlineStyle: _underlineStyle = 'single',
  onUnderlineStyleChange: _onUnderlineStyleChange,
  underlineColor: _underlineColor = '#000000',
  onUnderlineColorChange: _onUnderlineColorChange,
  isStrikethrough: _isStrikethrough = false,
  onToggleStrikethrough: _onToggleStrikethrough,
  isSubscript: _isSubscript = false,
  onToggleSubscript: _onToggleSubscript,
  isSuperscript: _isSuperscript = false,
  onToggleSuperscript: _onToggleSuperscript,
  highlightColor = null,
  onHighlightColorChange,
  fontColor = '#172119',
  onFontColorChange,
  onChangeCase: _onChangeCase,
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
  onSortParagraphs: _onSortParagraphs,
  showFormattingMarks = false,
  onToggleFormattingMarks,
  lineHeight = 1.5,
  onLineHeightChange,
  paragraphShading: _paragraphShading = null,
  onParagraphShadingChange: _onParagraphShadingChange,
  onSelectParagraphBorder: _onSelectParagraphBorder,
  onOpenParagraphDialog,
  activeStyleId = 'normal',
  onApplyStyle,
  onOpenFind,
  onOpenReplace,
  onSelectAll,
  onOpenAddins: _onOpenAddins,
  keyboardMode = 'crulp',
  onKeyboardModeChange,
  isTransliterationEnabled = false,
  onToggleTransliteration,
  showVisualKeyboard = false,
  onToggleVisualKeyboard,
  numeralSystem = 'urdu',
  onNumeralSystemChange,
  onApplyQuickUrduPreset,
  onOpenSelectionPane,
  detectedScript = 'urdu',
  activeUrduFont = 'Noto Nastaliq Urdu',
  onUrduFontChange,
  recentUrduFonts = ['Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq'],
  activeEnglishFont = 'Calibri',
  onEnglishFontChange,
  recentEnglishFonts = ['Calibri', 'Aptos', 'Arial'],
}) => {
  const [activeTab, setActiveTab] = useState<RibbonTab>(controlledActiveTab || 'home');

  React.useEffect(() => {
    if (controlledActiveTab) {
      setActiveTab(controlledActiveTab);
    }
  }, [controlledActiveTab]);
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
  const [showShapeGallery, setShowShapeGallery] = useState(false);
  const [showPasteMenu, setShowPasteMenu] = useState(false);
  const [showFontColorPalette, setShowFontColorPalette] = useState(false);
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const [showJustifyMenu, setShowJustifyMenu] = useState(false);
  const [showLineSpacingMenu, setShowLineSpacingMenu] = useState(false);
  const [showSelectMenu, setShowSelectMenu] = useState(false);
  const [showTableGridPicker, setShowTableGridPicker] = useState(false);
  const [tableHoverRows, setTableHoverRows] = useState(3);
  const [tableHoverCols, setTableHoverCols] = useState(3);
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

  const handleTabSelect = (tab: RibbonTab) => {
    if (isRibbonCollapsed) setIsRibbonCollapsed(false);
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

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
          <AppIcon name="file" size={16} /> {t.tabFile}
        </button>

        <button
          onClick={() => handleTabSelect('home')}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
        >
          <AppIcon name="home" size={16} /> {t.tabHome}
        </button>
        <button
          onClick={() => handleTabSelect('insert')}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'insert' ? 'active' : ''}`}
        >
          <AppIcon name="add" size={16} /> {t.tabInsert}
        </button>
        <button
          onClick={() => handleTabSelect('urdu-tools')}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'urdu-tools' ? 'active' : ''}`}
        >
          <AppIcon name="language" size={16} /> {t.tabUrduTools}
        </button>
        <button
          onClick={() => handleTabSelect('layout')}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
        >
          <AppIcon name="page-layout" size={16} /> {t.tabPageLayout}
        </button>
        <button
          onClick={() => {
            if (isRibbonCollapsed) setIsRibbonCollapsed(false);
            setActiveTab('collab');
          }}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'collab' ? 'active' : ''}`}
        >
          <AppIcon name="people" size={16} /> {t.tabCollab}
        </button>
        <button
          onClick={() => {
            if (isRibbonCollapsed) setIsRibbonCollapsed(false);
            setActiveTab('export');
          }}
          onDoubleClick={toggleCollapse}
          className={`ribbon-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
        >
          <AppIcon name="export" size={16} /> {t.tabExportView}
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
            <AppIcon name="paint" size={16} /> {lang === 'ur' ? 'شکل کی شکل (Shape Format)' : 'Shape Format'}
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
            <AppIcon name="image" size={16} /> {lang === 'ur' ? 'تصویر فارمیٹ (Picture Format)' : 'Picture Format'}
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
            <AppIcon name="table" size={16} /> {lang === 'ur' ? 'جدول فارمیٹ (Table Design)' : 'Table Design'}
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
          <AppIcon name={isRibbonCollapsed ? 'chevron-down' : 'chevron-up'} size={14} />
          <span>{isRibbonCollapsed ? 'Expand Ribbon' : 'Minimize Ribbon'}</span>
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
                  <AppIcon name="folder-open" />
                  <span>{t.open}</span>
                </button>
                <button onClick={onSaveDocument} className="ribbon-action-btn primary">
                  <AppIcon name="save" />
                  <span>{t.save}</span>
                </button>
                <button onClick={onSaveAsDocument} className="ribbon-action-btn gold">
                  <AppIcon name="save" />
                  <span>{t.saveAs}</span>
                </button>
                <button onClick={onShowRecentFiles} className="ribbon-action-btn">
                  <AppIcon name="history" />
                  <span>{t.recent}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.tabFile}</div>
            </div>
          </div>
        )}

        {/* Tab 1: HOME */}
        {activeTab === 'home' && (
          <div className="ribbon-group-row" style={{ direction: lang === 'ur' ? 'rtl' : 'ltr' }}>
            {/* Group 1: Urdu Input */}
            <div className="ribbon-group-box ribbon-urdu-input-group" style={{ justifyContent: 'center' }}>
              <div className="ribbon-urdu-input-stack">
                <div className="ribbon-input-mode-row">
                  <select
                    value={keyboardMode}
                    onChange={(e) => onKeyboardModeChange?.(e.target.value as KeyboardMode)}
                    className="ribbon-select ribbon-input-mode-select"
                    title={lang === 'ur' ? 'اردو کی بورڈ کا انتخاب' : 'Urdu Keyboard Mode'}
                    style={{}}
                  >
                    <option value="crulp">CRULP</option>
                    <option value="navees">Navees</option>
                    <option value="native">Native (OS)</option>
                    <option value="english">English</option>
                  </select>

                  <button
                    onClick={onToggleTransliteration}
                    className={`ribbon-action-btn ribbon-input-transliteration ${isTransliterationEnabled ? 'active' : ''}`}
                    title={lang === 'ur' ? 'رومن اردو سے ترجمہ' : 'Roman Urdu Transliteration'}
                    style={{}}
                  >
                    <AppIcon name="language" size={14} />
                    <span>{lang === 'ur' ? 'رومن' : 'Roman'}</span>
                  </button>
                </div>

                <div className="ribbon-input-tools-row">
                  <button
                    onClick={onToggleVisualKeyboard}
                    className={`ribbon-action-btn ribbon-input-tool ${showVisualKeyboard ? 'active' : ''}`}
                    title={lang === 'ur' ? 'آن اسکرین کی بورڈ' : 'Visual Keyboard'}
                    style={{}}
                  >
                    <AppIcon name="keyboard" size={16} />
                    <span>{lang === 'ur' ? 'کی بورڈ' : 'Keyboard'}</span>
                  </button>

                  <button
                    onClick={() => onNumeralSystemChange?.(numeralSystem === 'urdu' ? 'western' : 'urdu')}
                    className="ribbon-action-btn ribbon-input-tool"
                    title={lang === 'ur' ? 'اعدادی نظام (اردو/مغربی)' : 'Urdu vs Western Numerals'}
                    style={{}}
                  >
                    <><span>{numeralSystem === 'urdu' ? '۱۲۳' : '123'}</span><span>{lang === 'ur' ? 'اعداد' : 'Numbers'}</span></>
                  </button>

                  <button
                    onClick={onApplyQuickUrduPreset}
                    className="ribbon-action-btn ribbon-input-tool highlight"
                    title={lang === 'ur' ? 'اردو پیراگراف کی فوری ترتیبات' : 'Quick Urdu Paragraph Preset'}
                    style={{}}
                  >
                    <AppIcon name="target" size={16} />
                    <span>{lang === 'ur' ? 'فوری پیرا' : 'Preset'}</span>
                  </button>
                </div>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'اردو ان پٹ' : 'Urdu Input'}</div>
            </div>

            {/* Group 2: Clipboard */}
            <div className="ribbon-group-box" style={{ justifyContent: 'center' }}>
              <div className="ribbon-chunk" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* Paste Button with Dropdown Chevron */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <button
                    onClick={() => setShowPasteMenu((prev) => !prev)}
                    className="ribbon-action-btn"
                    title={t.paste}
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
                    <AppIcon name="paste" size={18} />
                    <span style={{ fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', marginTop: '1px' }}>
                      {t.paste} <AppIcon name="chevron-down" size={10} />
                    </span>
                  </button>

                  {/* Clean Paste Options Dropdown Menu */}
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
                        minWidth: '180px',
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
                        <AppIcon name="paste" />
                        <span>{t.paste} (Ctrl+V)</span>
                      </button>
                      <button
                        onClick={() => {
                          onPaste?.('text-only');
                          setShowPasteMenu(false);
                        }}
                        className="ribbon-menu-item"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'right', fontSize: '11px' }}
                      >
                        <AppIcon name="document-text" />
                        <span>{t.keepTextOnly} (Ctrl+Shift+V)</span>
                      </button>
                      <div style={{ height: '1px', backgroundColor: 'var(--panel-border)', margin: '4px 0' }} />
                      <button
                        onClick={() => {
                          onOpenCharacterSubstitution?.();
                          setShowPasteMenu(false);
                        }}
                        className="ribbon-menu-item"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'right', fontSize: '11px' }}
                      >
                        <AppIcon name="language" />
                        <span>{lang === 'ur' ? 'عربی/اردو حروف اصلاح...' : 'Inspect Character Variants...'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Stacked Cut & Copy Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    onClick={onCut}
                    className="ribbon-action-btn"
                    title={`${t.cut} (Ctrl+X)`}
                    style={{ padding: '2px 6px', fontSize: '10px', height: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <AppIcon name="cut" />
                  </button>
                  <button
                    onClick={onCopy}
                    className="ribbon-action-btn"
                    title={`${t.copy} (Ctrl+C)`}
                    style={{ padding: '2px 6px', fontSize: '10px', height: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <AppIcon name="copy" />
                  </button>
                </div>
              </div>
              <div className="ribbon-group-caption">{t.grpClipboard}</div>
            </div>

            {/* Group 2: Font */}
            <div className="ribbon-group-box ribbon-font-group" style={{ position: 'relative', justifyContent: 'center' }}>
              <div className="ribbon-font-stack">
                {/* Top Row: Family, Size, Grow A^, Shrink A_v, Clear Formatting A🧹 */}
                <div className="ribbon-font-row">
                  {/* Urdu Font Selector with Recent Urdu Fonts Track */}
                  <select
                    value={activeUrduFont}
                    onChange={(e) => {
                      if (onUrduFontChange) onUrduFontChange(e.target.value);
                      else onFontFamilyChange(e.target.value);
                    }}
                    className="ribbon-select ribbon-font-family"
                    title={lang === 'ur' ? 'اردو فونٹس' : 'Urdu Font Family'}
                    style={{
                      width: '120px',
                      height: '22px',
                      fontSize: '10px',
                      border: detectedScript === 'urdu' ? '1px solid #10b981' : '1px solid var(--panel-border)',
                      boxShadow: detectedScript === 'urdu' ? '0 0 0 2px rgba(16, 185, 129, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {recentUrduFonts.length > 0 && (
                      <optgroup label={lang === 'ur' ? 'حال ہی میں استعمال شدہ (Recent Urdu)' : 'Recent Urdu Fonts'}>
                        {recentUrduFonts.map((font) => (
                          <option key={`recent-ur-${font}`} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label={lang === 'ur' ? 'تصدیق شدہ اردو فونٹس (Bundled OFL)' : 'Verified Bundled Fonts'}>
                      {BUNDLED_URDU_FONTS.map((font) => (
                        <option key={`bundled-ur-${font}`} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={lang === 'ur' ? 'سسٹم اور لوکل فونٹس (System Fonts)' : 'Installed System Fonts'}>
                      {URDU_FONTS_LIST.filter((f) => !BUNDLED_URDU_FONTS.includes(f) && !UNAVAILABLE_INPAGE_FONTS.includes(f)).map((font) => (
                        <option key={`system-ur-${font}`} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={lang === 'ur' ? 'غير موجود فونٹس (Unavailable)' : 'Unavailable Proprietary Fonts'}>
                      {UNAVAILABLE_INPAGE_FONTS.map((font) => (
                        <option key={`unavail-ur-${font}`} value={font} style={{ fontFamily: font, color: '#dc2626' }}>
                          {font} (Not Installed)
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  <input
                    type="number"
                    value={activeFontSize}
                    onChange={(e) => onFontSizeChange(Number(e.target.value))}
                    className="ribbon-number-input ribbon-font-size"
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
                    className="ribbon-action-btn font-size-stepper"
                    title="Increase Font Size (Ctrl+>)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    <span className="font-size-stepper-glyph">A<AppIcon name="arrow-up" /></span>
                  </button>

                  {/* Decrease Font Size A_v */}
                  <button
                    onClick={() => {
                      const steps = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72, 144];
                      const prev = [...steps].reverse().find((s) => s < activeFontSize) ?? Math.max(activeFontSize - 2, 8);
                      onFontSizeChange(prev);
                    }}
                    className="ribbon-action-btn font-size-stepper"
                    title="Decrease Font Size (Ctrl+<)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    <span className="font-size-stepper-glyph">A<AppIcon name="arrow-down" /></span>
                  </button>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Clear All Formatting A🧹 */}
                  <button
                    onClick={onClearFormatting}
                    className="ribbon-action-btn"
                    title="Clear All Formatting"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 600 }}
                  >
                    <AppIcon name="clear-format" size={18} />
                  </button>
                </div>

                {/* Bottom Row: B, I, U, 🖊️▼ (Highlight), A▼ (Color) */}
                <div className="ribbon-font-row ribbon-font-format-row">
                  <select
                    value={activeEnglishFont}
                    onChange={(e) => {
                      if (onEnglishFontChange) onEnglishFontChange(e.target.value);
                      else onFontFamilyChange(e.target.value);
                    }}
                    className="ribbon-select ribbon-font-latin"
                    title="English / Latin Font Family"
                    style={{
                      border: detectedScript === 'latin' ? '1px solid #2563eb' : '1px solid var(--panel-border)',
                      boxShadow: detectedScript === 'latin' ? '0 0 0 2px rgba(37, 99, 235, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {recentEnglishFonts.length > 0 && (
                      <optgroup label={lang === 'ur' ? 'حال ہی میں انگلش (Recent English)' : 'Recent English Fonts'}>
                        {recentEnglishFonts.map((font) => (
                          <option key={`recent-en-${font}`} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label={lang === 'ur' ? 'تمام انگلش فونٹس (All English Fonts)' : 'All English Fonts'}>
                      {WINDOWS_STANDARD_FONTS.map((font) => (
                        <option key={`all-en-${font}`} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {/* Bold */}
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onToggleBold}
                    className={`ribbon-action-btn ${isBold ? 'active' : ''}`}
                    title="Bold (Ctrl+B)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    <b>B</b>
                  </button>

                  {/* Italic */}
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onToggleItalic}
                    className={`ribbon-action-btn ${isItalic ? 'active' : ''}`}
                    title="Italic (Ctrl+I)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontStyle: 'italic' }}
                  >
                    <i>I</i>
                  </button>

                  {/* Underline U (Direct Toggle) */}
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onToggleUnderline}
                    className={`ribbon-action-btn ${isUnderline ? 'active' : ''}`}
                    title="Underline (Ctrl+U)"
                    style={{ padding: '1px 5px', fontSize: '10px', textDecoration: 'underline' }}
                  >
                    <u>U</u>
                  </button>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Text Highlight Color 🖊️▼ Palette */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowHighlightPalette((prev) => !prev)}
                      className="ribbon-action-btn"
                      title="Text Highlight Color"
                      style={{ padding: '1px 5px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <AppIcon name="paint" size={14} />
                      <AppIcon name="chevron-down" size={10} />
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
                      onMouseDown={(e) => e.preventDefault()}
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
                <AppIcon name="more" size={13} />
              </button>

              <div className="ribbon-group-caption">{t.grpFont}</div>
            </div>

            {/* Group 3: Paragraph */}
            <div className="ribbon-group-box ribbon-paragraph-group" style={{ position: 'relative', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {/* Top Row: Bullets, Numbering, Indents, Directions, Show/Hide Marks */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {/* Bullets •= */}
                  <button
                    onClick={onToggleBulletList}
                    className={`ribbon-action-btn ${isBulletList ? 'active' : ''}`}
                    title="Bullets"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    <AppIcon name="bullets" size={17} />
                  </button>

                  {/* Numbering 1≡ */}
                  <button
                    onClick={onToggleOrderedList}
                    className={`ribbon-action-btn ${isOrderedList ? 'active' : ''}`}
                    title="Numbering"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    <AppIcon name="numbered-list" size={17} />
                  </button>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Decrease Indent ⬅≡ */}
                  <button
                    onClick={onDecreaseIndent}
                    className="ribbon-action-btn"
                    title="Decrease Indent"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    <AppIcon name="indent-decrease" size={16} />
                  </button>

                  {/* Increase Indent ≡➡️ */}
                  <button
                    onClick={onIncreaseIndent}
                    className="ribbon-action-btn"
                    title="Increase Indent"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    <AppIcon name="indent-increase" size={16} />
                  </button>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                  {/* Left-to-Right Direction >¶ */}
                  <button
                    onClick={() => onDirectionChange?.('ltr')}
                    className={`ribbon-action-btn ${activeDirection === 'ltr' ? 'active' : ''}`}
                    title="Left-to-Right Text Direction"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    <AppIcon name="direction-ltr" size={17} />
                  </button>

                  {/* Right-to-Left Direction ¶< */}
                  <button
                    onClick={() => onDirectionChange?.('rtl')}
                    className={`ribbon-action-btn ${activeDirection === 'rtl' ? 'active' : ''}`}
                    title="Right-to-Left Text Direction (Urdu)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    <AppIcon name="direction-rtl" size={17} />
                  </button>

                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--panel-border)', margin: '0 1px' }} />

                </div>

                {/* Bottom Row: Align Left, Center, Right, Justify, Line Spacing */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {/* Align Left */}
                  <button
                    onClick={() => onAlignmentChange?.('left')}
                    className={`ribbon-action-btn ${activeAlignment === 'left' ? 'active' : ''}`}
                    title="Align Left (Ctrl+L)"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    <AppIcon name="align-left" size={17} />
                  </button>

                  {/* Align Center */}
                  <button
                    onClick={() => onAlignmentChange?.('center')}
                    className={`ribbon-action-btn ${activeAlignment === 'center' ? 'active' : ''}`}
                    title="Center (Ctrl+E)"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    <AppIcon name="align-center" size={17} />
                  </button>

                  {/* Align Right */}
                  <button
                    onClick={() => onAlignmentChange?.('right')}
                    className={`ribbon-action-btn ${activeAlignment === 'right' || activeAlignment === 'start' ? 'active' : ''}`}
                    title="Align Right (Ctrl+R)"
                    style={{ padding: '1px 5px', fontSize: '10px' }}
                  >
                    <AppIcon name="align-right" size={17} />
                  </button>

                  {/* Justify ≡ ▼ Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowJustifyMenu((prev) => !prev)}
                      className={`ribbon-action-btn ${activeAlignment === 'justify' ? 'active' : ''}`}
                      title="Justify (Ctrl+J)"
                      style={{ padding: '1px 5px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <AppIcon name="align-justify" size={17} />
                      <AppIcon name="chevron-down" size={10} />
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
                          style={{ width: '100%', padding: '6px 12px', border: 'none', background: activeAlignment === 'justify' && !isKashidaEnabled ? 'rgba(16, 185, 129, 0.15)' : 'transparent', color: activeAlignment === 'justify' && !isKashidaEnabled ? 'var(--emerald-accent)' : 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                        >
                          Standard Justify
                        </button>
                        <button
                          onClick={() => { onAlignmentChange?.('justify'); onToggleKashida?.(); setShowJustifyMenu(false); }}
                          className="ribbon-menu-item"
                          disabled={activeDirection !== 'rtl'}
                          title={activeDirection !== 'rtl' ? 'Kashida is available for Urdu/Arabic (RTL) text' : 'Toggle Urdu Kashida cursive justification'}
                          style={{
                            width: '100%',
                            padding: '6px 12px',
                            border: 'none',
                            background: isKashidaEnabled ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                            color: isKashidaEnabled ? 'var(--emerald-accent)' : activeDirection !== 'rtl' ? 'var(--text-muted)' : 'var(--text-main)',
                            cursor: activeDirection !== 'rtl' ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            opacity: activeDirection !== 'rtl' ? 0.6 : 1,
                          }}
                        >
                          Urdu Kashida Justify (کشیدہ) {isKashidaEnabled ? '(On)' : ''}
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
                      <AppIcon name="line-spacing" size={16} />
                      <AppIcon name="chevron-down" size={10} />
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
                  <button
                    onClick={onToggleFormattingMarks}
                    className={`ribbon-action-btn ${showFormattingMarks ? 'active' : ''}`}
                    title="Show/Hide Non-Printing Formatting Marks (Ctrl+*)"
                    style={{ padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}
                  >
                    <AppIcon name="paragraph-mark" size={17} />
                  </button>
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
                <AppIcon name="more" size={13} />
              </button>

              <div className="ribbon-group-caption">{t.grpParagraph}</div>
            </div>

            {/* Group 5: Urdu Styles */}
            <div className="ribbon-group-box ribbon-styles-group" style={{ position: 'relative' }}>
              <div className="ribbon-style-gallery-wrap">
                <div className="ribbon-style-gallery">
                  {[
                    { id: 'normal', name: lang === 'ur' ? 'عام متن' : 'Normal', preview: 'متن', tag: '¶ Nastaliq' },
                    { id: 'heading-1', name: lang === 'ur' ? 'عنوان ۱' : 'Heading 1', preview: 'عنوان ۱', tag: 'H1 24pt' },
                    { id: 'heading-2', name: lang === 'ur' ? 'عنوان ۲' : 'Heading 2', preview: 'عنوان ۲', tag: 'H2 18pt' },
                    { id: 'poetry', name: lang === 'ur' ? 'شاعری' : 'Poetry', preview: 'شعر', tag: 'Poetry 16pt' },
                    { id: 'quote', name: lang === 'ur' ? 'اقتباس' : 'Quote', preview: 'اقتباس', tag: 'Quote 14pt' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => onApplyStyle?.(st.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '58px',
                        height: '36px',
                        border: activeStyleId === st.id ? '2px solid var(--emerald-accent)' : '1px solid var(--panel-border)',
                        borderRadius: '4px',
                        backgroundColor: activeStyleId === st.id ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-studio)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        padding: '1px 2px',
                        flexShrink: 0,
                        fontFamily: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif",
                      }}
                    >
                      <span style={{ fontSize: st.id.includes('heading') ? '11px' : '10px', lineHeight: 1, fontWeight: st.id.includes('heading') ? 700 : 400, color: st.id.includes('heading') ? '#0284c7' : 'var(--text-main)' }}>
                        {st.preview}
                      </span>
                      <span style={{ fontSize: '7.5px', lineHeight: 1, color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '54px' }}>
                        {st.name}
                      </span>
                    </button>
                  ))}
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
                <AppIcon name="more" size={13} />
              </button>

              <div className="ribbon-group-caption">{lang === 'ur' ? 'اردو اسٹائلز' : 'Urdu Styles'}</div>
            </div>

            {/* Group 5: Editing */}
            <div className="ribbon-group-box ribbon-editing-group">
              <div className="ribbon-edit-stack">
                <button
                  onClick={onOpenFind}
                  className="ribbon-action-btn ribbon-edit-btn"
                  title="Find (Ctrl+F)"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <AppIcon name="search" size={13} />
                  <span>{lang === 'ur' ? 'تلاش' : 'Find'}</span>
                  <AppIcon name="chevron-down" size={10} />
                </button>

                <button
                  onClick={onOpenReplace}
                  className="ribbon-action-btn ribbon-edit-btn"
                  title="Replace (Ctrl+H)"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <AppIcon name="sync" size={15} />
                  <span>{lang === 'ur' ? 'تبدیل' : 'Replace'}</span>
                </button>

                {/* Select Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowSelectMenu((prev) => !prev)}
                    className="ribbon-action-btn ribbon-edit-btn"
                    title="Select"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}
                  >
                    <AppIcon name="target" size={13} />
                    <span>{lang === 'ur' ? 'انتخاب' : 'Select'}</span>
                    <AppIcon name="chevron-down" size={10} />
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
                      <button
                        onClick={() => { onOpenSelectionPane?.(); setShowSelectMenu(false); }}
                        className="ribbon-menu-item"
                        style={{ width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
                      >
                        Selection Pane... (پینل انتخاب)
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'تدوین' : 'Editing'}</div>
            </div>
          </div>
        )}

        {/* Tab 2: INSERT */}
        {activeTab === 'insert' && (
          <div className="ribbon-group-row">
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button onClick={onAddPage} className="ribbon-action-btn highlight">
                  <AppIcon name="document-add" />
                  <span>{t.addPage}</span>
                </button>
                <button onClick={onRemovePage} className="ribbon-action-btn">
                  <AppIcon name="delete" />
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
                  <AppIcon name="target" />
                  <span>{t.select}</span>
                </button>

                <button
                  onClick={() => onSelectTool('text')}
                  className={`ribbon-action-btn ${activeTool === 'text' ? 'active' : ''}`}
                  title={t.textFrame}
                >
                  <AppIcon name="text-add" />
                  <span>{t.textFrame}</span>
                </button>

                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    onClick={() => setShowShapeGallery((prev) => !prev)}
                    className={`ribbon-action-btn ${activeTool === 'rectangle' || showShapeGallery ? 'active' : ''}`}
                    title="Shapes Gallery"
                  >
                  <AppIcon name="paint" />
                    <span>{t.shape} <AppIcon name="chevron-down" size={11} /></span>
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
                        <AppIcon name="square" size={18} />
                      </button>
                      <button
                        title="Rounded Rectangle"
                        onClick={() => {
                          onInsertShape?.('rounded-rectangle');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        <AppIcon name="square" size={18} />
                      </button>
                      <button
                        title="Oval / Circle"
                        onClick={() => {
                          onInsertShape?.('ellipse');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        <AppIcon name="circle" size={18} />
                      </button>
                      <button
                        title="Triangle"
                        onClick={() => {
                          onInsertShape?.('triangle');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        <AppIcon name="triangle" size={18} />
                      </button>
                      <button
                        title="Diamond"
                        onClick={() => {
                          onInsertShape?.('diamond');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        <AppIcon name="square" size={18} />
                      </button>
                      <button
                        title="Star"
                        onClick={() => {
                          onInsertShape?.('star');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        <AppIcon name="star" size={18} />
                      </button>
                      <button
                        title="Arrow Right"
                        onClick={() => {
                          onInsertShape?.('arrow-right');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        <AppIcon name="arrow-right" size={18} />
                      </button>
                      <button
                        title="Arrow Left"
                        onClick={() => {
                          onInsertShape?.('arrow-left');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        <AppIcon name="arrow-left" size={18} />
                      </button>
                      <button
                        title="Arrow Up"
                        onClick={() => {
                          onInsertShape?.('arrow-up');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        <AppIcon name="arrow-up" size={18} />
                      </button>
                      <button
                        title="Arrow Down"
                        onClick={() => {
                          onInsertShape?.('arrow-down');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        <AppIcon name="arrow-down" size={18} />
                      </button>
                      <button
                        title="Hexagon"
                        onClick={() => {
                          onInsertShape?.('hexagon');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        <AppIcon name="hexagon" size={18} />
                      </button>
                      <button
                        title="Speech Callout"
                        onClick={() => {
                          onInsertShape?.('callout');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px' }}
                      >
                        <AppIcon name="chat" size={18} />
                      </button>
                      <button
                        title="Line"
                        onClick={() => {
                          onInsertShape?.('line');
                          setShowShapeGallery(false);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '16px', gridColumn: 'span 4' }}
                      >
                        <AppIcon name="subtract" size={18} /> Straight Line
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onSelectTool('image')}
                  className={`ribbon-action-btn ${activeTool === 'image' ? 'active' : ''}`}
                >
                  <AppIcon name="image" />
                  <span>{t.imageFrame}</span>
                </button>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    onClick={() => setShowTableGridPicker((prev) => !prev)}
                    className="ribbon-action-btn primary"
                    title={lang === 'ur' ? 'جدول کی پیمائش منتخب کریں' : 'Choose Table Dimensions'}
                  >
                    <AppIcon name="table" />
                    <span>{lang === 'ur' ? 'جدول (Table)' : 'Table'} <AppIcon name="chevron-down" size={11} /></span>
                  </button>

                  {showTableGridPicker && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 100,
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                        padding: '10px',
                        width: '210px',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '12px',
                          color: '#0f172a',
                          marginBottom: '8px',
                          textAlign: 'center',
                        }}
                      >
                        {tableHoverRows} × {tableHoverCols} {lang === 'ur' ? 'جدول' : 'Table'}
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(10, 16px)',
                          gap: '2px',
                          justifyContent: 'center',
                        }}
                      >
                        {Array.from({ length: 8 }).map((_rVal, r) =>
                          Array.from({ length: 10 }).map((_cVal, c) => {
                            const row = r + 1;
                            const col = c + 1;
                            const isHighlighted = row <= tableHoverRows && col <= tableHoverCols;
                            return (
                              <div
                                key={`${r}-${c}`}
                                onMouseEnter={() => {
                                  setTableHoverRows(row);
                                  setTableHoverCols(col);
                                }}
                                onClick={() => {
                                  setShowTableGridPicker(false);
                                  onInsertTable?.(row, col);
                                }}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  backgroundColor: isHighlighted ? '#0284c7' : '#f1f5f9',
                                  border: isHighlighted ? '1px solid #0369a1' : '1px solid #cbd5e1',
                                  borderRadius: '2px',
                                  cursor: 'pointer',
                                }}
                              />
                            );
                          }),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="ribbon-group-caption">{t.grpIllustrations}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button onClick={onToggleSelectionPane} className="ribbon-action-btn highlight">
                  <AppIcon name="panel-right" />
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
                  <AppIcon name="book-open" />
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
                  <AppIcon name="tag" />
                  <span>{lang === 'ur' ? 'کیپشن' : 'Caption'}</span>
                </button>
                <button
                  onClick={onInsertBookmark}
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'بک مارک شامل کریں' : 'Insert Bookmark'}
                >
                  <AppIcon name="bookmark" />
                  <span>{lang === 'ur' ? 'بک مارک' : 'Bookmark'}</span>
                </button>
                <button
                  onClick={onInsertIndex}
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'اشاریہ (انڈیکس) شامل کریں' : 'Insert Index'}
                >
                  <AppIcon name="book-open" />
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
                  <AppIcon name="language" />
                  <span>{lang === 'ur' ? 'ان لائن (Inline)' : 'Inline'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetWrapping && onSetWrapping('square')}
                  className="ribbon-action-btn highlight"
                >
                  <AppIcon name="square" />
                  <span>{lang === 'ur' ? 'مربع (Square Wrap)' : 'Square Wrap'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetWrapping && onSetWrapping('top-bottom')}
                  className="ribbon-action-btn"
                >
                  <AppIcon name="line-spacing" />
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
                  <AppIcon name="arrow-up" />
                  <span>Bring to Front</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReorderObject && onReorderObject('forward')}
                  className="ribbon-action-btn"
                >
                  <AppIcon name="arrow-up" />
                  <span>Bring Forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReorderObject && onReorderObject('backward')}
                  className="ribbon-action-btn"
                >
                  <AppIcon name="arrow-down" />
                  <span>Send Backward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReorderObject && onReorderObject('back')}
                  className="ribbon-action-btn"
                >
                  <AppIcon name="arrow-down" />
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
                  <AppIcon name="align-left" />
                  <span>Align Left</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAlignObjects && onAlignObjects('center')}
                  className="ribbon-action-btn"
                >
                  <AppIcon name="align-center" />
                  <span>Align Center</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAlignObjects && onAlignObjects('right')}
                  className="ribbon-action-btn"
                >
                  <AppIcon name="align-right" />
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
                  <AppIcon name="cut" />
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
                  <AppIcon name="square" />
                  <span>Square Wrap</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetWrapping && onSetWrapping('behind')}
                  className="ribbon-action-btn"
                >
                  <AppIcon name="square" />
                  <span>Behind Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetWrapping && onSetWrapping('in-front')}
                  className="ribbon-action-btn"
                >
                  <AppIcon name="image" />
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
                  <AppIcon name="arrow-up" />
                  <span>Bring Forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReorderObject && onReorderObject('backward')}
                  className="ribbon-action-btn"
                >
                  <AppIcon name="arrow-down" />
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
              <div className="ribbon-chunk" style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center' }}>
                <button type="button" onClick={onInsertTableRowAbove} className="ribbon-action-btn primary" title="Insert Row Above" style={{ whiteSpace: 'nowrap', minWidth: '70px' }}>
                  <AppIcon name="arrow-up" />
                  <span>{lang === 'ur' ? 'سطر اوپر' : 'Row Above'}</span>
                </button>
                <button type="button" onClick={onInsertTableRowBelow} className="ribbon-action-btn primary" title="Insert Row Below" style={{ whiteSpace: 'nowrap', minWidth: '70px' }}>
                  <AppIcon name="arrow-down" />
                  <span>{lang === 'ur' ? 'سطر نیچے' : 'Row Below'}</span>
                </button>
                <button type="button" onClick={onInsertTableColLeft} className="ribbon-action-btn primary" title="Insert Column Left" style={{ whiteSpace: 'nowrap', minWidth: '70px' }}>
                  <AppIcon name="arrow-left" />
                  <span>{lang === 'ur' ? 'کالم بائیں' : 'Col Left'}</span>
                </button>
                <button type="button" onClick={onInsertTableColRight} className="ribbon-action-btn primary" title="Insert Column Right" style={{ whiteSpace: 'nowrap', minWidth: '70px' }}>
                  <AppIcon name="arrow-right" />
                  <span>{lang === 'ur' ? 'کالم دائیں' : 'Col Right'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'سطور و کالمز' : 'Rows & Columns'}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk" style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center' }}>
                <button type="button" onClick={onDeleteTableRow} className="ribbon-action-btn danger" title="Delete Row" style={{ whiteSpace: 'nowrap' }}>
                  <AppIcon name="delete" />
                  <span>{lang === 'ur' ? 'سطر حذف کریں' : 'Delete Row'}</span>
                </button>
                <button type="button" onClick={onDeleteTableCol} className="ribbon-action-btn danger" title="Delete Column" style={{ whiteSpace: 'nowrap' }}>
                  <AppIcon name="delete" />
                  <span>{lang === 'ur' ? 'کالم حذف کریں' : 'Delete Col'}</span>
                </button>
                <button type="button" onClick={onDeleteTable} className="ribbon-action-btn danger" title="Delete Table" style={{ whiteSpace: 'nowrap' }}>
                  <AppIcon name="delete" />
                  <span>{lang === 'ur' ? 'جدول حذف کریں' : 'Delete Table'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'حذف کریں' : 'Delete'}</div>
            </div>
          </div>
        )}

        {/* Tab 3: URDU TOOLS */}
        {activeTab === 'urdu-tools' && (
          <div className="ribbon-group-row" role="toolbar" aria-label="Urdu Authoring Tools Toolbar">
            {/* Group 1: Proofing & Dictionary */}
            <div className="ribbon-group-box" role="region" aria-label="Proofing and Dictionary">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={() => onOpenLanguageTools('spelling')}
                  className="ribbon-action-btn highlight"
                  aria-label={`${t.spellcheck} & ${t.dictionary}`}
                  title={`${t.spellcheck} & ${t.dictionary}`}
                >
                  <AppIcon name="language" aria-hidden="true" />
                  <span>{lang === 'ur' ? 'املا' : 'Spelling'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLanguageTools('proofread')}
                  className="ribbon-action-btn"
                  aria-label={lang === 'ur' ? 'پروف ریڈنگ' : 'Proofread'}
                  title={lang === 'ur' ? 'اردو متن کی پروف ریڈنگ' : 'Proofread Urdu text'}
                >
                  <AppIcon name="edit" aria-hidden="true" />
                  <span>{lang === 'ur' ? 'پروف ریڈ' : 'Proofread'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'املا' : 'Proofing'}</div>
            </div>

            {/* Group 2: Transliteration & Character Normalization */}
            <div className="ribbon-group-box" role="region" aria-label="Transliteration and Normalization">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={onOpenCharacterSubstitution}
                  className="ribbon-action-btn highlight"
                  aria-label={lang === 'ur' ? 'حروف کی اصلاح (Fix Characters)' : 'Fix Characters'}
                  title="Correct Arabic Character Variants (ك, ي, ه) to Native Urdu (ک, ی, ہ)"
                >
                  <AppIcon name="language" aria-hidden="true" />
                  <span>{lang === 'ur' ? 'حروف کی اصلاح' : 'Fix Characters'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'اصلاح' : 'Text Fixes'}</div>
            </div>

            {/* Group 3: Keyboard & Input Systems */}
            <div className="ribbon-group-box" role="region" aria-label="Keyboard Systems">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={onOpenKeyboardEditor}
                  className="ribbon-action-btn"
                  aria-label={lang === 'ur' ? 'کی بورڈ ایڈیٹر (Custom Keyboard Editor)' : 'Keyboard Editor'}
                  title="Custom Keyboard Layout Editor"
                >
                  <AppIcon name="keyboard" aria-hidden="true" />
                  <span>{lang === 'ur' ? 'کی بورڈ ایڈیٹر' : 'Keyboard Editor'}</span>
                </button>
                {onToggleVisualKeyboard && (
                  <button
                    type="button"
                    onClick={onToggleVisualKeyboard}
                    className={`ribbon-action-btn ${showVisualKeyboard ? 'active' : ''}`}
                    aria-label={lang === 'ur' ? 'اردو کی بورڈ کیشے (Visual Keyboard)' : 'Toggle Visual Keyboard'}
                    aria-pressed={Boolean(showVisualKeyboard)}
                    title="Toggle On-screen Visual Keyboard Grid"
                  >
                    <AppIcon name="keyboard" aria-hidden="true" />
                    <span>{lang === 'ur' ? 'آن سکرین کی بورڈ' : 'Visual Keyboard'}</span>
                  </button>
                )}
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'کی بورڈ' : 'Keyboard'}</div>
            </div>

            {/* Group 4: Scanned Content & OCR */}
            <div className="ribbon-group-box" role="region" aria-label="Scanned Content and OCR">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={onOpenOcr}
                  className="ribbon-action-btn sky"
                  aria-label={lang === 'ur' ? 'تصویری متن شناسی (Import Image OCR)' : 'Import Image OCR'}
                  title="Import scanned image or PDF page for Urdu OCR recognition"
                >
                  <AppIcon name="camera" aria-hidden="true" />
                  <span>{t.ocr}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.grpConversion}</div>
            </div>
          </div>
        )}

        {/* Tab 4: PAGE LAYOUT */}
        {activeTab === 'layout' && (
          <div className="ribbon-group-row" style={{ direction: lang === 'ur' ? 'rtl' : 'ltr' }}>
            {/* Group 1: Page Setup */}
            <div className="ribbon-group-box ribbon-page-setup-group" role="region" aria-label="Page Setup">
              <div className="ribbon-chunk ribbon-page-setup-controls">
                {/* Size Preset Dropdown */}
                <select
                  className="ribbon-select ribbon-page-setup-select"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'more') {
                      onOpenPageSetupModal?.();
                    } else if (val) {
                      onApplySizePreset?.(val as any);
                    }
                  }}
                  defaultValue=""
                  title={lang === 'ur' ? 'صفحہ کا سائز منتخب کریں' : 'Select Page Size'}
                >
                  <option value="" disabled>{lang === 'ur' ? 'سائز' : 'Size'}</option>
                  <option value="a4">A4 (210×297mm)</option>
                  <option value="a5">A5 (148×210mm)</option>
                  <option value="a3">A3 (297×420mm)</option>
                  <option value="letter">Letter (8.5×11in)</option>
                  <option value="legal">Legal (8.5×14in)</option>
                  <option value="book6x9">6×9 Book</option>
                  <option value="more">{lang === 'ur' ? 'مزید سائز...' : 'More Setup...'}</option>
                </select>

                {/* Orientation Dropdown */}
                <select
                  className="ribbon-select ribbon-page-setup-select"
                  onChange={(e) => {
                    const val = e.target.value as 'portrait' | 'landscape';
                    if (val) {
                      onSetOrientation?.(val);
                    }
                  }}
                  defaultValue=""
                  title={lang === 'ur' ? 'صفحہ کا رخ (عمودی/افقی)' : 'Page Orientation'}
                >
                  <option value="" disabled>{lang === 'ur' ? 'رخ' : 'Orientation'}</option>
                  <option value="portrait">{lang === 'ur' ? 'عمودی' : 'Portrait'}</option>
                  <option value="landscape">{lang === 'ur' ? 'افقی' : 'Landscape'}</option>
                </select>

                {/* Margins Dropdown */}
                <select
                  className="ribbon-select ribbon-page-setup-select"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      onOpenPageSetupModal?.();
                    } else if (val) {
                      onApplyMarginPreset?.(val as any);
                    }
                  }}
                  defaultValue=""
                  title={lang === 'ur' ? 'حواشی منتخب کریں' : 'Select Margins'}
                >
                  <option value="" disabled>{lang === 'ur' ? 'حواشی' : 'Margins'}</option>
                  <option value="normal">{lang === 'ur' ? 'نارمل (15mm)' : 'Normal (15mm)'}</option>
                  <option value="narrow">{lang === 'ur' ? 'باریک (10mm)' : 'Narrow (10mm)'}</option>
                  <option value="moderate">{lang === 'ur' ? 'درمیانہ' : 'Moderate'}</option>
                  <option value="wide">{lang === 'ur' ? 'وسیع (30mm)' : 'Wide (30mm)'}</option>
                  <option value="mirrored">{lang === 'ur' ? 'آئینہ دار' : 'Mirrored'}</option>
                  <option value="custom">{lang === 'ur' ? 'حسبِ ضرورت...' : 'Custom...'}</option>
                </select>

                {/* Launcher Button for Full Page Setup Modal */}
                <button
                  type="button"
                  onClick={onOpenPageSetupModal}
                  className="ribbon-action-btn ribbon-page-setup-more"
                  title={lang === 'ur' ? 'صفحہ کی مکمل ترتیبات کھولیں' : 'Open Page Setup Modal'}
                >
                  <AppIcon name="more" />
                  <span>{lang === 'ur' ? 'مزید' : 'More'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.grpPageSetup}</div>
            </div>

            {/* Group 2: Breaks */}
            <div className="ribbon-group-box" role="region" aria-label="Breaks">
              <div className="ribbon-chunk" style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => onInsertSectionBreak && onInsertSectionBreak('next-page')}
                  className="ribbon-action-btn primary"
                  title={lang === 'ur' ? 'نیا سیکشن صفحہ درج کریں' : 'Insert Next Page Section Break'}
                >
                  <AppIcon name="document-add" />
                  <span>{lang === 'ur' ? 'نیا سیکشن' : 'Section Break'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInsertSectionBreak && onInsertSectionBreak('continuous')}
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'جاری سیکشن بریک درج کریں' : 'Insert Continuous Section Break'}
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                >
                  <AppIcon name="cut" />
                  <span>{lang === 'ur' ? 'جاری سیکشن' : 'Continuous'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.grpBreaks}</div>
            </div>

            {/* Group 3: Columns */}
            <div className="ribbon-group-box ribbon-columns-group" role="region" aria-label="Columns">
              <div className="ribbon-chunk ribbon-columns-grid">
                <button
                  type="button"
                  onClick={() => onApplyColumns?.(1)}
                  className="ribbon-action-btn ribbon-column-option"
                  title={lang === 'ur' ? 'ایک کالم' : 'One Column'}
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                >
                  <span>|</span>
                  <span>{lang === 'ur' ? '۱ کالم' : '1 Col'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onApplyColumns?.(2)}
                  className="ribbon-action-btn ribbon-column-option"
                  title={lang === 'ur' ? 'دو کالمز (Urdu RTL)' : 'Two Columns'}
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                >
                  <span>||</span>
                  <span>{lang === 'ur' ? '۲ کالمز' : '2 Cols'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onApplyColumns?.(3)}
                  className="ribbon-action-btn ribbon-column-option"
                  title={lang === 'ur' ? 'تین کالمز' : 'Three Columns'}
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                >
                  <span>|||</span>
                  <span>{lang === 'ur' ? '۳ کالمز' : '3 Cols'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onApplyColumns?.(4)}
                  className="ribbon-action-btn ribbon-column-option"
                  title={lang === 'ur' ? 'چار کالمز' : 'Four Columns'}
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                >
                  <span>||||</span>
                  <span>{lang === 'ur' ? '۴ کالمز' : '4 Cols'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.grpColumns}</div>
            </div>

            {/* Group 4: Header, Footer & Masters */}
            <div className="ribbon-group-box" role="region" aria-label="Header Footer">
              <div className="ribbon-chunk" style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={onOpenHeaderFooterModal}
                  className="ribbon-action-btn primary"
                  title={lang === 'ur' ? 'ہیڈر، فوٹر اور ماسٹر پیج سیٹنگز' : 'Header, Footer & Master Setup'}
                >
                  <AppIcon name="document-text" />
                  <span>{lang === 'ur' ? 'ہیڈر و فوٹر' : 'Header & Footer'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'ہیڈر و ماسٹر' : 'Header & Master'}</div>
            </div>

            {/* Group 4: Layout Aids */}
            <div className="ribbon-group-box" role="region" aria-label="Layout Aids">
              <div className="ribbon-chunk" style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={onToggleRulers}
                  className={`ribbon-action-btn ${showRulers ? 'active' : ''}`}
                  title={lang === 'ur' ? 'پیمانہ دِکھائیں/پُھلا دیں' : 'Toggle Rulers'}
                >
                  <AppIcon name="ruler" />
                  <span>{lang === 'ur' ? 'پیمانہ' : 'Rulers'}</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleGrid}
                  className={`ribbon-action-btn ${showGrid ? 'active' : ''}`}
                  title={lang === 'ur' ? 'گرڈ دکھائیں' : 'Toggle Grid'}
                >
                  <AppIcon name="grid" />
                  <span>{lang === 'ur' ? 'گرڈ' : 'Grid'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.grpLayoutAids}</div>
            </div>

            {/* Group 5: Print Safety */}
            <div className="ribbon-group-box" role="region" aria-label="Print Safety">
              <div className="ribbon-chunk">
                <button
                  type="button"
                  onClick={onRunPreflight}
                  className="ribbon-action-btn warning"
                  title={lang === 'ur' ? 'پرنٹ و لکیج پری فلائٹ جاچک کریں' : 'Run Preflight Diagnostics'}
                >
                  <AppIcon name="warning" />
                  <span>{t.preflight}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{t.grpPrintSafety}</div>
            </div>
          </div>
        )}

        {/* Tab 5: COLLABORATION & REVIEW */}
        {activeTab === 'collab' && (
          <div className="ribbon-group-row">
            {/* Mode Switcher Group */}
            <div className="ribbon-group-box ribbon-edit-mode-group">
              <div className="ribbon-chunk ribbon-edit-mode-control">
                <span className="ribbon-edit-mode-label">
                  {lang === 'ur' ? 'موڈ:' : 'Mode:'}
                </span>
                <select
                  value={editMode}
                  onChange={(e) => onEditModeChange && onEditModeChange(e.target.value as typeof editMode)}
                  className="ribbon-select ribbon-edit-mode-select"
                >
                  <option value="editing">{lang === 'ur' ? 'ترمیم' : 'Edit'}</option>
                  <option value="reviewing">{lang === 'ur' ? 'جائزہ' : 'Review'}</option>
                  <option value="viewing">{lang === 'ur' ? 'دیکھیں' : 'View'}</option>
                </select>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'موڈ' : 'Mode'}</div>
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
                  <AppIcon name="edit" />
                  <span>{lang === 'ur' ? 'نظر ثانی پینل' : 'Reviewing Pane'}</span>
                </button>
                <button type="button" onClick={onOpenCompare} className="ribbon-action-btn" title="Compare Documents">
                  <AppIcon name="document-text" />
                  <span>{lang === 'ur' ? 'موازنہ' : 'Compare'}</span>
                </button>
                <button type="button" onClick={onOpenVersionHistory} className="ribbon-action-btn" title="Version History">
                  <AppIcon name="history" />
                  <span>{lang === 'ur' ? 'ورژن ہسٹری' : 'History'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'ٹریک تبدیلیاں' : 'Tracking & Compare'}</div>
            </div>

            {/* Live Session & Share Group */}
            <div className="ribbon-group-box">
              <div className="ribbon-chunk">
                <button onClick={onOpenShare} className="ribbon-action-btn highlight">
                  <AppIcon name="link" />
                  <span>{lang === 'ur' ? 'شیئر کریں' : 'Share'}</span>
                </button>
                <button onClick={onToggleCollab} className="ribbon-action-btn sky">
                  <AppIcon name="people" />
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
                  <AppIcon name="document" />
                  <span>{lang === 'ur' ? 'پرنٹ لے آؤٹ' : 'Print Layout'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange && onViewModeChange('web')}
                  className={`ribbon-action-btn ${viewMode === 'web' ? 'highlight' : ''}`}
                >
                  <AppIcon name="language" />
                  <span>{lang === 'ur' ? 'ویب لے آؤٹ' : 'Web View'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange && onViewModeChange('draft')}
                  className={`ribbon-action-btn ${viewMode === 'draft' ? 'highlight' : ''}`}
                >
                  <AppIcon name="edit" />
                  <span>{lang === 'ur' ? 'ڈرافٹ ویو' : 'Draft View'}</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleRulers}
                  className={`ribbon-action-btn ${showRulers ? 'primary' : ''}`}
                >
                  <AppIcon name="ruler" />
                  <span>{lang === 'ur' ? 'رولر (Ruler)' : 'Toggle Ruler'}</span>
                </button>
                {onToggleInspector && (
                  <button
                    type="button"
                    onClick={onToggleInspector}
                    className={`ribbon-action-btn ${isInspectorOpen ? 'sky' : ''}`}
                    title="Toggle Right Properties Panel"
                  >
                    <AppIcon name="settings" />
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
                  <AppIcon name="search" />
                  <span>{lang === 'ur' ? 'فوکس موڈ' : 'Focus Mode'}</span>
                </button>
                <button type="button" onClick={onToggleReadAloud} className="ribbon-action-btn highlight" title="Read Aloud Text Speech">
                  <AppIcon name="speaker" />
                  <span>{lang === 'ur' ? 'پڑھائی' : 'Read Aloud'}</span>
                </button>
                <button type="button" onClick={onOpenAccessibilityChecker} className="ribbon-action-btn" title="Accessibility Checker">
                  <AppIcon name="spell-check" />
                  <span>{lang === 'ur' ? 'رسائی چیکر' : 'Accessibility'}</span>
                </button>
                <button type="button" onClick={onOpenAccessibilitySettings} className="ribbon-action-btn" title="Display & Accessibility Settings">
                  <AppIcon name="settings" />
                  <span>{lang === 'ur' ? 'ڈسپلے ترتیبات' : 'UI Settings'}</span>
                </button>
              </div>
              <div className="ribbon-group-caption">{lang === 'ur' ? 'رسائی اور فوکس' : 'Focus & Accessibility'}</div>
            </div>

            <div className="ribbon-group-box">
              <div className="ribbon-chunk" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={onRunPreflight}
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'دستاویز کی غلطیاں چیک کریں' : 'Run Preflight Diagnostics'}
                >
                  <AppIcon name="search" />
                  <span>{t.preflight}</span>
                </button>
                <button
                  type="button"
                  onClick={onExportPdf}
                  className="ribbon-action-btn primary"
                  title={lang === 'ur' ? 'سسٹم کا پرنٹ ڈائیلاگ کھولتا ہے۔ یہ RePage PDF فائل نہیں بناتا۔' : 'Opens your browser/system print dialog. It does not generate a RePage PDF file.'}
                >
                  <AppIcon name="print" />
                  <span>{t.browserPrint}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenExportDialog}
                  className="ribbon-action-btn gold"
                  title={lang === 'ur' ? 'مکمل برآمدی سیٹنگز اور ڈائیلاگ کھولیں' : 'Open Output & Export Setup Dialog'}
                >
                  <AppIcon name="export" />
                  <span>{lang === 'ur' ? 'برآمد ترتیبات…' : 'Export Setup…'}</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="ribbon-action-btn"
                  title={lang === 'ur' ? 'نیٹِو ویکٹر PDF برآمد فی الحال غیر دستیاب ہے۔' : 'Native vector PDF export is currently under development and unavailable.'}
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <AppIcon name="document-pdf" />
                  <span>{t.pdfExportDisabled}</span>
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
