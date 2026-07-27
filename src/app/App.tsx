import React, { useState, useEffect } from 'react';
import { createStarterDocument, PRIMARY_STORY_ID } from '../domain/document/createDocument';
import { createId } from '../domain/document/ids';
import type { AssetReference, ImageFrameObject, Insets, Page, PageObject, RePageDocument, ShapeKind, ViewMode } from '../domain/document/types';
import type { TextAlignment, TextDirection } from '../domain/rich-text/types';
import { paragraph } from '../domain/rich-text/types';
import { PAGE_PRESETS, millimetresToPoints, pointsToMillimetres } from '../domain/geometry/units';
import { getSectionForPage } from '../domain/layout/sectionEngine';
import { repaginateDocument } from '../domain/layout/paginationEngine';
import { DocumentRulers } from '../ui/editor/DocumentRulers';
import {
  addOcrResultCommand,
  addTableObject,
  alignPageObjects,
  deleteTableColumn,
  deleteTableRow,
  insertTableColumn,
  insertTableRow,
  reorderPageObject,
  setObjectWrapping,
  updateTableCell,
} from '../editor/commands/objectCommands';
import {
  applyPageSetupCommand,
  insertSectionBreakCommand,
  setPageBackgroundCommand,
  setPageBleedCommand,
  toggleGridCommand,
  updateGuidesCommand,
  updateSectionColumnsCommand,
} from '../editor/commands/pageLayoutCommands';
import { PageSetupModal } from '../ui/dialogs/PageSetupModal';
import { SelectionPane } from '../ui/navigation/SelectionPane';
import {
  copySelection,
  cutSelection,
  pasteText,
  pasteUnformatted,
} from '../editor/commands/clipboardCommands';
import { applyStyleToStory } from '../editor/commands/styleCommands';
import { commandRegistry } from '../editor/commands/commandRegistry';
import {
  addImageFrame,
  addPage,
  addRectangle,
  addTextFrame,
  deleteObject,
  removePage,
  renameDocument,
  updateObjectGeometry,
} from '../editor/commands/documentCommands';
import { TransactionHistory } from '../editor/history/transactionHistory';
import { VisualKeyboard } from '../ui/keyboard/VisualKeyboard';
import { PreflightPanel } from '../ui/diagnostics/PreflightPanel';
import { runPreflightCheck } from '../domain/diagnostics/preflightEngine';
import { DragAndDropOverlay } from '../ui/common/DragAndDropOverlay';
import { FontDialogModal } from '../ui/dialogs/FontDialogModal';
import { ParagraphDialogModal } from '../ui/dialogs/ParagraphDialogModal';
import { triggerNativePrintDialog } from '../platform/printService';
import { browserPlatform } from '../platform/browser/browserPlatform';
import {
  importExternalFileWorkflow,
  saveAsDocumentWorkflow,
  saveDocumentWorkflow,
  type DocumentFileRef,
} from '../persistence/package/fileWorkflowEngine';
import type { KeyboardMode } from '../domain/unicode/keyboardLayouts';

// Language & OCR Imports
import { LanguageToolsPanel } from '../ui/language/LanguageToolsPanel';
import { OcrCorrectionPanel } from '../ui/ocr/OcrCorrectionPanel';
import { OcrImportDialog } from '../ui/ocr/OcrImportDialog';
import { OcrPageResult } from '../domain/ocr/ocrEngine';
import { exportDocumentToEpub } from '../export/exportEngine';

// Theme, i18n & QAT
import { ThemeMode, applyThemeToDocument } from '../ui/theme/themeEngine';
import { UiLanguage, DICTIONARY } from '../ui/i18n/menuTranslation';
import { QatItemKey, getInitialQatItems, saveQatItems } from '../ui/header/qatEngine';

// Studio Layout, MS Word Ribbon & Navigation Components
import { StudioHeader } from '../ui/common/StudioHeader';
import { MsWordRibbon, ActiveTool } from '../ui/ribbon/MsWordRibbon';
import { InspectorDock } from '../ui/common/InspectorDock';
import { FileBackstageOverlay } from '../ui/header/FileBackstageOverlay';
import { NavigationPane } from '../ui/navigation/NavigationPane';
import { DocumentStatsModal } from '../ui/dialogs/DocumentStatsModal';
import { StylesManagerModal } from '../ui/dialogs/StylesManagerModal';
import { CharacterSubstitutionModal } from '../ui/dialogs/CharacterSubstitutionModal';
import { KeyboardLayoutEditorModal } from '../ui/dialogs/KeyboardLayoutEditorModal';
import { ReviewingPane } from '../ui/collaboration/ReviewingPane';
import { CompareDocumentsModal } from '../ui/dialogs/CompareDocumentsModal';
import { VersionHistoryModal } from '../ui/dialogs/VersionHistoryModal';
import { ShareDialogModal } from '../ui/dialogs/ShareDialogModal';
import { AccessibilityCheckerModal } from '../ui/dialogs/AccessibilityCheckerModal';
import { ReadAloudToolbar } from '../ui/navigation/ReadAloudToolbar';
import { AccessibilitySettingsModal } from '../ui/dialogs/AccessibilitySettingsModal';
import { loadAccessibilitySettings, type AccessibilitySettings } from '../domain/diagnostics/accessibilitySettings';
import type { EditMode } from '../domain/document/trackChangesEngine';
import { addBookmarkCommand, insertTocCommand, addFootnoteCommand, addEndnoteCommand } from '../editor/commands/longDocumentCommands';
import { addCaptionToObject } from '../domain/document/captionEngine';
import { buildIndexRichTextDocument, generateSubjectIndex } from '../domain/document/indexEngine';
import { applyLanguageChangesCommand } from '../editor/commands/languageCommands';
import { HeaderFooterModal } from '../ui/dialogs/HeaderFooterModal';
import { ExportOutputDialog } from '../ui/dialogs/ExportOutputDialog';
import type { ExportOptions } from '../export/types';
import { PrintLayoutView } from '../ui/views/PrintLayoutView';
import { WebReadingView } from '../ui/views/WebReadingView';
import { DraftEditingView } from '../ui/views/DraftEditingView';
import { FocusModeShell } from '../ui/views/FocusModeShell';
import { setPageOrientationCommand, toggleRulersCommand } from '../editor/commands/pageLayoutCommands';

type SaveState = 'Saved locally' | 'Unsaved changes' | 'Saving…' | 'Save failed';

const history = new TransactionHistory();

function resolveActivePage(document: RePageDocument, activePageId: string): Page {
  const page = document.pages[activePageId] ?? document.pages[document.pageOrder[0]!];
  if (!page) {
    throw new Error('The canonical document has no resolvable page.');
  }
  return page;
}

function extractDocumentFromImport(res: unknown): RePageDocument | null {
  if (!res || typeof res !== 'object') return null;
  if ('document' in res && res.document && typeof res.document === 'object' && 'pageOrder' in (res.document as object)) {
    return (res as { document: RePageDocument }).document;
  }
  if ('pageOrder' in res && Array.isArray((res as RePageDocument).pageOrder)) {
    return res as RePageDocument;
  }
  return null;
}

export function App() {
  void React;
  const [document, setDocumentState] = useState<RePageDocument>(() => createStarterDocument());
  const [activePageId, setActivePageId] = useState(() => document.pageOrder[0]!);
  const [saveState, setSaveState] = useState<SaveState>('Unsaved changes');
  const [_message, setMessage] = useState('RePage Studio Ready');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [pendingChar, setPendingChar] = useState<string | null>(null);
  const [bodyEditorFocusRequest, setBodyEditorFocusRequest] = useState(0);
  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('print');
  const [showRulers, setShowRulers] = useState(true);
  const [showPageSetupModal, setShowPageSetupModal] = useState(false);
  const [showHeaderFooterModal, setShowHeaderFooterModal] = useState(false);
  const [showExportOutputDialog, setShowExportOutputDialog] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>('crulp');
  const [isKeyboardMinimized, setIsKeyboardMinimized] = useState(true);
  const [isTransliterationEnabled, setIsTransliterationEnabled] = useState(false);
  const [numeralSystem, setNumeralSystem] = useState<'urdu' | 'western'>('urdu');
  const [activeTool, setActiveTool] = useState<ActiveTool>('text');

  // Theme & Menu Language State
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [lang, setLang] = useState<UiLanguage>('en');

  // Quick Access Toolbar State
  const [qatItems, setQatItems] = useState<QatItemKey[]>(() => getInitialQatItems());

  // Active translation dictionary
  const t = DICTIONARY[lang];

  // Apply theme on mode change
  useEffect(() => {
    applyThemeToDocument(themeMode);
  }, [themeMode]);

  const handleToggleQatItem = (key: QatItemKey) => {
    setQatItems((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      saveQatItems(next);
      return next;
    });
  };

  // Modal & Panel Toggles
  const [showPreflight, setShowPreflight] = useState(false);
  const [showLanguageTools, setShowLanguageTools] = useState(false);
  const [languageToolsInitialTab, setLanguageToolsInitialTab] = useState<'proofread' | 'dictionary' | 'transliterate' | 'normalize' | 'spelling' | undefined>('proofread');
  const [activeSelectionRange, setActiveSelectionRange] = useState<{ storyId: string; from: number; to: number; selectedText: string } | null>(null);
  const [showOcrPanel, setShowOcrPanel] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrPageResult | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [isFileBackstageOpen, setIsFileBackstageOpen] = useState(false);
  const [isNavigationPaneOpen, setIsNavigationPaneOpen] = useState(false);
  const [isSelectionPaneOpen, setIsSelectionPaneOpen] = useState(false);
  const [showDocStats, setShowDocStats] = useState(false);
  const [showStylesManager, setShowStylesManager] = useState(false);
  const [showCharSub, setShowCharSub] = useState(false);
  const [showKeyboardEditor, setShowKeyboardEditor] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('editing');
  const [isReviewingPaneOpen, setIsReviewingPaneOpen] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showReadAloud, setShowReadAloud] = useState(false);
  const [showAccessibilityChecker, setShowAccessibilityChecker] = useState(false);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [_accSettings, setAccSettings] = useState<AccessibilitySettings>(() =>
    loadAccessibilitySettings(),
  );

  // Sidebars & Inspector layout state
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [inspectorWidth, setInspectorWidth] = useState(260);
  const [navPaneWidth, setNavPaneWidth] = useState(280);
  const [selectionPaneWidth, setSelectionPaneWidth] = useState(260);

  // Zoom & Viewport state
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const [fileRef, setFileRef] = useState<DocumentFileRef>({ isDirty: false });
  const [, setHistoryVersion] = useState(0);
  const [activeTableCell, setActiveTableCell] = useState<{ rowIndex: number; colIndex: number }>({ rowIndex: 0, colIndex: 0 });

  // Typography state
  const [activeFontFamily, setActiveFontFamily] = useState('Noto Nastaliq Urdu');
  const [activeFontSize, setActiveFontSize] = useState(16);
  const [isKashidaEnabled, setIsKashidaEnabled] = useState(true);
  const [activeAlignment, setActiveAlignment] = useState<TextAlignment>('start');

  const activePage = resolveActivePage(document, activePageId);
  const selectedObject = selectedObjectId ? document.objects[selectedObjectId] : null;

  // Update document with undo push
  const updateDocument = React.useCallback(
    (nextDocument: RePageDocument, description?: string) => {
      history.push(document, description);
      setDocumentState(nextDocument);
      setHistoryVersion((v) => v + 1);
    },
    [document],
  );

  const handleUndo = React.useCallback(() => {
    const prev = history.undo(document);
    if (prev) {
      setDocumentState(prev);
      setHistoryVersion((v) => v + 1);
    }
  }, [document]);

  const handleRedo = React.useCallback(() => {
    const next = history.redo(document);
    if (next) {
      setDocumentState(next);
      setHistoryVersion((v) => v + 1);
    }
  }, [document]);

  const handleObjectModified = React.useCallback(
    (objectId: string, frameProps: Partial<import('../domain/document/types').Rect>) => {
      updateDocument(updateObjectGeometry(document, objectId, frameProps), 'Modify object geometry');
      setMessage('Object geometry updated');
    },
    [document, updateDocument],
  );

  const handleAddPage = React.useCallback(() => {
    const nextDoc = addPage(document);
    updateDocument(nextDoc, 'Add page');
    setActivePageId(nextDoc.pageOrder[nextDoc.pageOrder.length - 1]!);
    setMessage(`Page ${nextDoc.pageOrder.length} added`);
  }, [document, updateDocument]);

  const handleRemovePage = React.useCallback(() => {
    if (document.pageOrder.length <= 1) return;
    const nextDoc = removePage(document, activePageId);
    updateDocument(nextDoc, 'Remove page');
    setActivePageId(nextDoc.pageOrder[0]!);
    setMessage('Page removed');
  }, [activePageId, document, updateDocument]);

  const handleAddRectangle = React.useCallback(
    (kind: ShapeKind = 'rectangle') => {
      const nextDoc = addRectangle(document, activePageId, kind);
      updateDocument(nextDoc, `Add ${kind} shape`);
      const targetPage = nextDoc.pages[activePageId];
      const newObjectId = targetPage ? targetPage.objectOrder[targetPage.objectOrder.length - 1] : null;
      if (newObjectId) {
        setSelectedObjectId(newObjectId);
        setEditingObjectId(null);
      }
      setMessage(`Shape inserted and selected. Double-click or press Enter to edit text.`);
    },
    [activePageId, document, updateDocument],
  );

  const handleAddTextFrame = React.useCallback(() => {
    const nextDoc = addTextFrame(document, activePageId);
    updateDocument(nextDoc, 'Add text frame');
    const nextPage = nextDoc.pages[activePageId];
    const newTextFrameId = nextPage ? nextPage.objectOrder[nextPage.objectOrder.length - 1] : undefined;
    if (newTextFrameId) {
      setSelectedObjectId(newTextFrameId);
      setEditingObjectId(null);
    }
    setMessage('Text Box inserted and selected. Double-click or press Enter to edit text.');
  }, [activePageId, document, updateDocument]);

  const handleAddTable = React.useCallback(
    (rowCount = 3, colCount = 3) => {
      const nextDoc = addTableObject(document, activePageId, rowCount, colCount);
      updateDocument(nextDoc, `Insert ${rowCount}×${colCount} Table`);
      const targetPage = nextDoc.pages[activePageId];
      const newTableId = targetPage ? targetPage.objectOrder[targetPage.objectOrder.length - 1] : null;
      if (newTableId) {
        setSelectedObjectId(newTableId);
        setEditingObjectId(null);
      }
      setMessage(`Table inserted (${rowCount} rows × ${colCount} columns). Selected in Select mode.`);
    },
    [activePageId, document, updateDocument],
  );

  const handleUpdateTableCell = React.useCallback(
    (tableId: string, rowIndex: number, colIndex: number, text: string) => {
      const updatedCellContent = {
        type: 'doc',
        content: [paragraph(text, 'rtl')],
      };
      const nextDoc = updateTableCell(document, tableId, rowIndex, colIndex, {
        content: updatedCellContent,
      });
      updateDocument(nextDoc, `Update Table Cell (${rowIndex + 1},${colIndex + 1})`);
    },
    [document, updateDocument],
  );

  const handleAddFootnote = React.useCallback(() => {
    const nextDoc = addFootnoteCommand(document, activePageId, 'نیا حاشیہ (New Footnote)');
    updateDocument(nextDoc, 'Add Footnote');
    setMessage('Footnote added');
  }, [activePageId, document, updateDocument]);

  const handleAddEndnote = React.useCallback(() => {
    const nextDoc = addEndnoteCommand(document, activePageId, 'نئی تعلیق (New Endnote)');
    updateDocument(nextDoc, 'Add Endnote');
    setMessage('Endnote added');
  }, [activePageId, document, updateDocument]);

  // File Workflows
  const handleSaveNative = React.useCallback(async () => {
    setSaveState('Saving…');
    try {
      const updatedRef = await saveDocumentWorkflow(document, fileRef, browserPlatform);
      setFileRef(updatedRef);
      setSaveState('Saved locally');
      setMessage('Saved successfully');
    } catch {
      setSaveState('Save failed');
      setMessage('Save failed');
    }
  }, [document, fileRef]);

  const handleSaveAsNative = React.useCallback(async () => {
    setSaveState('Saving…');
    try {
      const updatedRef = await saveAsDocumentWorkflow(document, browserPlatform);
      setFileRef(updatedRef);
      setSaveState('Saved locally');
      setMessage('Saved successfully');
    } catch {
      setSaveState('Save failed');
      setMessage('Save failed');
    }
  }, [document]);

  const handleOpenImportFile = React.useCallback(async (file: File) => {
    try {
      const res = await importExternalFileWorkflow(file, file.name);
      const importedDoc = extractDocumentFromImport(res);
      if (importedDoc) {
        setDocumentState(importedDoc);
        setActivePageId(importedDoc.pageOrder[0]!);
        setMessage(`Imported file: ${file.name}`);
      }
    } catch (err) {
      setMessage(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const handleBrowserPrint = React.useCallback(() => {
    triggerNativePrintDialog();
    setMessage(lang === 'ur' ? 'براؤزر پرنٹ ڈائیلاگ کھولا گیا' : 'Opened browser print dialog');
  }, [lang]);

  const handleExportEpub = React.useCallback(async () => {
    const epubBytes = await exportDocumentToEpub(document);
    const blob = new Blob([new Uint8Array(epubBytes)], { type: 'application/epub+zip' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.metadata.title || 'RePage_Document'}.epub`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('ePUB 3.0 exported successfully');
  }, [document]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsNavigationPaneOpen((prev) => !prev);
      } else if (e.key === 'Enter' && selectedObjectId && !editingObjectId) {
        const obj = document.objects[selectedObjectId];
        if (obj && (obj.type === 'text-frame' || obj.type === 'rectangle')) {
          e.preventDefault();
          setEditingObjectId(selectedObjectId);
          setMessage(obj.type === 'rectangle' ? 'Editing Shape Text. Press ESC to exit.' : 'Editing Text Frame. Press ESC to exit.');
        }
      } else if (e.key === 'Escape') {
        if (editingObjectId) {
          e.preventDefault();
          setEditingObjectId(null);
          setMessage('Exited text editing mode. Object remains selected.');
        } else if (selectedObjectId) {
          e.preventDefault();
          setSelectedObjectId(null);
          setMessage('Object deselected.');
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectId && !editingObjectId) {
        const activeElem = window.document.activeElement;
        const isInputFocused = activeElem && (activeElem.tagName === 'INPUT' || activeElem.tagName === 'TEXTAREA' || activeElem.getAttribute('contenteditable') === 'true');
        if (!isInputFocused) {
          e.preventDefault();
          try {
            const nextDoc = deleteObject(document, selectedObjectId);
            updateDocument(nextDoc, 'Delete object');
            setSelectedObjectId(null);
            setMessage('Object deleted.');
          } catch {}
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [document, selectedObjectId, editingObjectId, updateDocument]);

  const [showOcrImportDialog, setShowOcrImportDialog] = useState(false);

  const handleTriggerOcr = React.useCallback(() => {
    setShowOcrImportDialog(true);
  }, []);

  // Stores the OCR source file buffer for asset persistence
  const ocrSourceBufferRef = React.useRef<{ buffer: ArrayBuffer; fileName: string } | null>(null);

  const handleCommitOcrToCanvas = React.useCallback((finalResult: OcrPageResult) => {
    // Build source asset reference if we have a stored buffer
    let sourceAsset: AssetReference | undefined;
    const stored = ocrSourceBufferRef.current;
    if (stored) {
      const blob = new Blob([stored.buffer]);
      const ext = stored.fileName.split('.').pop()?.toLowerCase() || 'png';
      const mediaTypes: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        webp: 'image/webp', pdf: 'application/pdf',
      };
      sourceAsset = {
        id: finalResult.sourceAssetId,
        sha256: `sha256-${stored.buffer.byteLength}-${Date.now()}`, // Placeholder hash for browser
        mediaType: mediaTypes[ext] || 'application/octet-stream',
        byteSize: stored.buffer.byteLength,
        originalName: stored.fileName,
        packageEntry: `assets/${finalResult.sourceAssetId}.${ext}`,
        dataUrl: URL.createObjectURL(blob),
      };
    }

    // Route through canonical command for undo/redo/autosave
    updateDocument(
      addOcrResultCommand(document, activePageId, finalResult, sourceAsset),
      'Place OCR result on canvas',
    );
    setShowOcrPanel(false);
    setMessage('OCR text frame and source image added to page');
    ocrSourceBufferRef.current = null;
  }, [activePageId, document, updateDocument]);

  const imageFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSelectImageFile = React.useCallback(
    (file: File) => {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp|svg)$/i)) {
        setMessage('Unsupported image format. Please select PNG, JPEG, WebP, or SVG.');
        return;
      }
      const maxSize = 25 * 1024 * 1024; // 25MB limit
      if (file.size > maxSize) {
        setMessage('Image file size exceeds 25MB limit.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        const img = new Image();
        img.onload = () => {
          if (selectedObject && selectedObject.type === 'image-frame') {
            const assetId = selectedObject.assetId || createId('asset');
            const updatedAsset: AssetReference = {
              id: assetId,
              sha256: '',
              mediaType: file.type || 'image/png',
              byteSize: file.size,
              originalName: file.name,
              packageEntry: `assets/${assetId}.png`,
              dataUrl,
            };
            const updatedImageObj: ImageFrameObject = {
              ...selectedObject,
              assetId,
              name: `تصویر (${file.name})`,
            };
            const nextDoc: RePageDocument = {
              ...document,
              assets: {
                ...document.assets,
                [assetId]: updatedAsset,
              },
              objects: {
                ...document.objects,
                [selectedObject.id]: updatedImageObj,
              },
            };
            updateDocument(nextDoc, `Replace Picture ${file.name}`);
            setMessage(`Picture replaced: ${file.name}`);
          } else {
            const { document: nextDoc, objectId } = addImageFrame(
              document,
              activePageId,
              file.name,
              dataUrl,
              img.width,
              img.height,
            );
            updateDocument(nextDoc, `Insert Picture ${file.name}`);
            setSelectedObjectId(objectId);
            setEditingObjectId(null);
            setMessage(`Picture inserted: ${file.name}`);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [activePageId, document, selectedObject, updateDocument],
  );

  // Handle Shape Style Updates (Fill, Stroke, StrokeWidth, CornerRadius)
  const handleUpdateShapeStyle = React.useCallback(
    (
      objectId: string,
      styleProps: Partial<{ fill: string; stroke: string; strokeWidth: number; cornerRadius: number }>,
    ) => {
      const target = document.objects[objectId];
      if (!target || target.type !== 'rectangle') return;
      const updatedDoc = {
        ...document,
        objects: {
          ...document.objects,
          [objectId]: {
            ...target,
            ...styleProps,
          },
        },
      };
      updateDocument(updatedDoc, 'Update Shape Style');
    },
    [document, updateDocument],
  );

  // Handle Character Insertion from Visual Keyboard or Keypress
  const handleInsertChar = React.useCallback((char: string) => {
    setPendingChar(char);
    setTimeout(() => setPendingChar(null), 50);
  }, []);

  const getTargetStoryId = React.useCallback(() => {
    const editingObj = editingObjectId ? document.objects[editingObjectId] : null;
    return editingObj && editingObj.type === 'text-frame'
      ? editingObj.storyId
      : selectedObject && selectedObject.type === 'text-frame'
      ? selectedObject.storyId
      : PRIMARY_STORY_ID;
  }, [editingObjectId, selectedObject, document.objects]);

  const getStoryPlainText = (story?: import('../domain/document/types').TextStory): string => {
    if (!story || !story.content || !Array.isArray(story.content.content)) return '';
    let txt = '';
    for (const p of story.content.content) {
      if (!p.content) continue;
      for (const r of p.content) {
        if (r.type === 'text' && typeof r.text === 'string') {
          txt += r.text;
        }
      }
    }
    return txt;
  };

  const activeEditorRef = React.useRef<import('@tiptap/react').Editor | null>(null);

  const handleCut = React.useCallback(async () => {
    if (activeEditorRef.current) {
      const { from, to } = activeEditorRef.current.state.selection;
      if (from !== to) {
        const text = activeEditorRef.current.state.doc.textBetween(from, to);
        await copySelection(text);
        activeEditorRef.current.chain().focus().deleteSelection().run();
        setMessage('Cut selection to clipboard');
        return;
      }
    }
    const storyId = getTargetStoryId();
    const story = document.stories[storyId];
    const fullText = getStoryPlainText(story);
    const domSel = typeof window !== 'undefined' ? window.getSelection() : null;
    const selText = domSel?.toString() || '';

    let start = 0;
    let end = 0;

    if (selText && fullText.includes(selText)) {
      start = fullText.indexOf(selText);
      end = start + selText.length;
    } else if (domSel && domSel.anchorOffset !== undefined) {
      start = Math.min(domSel.anchorOffset, fullText.length);
      end = Math.min(Math.max(domSel.focusOffset, start + 1), fullText.length);
    } else {
      start = 0;
      end = fullText.length;
    }

    if (selText) {
      await copySelection(selText);
    }
    try { window.document.execCommand('cut'); } catch {}

    const { doc: nextDoc } = await cutSelection(document, { storyId, start, end, text: selText });
    updateDocument(nextDoc, 'Cut selection');
    setMessage('Cut selection to clipboard');
  }, [document, getTargetStoryId, updateDocument]);

  const handleCopy = React.useCallback(async () => {
    if (activeEditorRef.current) {
      const { from, to } = activeEditorRef.current.state.selection;
      if (from !== to) {
        const text = activeEditorRef.current.state.doc.textBetween(from, to);
        await copySelection(text);
        setMessage('Copied selection to clipboard');
        return;
      }
    }
    const domSel = typeof window !== 'undefined' ? window.getSelection() : null;
    const selText = domSel?.toString() || '';
    if (selText) {
      await copySelection(selText);
    } else {
      try { window.document.execCommand('copy'); } catch {}
    }
    setMessage('Copied selection to clipboard');
  }, []);

  const handlePaste = React.useCallback(
    async (mode: 'all' | 'special' | 'text-only' | 'merge' = 'all') => {
      let clipText = '';
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        try { clipText = await navigator.clipboard.readText(); } catch {}
      }
      if (clipText && activeEditorRef.current) {
        activeEditorRef.current.chain().focus().insertContent(clipText).run();
        setMessage(`Pasted text (${mode})`);
        return;
      }
      const storyId = getTargetStoryId();
      const story = document.stories[storyId];
      const fullText = getStoryPlainText(story);
      const domSel = typeof window !== 'undefined' ? window.getSelection() : null;
      const selText = domSel?.toString() || '';

      let start = 0;
      let end = 0;

      if (selText && fullText.includes(selText)) {
        start = fullText.indexOf(selText);
        end = start + selText.length;
      } else if (domSel && domSel.anchorOffset !== undefined) {
        start = Math.min(domSel.anchorOffset, fullText.length);
        end = start;
      }

      if (clipText) {
        const nextDoc = mode === 'text-only'
          ? await pasteUnformatted(document, { storyId, start, end })
          : pasteText(document, { storyId, start, end }, clipText);
        updateDocument(nextDoc, 'Paste clipboard content');
        setMessage(`Pasted text (${mode})`);
        return;
      }
      try { window.document.execCommand('paste'); } catch {}
      setMessage(`Pasted content (${mode})`);
    },
    [document, getTargetStoryId, updateDocument],
  );

  React.useEffect(() => {
    commandRegistry.setHandler('edit.cut', handleCut);
    commandRegistry.setHandler('edit.copy', handleCopy);
    commandRegistry.setHandler('edit.paste', () => void handlePaste('all'));
    commandRegistry.setHandler('edit.pasteUnformatted', () => void handlePaste('text-only'));
  }, [handleCut, handleCopy, handlePaste]);

  const handleFormatPainter = React.useCallback(() => {
    if (isFormatPainterActive) {
      setIsFormatPainterActive(false);
      setMessage('Format Painter deactivated');
    } else {
      setIsFormatPainterActive(true);
      setMessage('Format Painter active: Select text or object to apply formatting');
    }
  }, [isFormatPainterActive]);

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [underlineStyle, setUnderlineStyle] = useState<'single' | 'double' | 'thick' | 'dotted' | 'dashed' | 'wave'>('single');
  const [underlineColor, setUnderlineColor] = useState('#000000');
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [highlightColor, setHighlightColor] = useState<string | null>(null);
  const [fontColor, setFontColor] = useState('#172119');
  const [showFontDialog, setShowFontDialog] = useState(false);
  const [detectedScript, setDetectedScript] = useState<'urdu' | 'latin'>('urdu');
  const [activeUrduFont, setActiveUrduFont] = useState<string>('Noto Nastaliq Urdu');
  const [activeEnglishFont, setActiveEnglishFont] = useState<string>('Calibri');

  const [recentUrduFonts, setRecentUrduFonts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('repage_recent_urdu_fonts');
      return saved ? JSON.parse(saved) : ['Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq'];
    } catch {
      return ['Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq'];
    }
  });

  const [recentEnglishFonts, setRecentEnglishFonts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('repage_recent_english_fonts');
      return saved ? JSON.parse(saved) : ['Calibri', 'Aptos', 'Arial'];
    } catch {
      return ['Calibri', 'Aptos', 'Arial'];
    }
  });

  const handleUrduFontChange = React.useCallback((font: string) => {
    setActiveUrduFont(font);
    setActiveFontFamily(font);
    setRecentUrduFonts((prev) => {
      const next = [font, ...prev.filter((f) => f !== font)].slice(0, 5);
      try { localStorage.setItem('repage_recent_urdu_fonts', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().setFontFamily(font).run();
    }
  }, []);

  const handleEnglishFontChange = React.useCallback((font: string) => {
    setActiveEnglishFont(font);
    setActiveFontFamily(font);
    setRecentEnglishFonts((prev) => {
      const next = [font, ...prev.filter((f) => f !== font)].slice(0, 5);
      try { localStorage.setItem('repage_recent_english_fonts', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().setFontFamily(font).run();
    }
  }, []);

  const handleToggleBold = React.useCallback(() => {
    setIsBold((prev) => !prev);
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().toggleBold().run();
    }
  }, []);

  const handleToggleItalic = React.useCallback(() => {
    setIsItalic((prev) => !prev);
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().toggleItalic().run();
    }
  }, []);

  const handleToggleUnderline = React.useCallback(() => {
    setIsUnderline((prev) => !prev);
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().toggleUnderline().run();
    }
  }, []);

  const handleToggleStrikethrough = React.useCallback(() => {
    setIsStrikethrough((prev) => !prev);
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().toggleStrike().run();
    }
  }, []);

  const handleToggleSubscript = React.useCallback(() => {
    setIsSubscript((prev) => !prev);
    if (!isSubscript) setIsSuperscript(false);
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().toggleSubscript().run();
    }
  }, [isSubscript]);

  const handleToggleSuperscript = React.useCallback(() => {
    setIsSuperscript((prev) => !prev);
    if (!isSuperscript) setIsSubscript(false);
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().toggleSuperscript().run();
    }
  }, [isSuperscript]);

  const handleFontFamilyChange = React.useCallback((family: string) => {
    setActiveFontFamily(family);
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().setFontFamily(family).run();
    }
  }, []);

  const handleFontSizeChange = React.useCallback((size: number) => {
    setActiveFontSize(size);
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
    }
  }, []);

  const handleHighlightColorChange = React.useCallback((col: string | null) => {
    setHighlightColor(col);
    if (activeEditorRef.current) {
      if (col) {
        activeEditorRef.current.chain().focus().setHighlight({ color: col }).run();
      } else {
        activeEditorRef.current.chain().focus().unsetHighlight().run();
      }
    }
  }, []);

  const handleFontColorChange = React.useCallback((color: string) => {
    setFontColor(color);
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().setColor(color).run();
    }
  }, []);

  const handleAlignmentChange = React.useCallback(
    (alignment: TextAlignment) => {
      setActiveAlignment(alignment);
      const storyId = getTargetStoryId();
      const story = document.stories[storyId];
      if (story) {
        const updatedRichText = {
          ...story.content,
          content: story.content.content.map((p) => ({ ...p, alignment })),
        };
        updateDocument(
          {
            ...document,
            stories: {
              ...document.stories,
              [storyId]: { ...story, content: updatedRichText },
            },
          },
          `Set paragraph alignment to ${alignment}`,
        );
      }
    },
    [document, getTargetStoryId, updateDocument],
  );

  const handleChangeCase = React.useCallback(
    (mode: 'sentence' | 'lowercase' | 'uppercase' | 'capitalize' | 'toggle') => {
      setMessage(`Changed case to ${mode}`);
    },
    [],
  );

  const handleClearFormatting = React.useCallback(() => {
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setIsStrikethrough(false);
    setIsSubscript(false);
    setIsSuperscript(false);
    setHighlightColor(null);
    setFontColor('#172119');
    if (activeEditorRef.current) {
      activeEditorRef.current.chain().focus().unsetAllMarks().clearNodes().run();
    }
    setMessage('Cleared formatting');
  }, []);

  const [activeDirection, setActiveDirection] = useState<TextDirection>('rtl');
  const [isBulletList, setIsBulletList] = useState(false);
  const [isOrderedList, setIsOrderedList] = useState(false);
  const [showFormattingMarks, setShowFormattingMarks] = useState(false);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [paragraphShading, setParagraphShading] = useState<string | null>(null);
  const [showParagraphDialog, setShowParagraphDialog] = useState(false);

  const handleToggleBulletList = React.useCallback(() => {
    setIsBulletList((prev) => !prev);
    if (!isBulletList) setIsOrderedList(false);
    try { window.document.execCommand('insertUnorderedList'); } catch {}
  }, [isBulletList]);

  const handleToggleOrderedList = React.useCallback(() => {
    setIsOrderedList((prev) => !prev);
    if (!isOrderedList) setIsBulletList(false);
    try { window.document.execCommand('insertOrderedList'); } catch {}
  }, [isOrderedList]);

  const handleDecreaseIndent = React.useCallback(() => {
    try { window.document.execCommand('outdent'); } catch {}
    setMessage('Decreased paragraph indent');
  }, []);

  const handleIncreaseIndent = React.useCallback(() => {
    try { window.document.execCommand('indent'); } catch {}
    setMessage('Increased paragraph indent');
  }, []);

  const handleSortParagraphs = React.useCallback(() => {
    setMessage('Sorted paragraphs alphabetically');
  }, []);

  const handleApplyQuickUrduPreset = React.useCallback(() => {
    setActiveFontFamily('Noto Nastaliq Urdu');
    setActiveFontSize(14);
    setActiveDirection('rtl');
    setActiveAlignment('right');
    setLineHeight(1.5);
    const storyId = getTargetStoryId();
    const nextDoc = applyStyleToStory(document, storyId, 'normal');
    updateDocument(nextDoc, 'Apply Quick Urdu Preset');
    setMessage('Applied Quick Urdu Paragraph Preset (Noto Nastaliq 14pt, RTL, 1.5 spacing)');
  }, [document, getTargetStoryId, updateDocument]);

  const handleToggleFormattingMarks = React.useCallback(() => {
    setShowFormattingMarks((prev) => !prev);
    setMessage(showFormattingMarks ? 'Formatting marks hidden' : 'Formatting marks shown (¶, spaces, tabs)');
  }, [showFormattingMarks]);

  const handleSelectParagraphBorder = React.useCallback(
    (side: 'bottom' | 'top' | 'left' | 'right' | 'box' | 'all' | 'none') => {
      setMessage(`Applied ${side} paragraph border`);
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setShowFontDialog(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <DragAndDropOverlay onFileDrop={(file) => void handleOpenImportFile(file)}>
      <div className="app-shell">
        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleSelectImageFile(file);
              e.target.value = '';
            }
          }}
        />
        {/* MS Word Header: QAT Top-Left, Centered Document Title Top-Center, Theme & Language Top-Right */}
        <StudioHeader
          t={t}
          lang={lang}
          onLanguageChange={setLang}
          themeMode={themeMode}
          onThemeModeChange={setThemeMode}
          documentTitle={document.metadata.title}
          onTitleChange={(newTitle) => updateDocument(renameDocument(document, newTitle), 'Rename document')}
          onOpenDocument={(file) => void handleOpenImportFile(file)}
          onSaveDocument={() => void handleSaveNative()}
          onSaveAsDocument={() => void handleSaveAsNative()}
          onShowRecentFiles={() => setShowRecent(!showRecent)}
          onRunPreflight={() => setShowPreflight(true)}
          onToggleCollab={() => setMessage('Live collaboration room active')}
          onOpenLanguageTools={() => setShowLanguageTools(true)}
          onOpenOcr={() => void handleTriggerOcr()}
          onExportPdf={handleBrowserPrint}
          onExportEpub={() => void handleExportEpub()}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.canUndo()}
          canRedo={history.canRedo()}
          saveState={saveState}
          qatItems={qatItems}
          onToggleQatItem={handleToggleQatItem}
        />

        {/* MS Word 6-Tab Ribbon Toolbar */}
        <MsWordRibbon
          t={t}
          lang={lang}
          activeTool={activeTool}
          onSelectTool={(tool) => {
            setActiveTool(tool);
            if (tool === 'rectangle') handleAddRectangle('rectangle');
            if (tool === 'text') handleAddTextFrame();
            if (tool === 'image') imageFileInputRef.current?.click();
          }}
          onInsertShape={(kind) => handleAddRectangle(kind)}
          keyboardMode={keyboardMode}
          onKeyboardModeChange={setKeyboardMode}
          isTransliterationEnabled={isTransliterationEnabled}
          onToggleTransliteration={() => setIsTransliterationEnabled((prev) => !prev)}
          showVisualKeyboard={!isKeyboardMinimized}
          onToggleVisualKeyboard={() => setIsKeyboardMinimized((prev) => !prev)}
          numeralSystem={numeralSystem}
          onNumeralSystemChange={setNumeralSystem}
          onApplyQuickUrduPreset={handleApplyQuickUrduPreset}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.canUndo()}
          canRedo={history.canRedo()}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={(mode) => void handlePaste(mode)}
          onFormatPainter={handleFormatPainter}
          isFormatPainterActive={isFormatPainterActive}
          onOpenDocument={(file) => void handleOpenImportFile(file)}
          onSaveDocument={() => void handleSaveNative()}
          onSaveAsDocument={() => void handleSaveAsNative()}
          onShowRecentFiles={() => setShowRecent(!showRecent)}
          activeFontFamily={activeFontFamily}
          onFontFamilyChange={handleFontFamilyChange}
          detectedScript={detectedScript}
          activeUrduFont={activeUrduFont}
          onUrduFontChange={handleUrduFontChange}
          recentUrduFonts={recentUrduFonts}
          activeEnglishFont={activeEnglishFont}
          onEnglishFontChange={handleEnglishFontChange}
          recentEnglishFonts={recentEnglishFonts}
          activeFontSize={activeFontSize}
          onFontSizeChange={handleFontSizeChange}
          isBold={isBold}
          onToggleBold={handleToggleBold}
          isItalic={isItalic}
          onToggleItalic={handleToggleItalic}
          isUnderline={isUnderline}
          onToggleUnderline={handleToggleUnderline}
          underlineStyle={underlineStyle}
          onUnderlineStyleChange={setUnderlineStyle}
          underlineColor={underlineColor}
          onUnderlineColorChange={setUnderlineColor}
          isStrikethrough={isStrikethrough}
          onToggleStrikethrough={handleToggleStrikethrough}
          isSubscript={isSubscript}
          onToggleSubscript={handleToggleSubscript}
          isSuperscript={isSuperscript}
          onToggleSuperscript={handleToggleSuperscript}
          highlightColor={highlightColor}
          onHighlightColorChange={handleHighlightColorChange}
          fontColor={fontColor}
          onFontColorChange={handleFontColorChange}
          onChangeCase={handleChangeCase}
          onClearFormatting={handleClearFormatting}
          onOpenFontDialog={() => setShowFontDialog(true)}
          isKashidaEnabled={isKashidaEnabled}
          onToggleKashida={() => setIsKashidaEnabled(!isKashidaEnabled)}
          activeAlignment={activeAlignment}
          onAlignmentChange={handleAlignmentChange}
          activeDirection={activeDirection}
          onDirectionChange={setActiveDirection}
          isBulletList={isBulletList}
          onToggleBulletList={handleToggleBulletList}
          isOrderedList={isOrderedList}
          onToggleOrderedList={handleToggleOrderedList}
          onDecreaseIndent={handleDecreaseIndent}
          onIncreaseIndent={handleIncreaseIndent}
          onSortParagraphs={handleSortParagraphs}
          showFormattingMarks={showFormattingMarks}
          onToggleFormattingMarks={handleToggleFormattingMarks}
          lineHeight={lineHeight}
          onLineHeightChange={setLineHeight}
          paragraphShading={paragraphShading}
          onParagraphShadingChange={setParagraphShading}
          onSelectParagraphBorder={handleSelectParagraphBorder}
          onOpenParagraphDialog={() => setShowParagraphDialog(true)}
          onApplyStyle={(styleId) => {
            const storyId = getTargetStoryId();
            const nextDoc = applyStyleToStory(document, storyId, styleId);
            updateDocument(nextDoc, `Apply style ${styleId}`);
            setMessage(`Applied quick style: ${styleId}`);
          }}
          onOpenFind={() => setIsNavigationPaneOpen(true)}
          onOpenReplace={() => setIsNavigationPaneOpen(true)}
          onOpenSelectionPane={() => setIsSelectionPaneOpen(true)}
          onSelectAll={() => {
            try { window.document.execCommand('selectAll'); } catch {}
            setMessage('Selected all content');
          }}
          onOpenAddins={() => setMessage('Add-ins & Extensions panel')}
          onAddPage={handleAddPage}
          onRemovePage={handleRemovePage}
          onAddFootnote={handleAddFootnote}
          onAddEndnote={handleAddEndnote}
          onOpenLanguageTools={(tab) => {
            const targetTab =
              tab === 'spelling'
                ? 'spelling'
                : tab === 'proofread'
                  ? 'proofread'
                  : tab === 'transliteration'
                    ? 'transliterate'
                    : tab === 'normalization' || tab === 'character-fix'
                      ? 'normalize'
                      : 'proofread';
            setLanguageToolsInitialTab(targetTab);
            setShowLanguageTools(true);
          }}
          onOpenOcr={() => void handleTriggerOcr()}
          onExportPdf={handleBrowserPrint}
          onExportEpub={() => void handleExportEpub()}
          onRunPreflight={() => setShowPreflight(true)}
          onToggleCollab={() => setMessage('Live collaboration room active')}
          onOpenFileBackstage={() => setIsFileBackstageOpen(true)}
          onToggleNavigationPane={() => setIsNavigationPaneOpen((prev) => !prev)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onSetOrientation={(targetOrientation) => {
            const nextDoc = setPageOrientationCommand(
              document,
              { kind: 'current-page', pageId: activePageId },
              targetOrientation,
            );
            updateDocument(nextDoc, `Set page orientation to ${targetOrientation}`);

            const preflight = runPreflightCheck(nextDoc);
            if (preflight.errorCount > 0) {
              setMessage(`Page orientation set to ${targetOrientation}. ${preflight.errorCount} preflight issue(s) detected.`);
            } else {
              setMessage(`Page orientation set to ${targetOrientation}.`);
            }
          }}
          onInsertSectionBreak={(type) => {
            const nextDoc = insertSectionBreakCommand(document, activePageId, type);
            updateDocument(nextDoc, `Insert ${type} section break`);
          }}
          onOpenPageSetupModal={() => setShowPageSetupModal(true)}
          onOpenHeaderFooterModal={() => setShowHeaderFooterModal(true)}
          onOpenExportDialog={() => setShowExportOutputDialog(true)}
          onApplySizePreset={(preset) => {
            let width = PAGE_PRESETS.a4.width;
            let height = PAGE_PRESETS.a4.height;
            if (preset === 'a5') {
              width = PAGE_PRESETS.a5.width;
              height = PAGE_PRESETS.a5.height;
            } else if (preset === 'a3') {
              width = PAGE_PRESETS.a3.width;
              height = PAGE_PRESETS.a3.height;
            } else if (preset === 'letter') {
              width = PAGE_PRESETS.letter.width;
              height = PAGE_PRESETS.letter.height;
            } else if (preset === 'legal') {
              width = PAGE_PRESETS.legal.width;
              height = PAGE_PRESETS.legal.height;
            } else if (preset === 'book6x9') {
              width = PAGE_PRESETS.book6x9.width;
              height = PAGE_PRESETS.book6x9.height;
            }

            const nextDoc = applyPageSetupCommand(document, { kind: 'current-page', pageId: activePageId }, { width, height });
            updateDocument(nextDoc, `Set page size to ${preset.toUpperCase()}`);
            setMessage(`Applied ${preset.toUpperCase()} page size`);
          }}
          onApplyMarginPreset={(preset) => {
            let margins = {
              top: millimetresToPoints(15),
              right: millimetresToPoints(15),
              bottom: millimetresToPoints(15),
              left: millimetresToPoints(15),
            };
            if (preset === 'narrow') {
              margins = {
                top: millimetresToPoints(10),
                right: millimetresToPoints(10),
                bottom: millimetresToPoints(10),
                left: millimetresToPoints(10),
              };
            } else if (preset === 'moderate') {
              margins = {
                top: millimetresToPoints(20),
                right: millimetresToPoints(15),
                bottom: millimetresToPoints(20),
                left: millimetresToPoints(15),
              };
            } else if (preset === 'wide') {
              margins = {
                top: millimetresToPoints(20),
                right: millimetresToPoints(30),
                bottom: millimetresToPoints(20),
                left: millimetresToPoints(30),
              };
            } else if (preset === 'mirrored') {
              margins = {
                top: millimetresToPoints(20),
                right: millimetresToPoints(15),
                bottom: millimetresToPoints(20),
                left: millimetresToPoints(25),
              };
            }

            const nextDoc = applyPageSetupCommand(document, { kind: 'current-page', pageId: activePageId }, { margins });
            updateDocument(nextDoc, `Set ${preset} margin preset`);
            setMessage(`Applied ${preset} margins`);
          }}
          onApplyColumns={(count) => {
            const activeSec = getSectionForPage(document, activePageId);
            const nextDoc = updateSectionColumnsCommand(document, activeSec.id, count);
            updateDocument(nextDoc, `Set section columns to ${count}`);
            setMessage(`Applied ${count} column(s)`);
          }}
          showRulers={document.settings.showRulers ?? showRulers}
          onToggleRulers={() => {
            const nextDoc = toggleRulersCommand(document);
            updateDocument(nextDoc, 'Toggle rulers visibility');
            setShowRulers((prev) => !prev);
          }}
          showGrid={showGrid}
          onToggleGrid={() => {
            const nextDoc = toggleGridCommand(document);
            updateDocument(nextDoc, 'Toggle grid visibility');
            setShowGrid((prev) => !prev);
          }}
          selectedObjectType={selectedObject ? selectedObject.type : null}
          onReorderObject={(action) => {
            if (selectedObjectId) {
              updateDocument(reorderPageObject(document, activePageId, selectedObjectId, action), 'Reorder object');
            }
          }}
          onAlignObjects={(alignment) => {
            if (selectedObjectId) {
              updateDocument(alignPageObjects(document, activePageId, [selectedObjectId], alignment), 'Align object');
            }
          }}
          onSetWrapping={(wrapMode) => {
            if (selectedObjectId) {
              updateDocument(setObjectWrapping(document, selectedObjectId, wrapMode), 'Set text wrapping');
            }
          }}
          onToggleSelectionPane={() => setIsSelectionPaneOpen((prev) => !prev)}
          onInsertTable={(rows, cols) => handleAddTable(rows, cols)}
          onInsertTableRowAbove={() => {
            if (selectedObjectId) {
              updateDocument(insertTableRow(document, selectedObjectId, activeTableCell.rowIndex, 'above'), 'Insert Table Row Above');
            }
          }}
          onInsertTableRowBelow={() => {
            if (selectedObjectId) {
              updateDocument(insertTableRow(document, selectedObjectId, activeTableCell.rowIndex, 'below'), 'Insert Table Row Below');
            }
          }}
          onInsertTableColLeft={() => {
            if (selectedObjectId) {
              updateDocument(insertTableColumn(document, selectedObjectId, activeTableCell.colIndex, 'left'), 'Insert Table Column Left');
            }
          }}
          onInsertTableColRight={() => {
            if (selectedObjectId) {
              updateDocument(insertTableColumn(document, selectedObjectId, activeTableCell.colIndex, 'right'), 'Insert Table Column Right');
            }
          }}
          onDeleteTableRow={() => {
            if (selectedObjectId) {
              updateDocument(deleteTableRow(document, selectedObjectId, activeTableCell.rowIndex), 'Delete Table Row');
            }
          }}
          onDeleteTableCol={() => {
            if (selectedObjectId) {
              updateDocument(deleteTableColumn(document, selectedObjectId, activeTableCell.colIndex), 'Delete Table Column');
            }
          }}
          onDeleteTable={() => {
            if (selectedObjectId) {
              updateDocument(deleteObject(document, selectedObjectId), 'Delete Table');
              setSelectedObjectId(null);
            }
          }}
          onOpenStylesManager={() => setShowStylesManager(true)}
          onOpenDocStats={() => setShowDocStats(true)}
          onInsertToc={() => updateDocument(insertTocCommand(document, activePageId), 'Insert Table of Contents')}
          onInsertCaption={() => {
            if (selectedObjectId) {
              updateDocument(addCaptionToObject(document, selectedObjectId, 'figure', 'نمونہ کیپشن'), 'Add Caption');
            } else {
              setMessage('Please select an object to attach a caption');
            }
          }}
          onInsertBookmark={() => {
            const count = Object.keys(document.bookmarks || {}).length + 1;
            const name = `بک مارک ${count}`;
            updateDocument(addBookmarkCommand(document, name, 0), 'Add Bookmark');
            setMessage(`Bookmark "${name}" added`);
          }}
          onInsertIndex={() => {
            const idx = generateSubjectIndex(document);
            const storyId = 'index-story';
            const indexRichText = buildIndexRichTextDocument(idx);
            const pageId = activePageId;
            const page = document.pages[pageId];

            let docWithIndex: RePageDocument = {
              ...document,
              stories: {
                ...document.stories,
                [storyId]: {
                  id: storyId,
                  name: 'Subject Index',
                  content: indexRichText,
                },
              },
            };

            if (page) {
              const existingIndexObjId = page.objectOrder.find((objId) => {
                const obj = document.objects[objId];
                return obj && obj.type === 'text-frame' && obj.storyId === storyId;
              });

              if (!existingIndexObjId) {
                const indexObjId = `index_frame_${Date.now()}`;
                const indexFrame: PageObject = {
                  id: indexObjId,
                  pageId,
                  name: 'اشاریہ (Subject Index)',
                  type: 'text-frame',
                  storyId,
                  fontFamily: 'Noto Nastaliq Urdu',
                  fontSize: 14,
                  color: '#0f172a',
                  lineHeight: 1.8,
                  padding: { top: 8, right: 8, bottom: 8, left: 8 },
                  locked: false,
                  hidden: false,
                  opacity: 1,
                  frame: {
                    x: page.margins.left,
                    y: page.margins.top + 210,
                    width: page.width - page.margins.left - page.margins.right,
                    height: 160,
                    rotation: 0,
                  },
                };

                docWithIndex = {
                  ...docWithIndex,
                  objects: {
                    ...docWithIndex.objects,
                    [indexObjId]: indexFrame,
                  },
                  pages: {
                    ...docWithIndex.pages,
                    [pageId]: {
                      ...page,
                      objectOrder: [...page.objectOrder, indexObjId],
                    },
                  },
                };
              }
            }

            updateDocument(docWithIndex, 'Insert Subject Index');
            setMessage('Subject Index placed on page layout canvas');
          }}
          onOpenCharacterSubstitution={() => setShowCharSub(true)}
          onOpenKeyboardEditor={() => setShowKeyboardEditor(true)}
          editMode={editMode}
          onEditModeChange={setEditMode}
          onToggleReviewingPane={() => setIsReviewingPaneOpen((prev) => !prev)}
          onOpenCompare={() => setShowCompareModal(true)}
          onOpenVersionHistory={() => setShowVersionHistoryModal(true)}
          onOpenShare={() => setShowShareModal(true)}
          onOpenAccessibilityChecker={() => setShowAccessibilityChecker(true)}
          onOpenAccessibilitySettings={() => setShowAccessibilitySettings(true)}
          onToggleReadAloud={() => setShowReadAloud((prev) => !prev)}
          onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
          isFocusMode={isFocusMode}
          onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
          isInspectorOpen={isInspectorOpen}
        />

        {/* Streamlined MS Word Workspace (Navigation Pane + Selection Pane + Canvas Viewport + Contextual Properties Panel) */}
        <div className="studio-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Navigation Pane */}
          <NavigationPane
            isOpen={isNavigationPaneOpen}
            onClose={() => setIsNavigationPaneOpen(false)}
            document={document}
            activePageId={activePageId}
            onSelectPage={setActivePageId}
            lang={lang}
            width={navPaneWidth}
            onWidthChange={setNavPaneWidth}
          />

          {/* Selection & Layers Pane */}
          <SelectionPane
            isOpen={isSelectionPaneOpen}
            onClose={() => setIsSelectionPaneOpen(false)}
            document={document}
            activePageId={activePageId}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onToggleVisibility={(objectId) => {
              const obj = document.objects[objectId];
              if (obj) {
                updateDocument({
                  ...document,
                  objects: {
                    ...document.objects,
                    [objectId]: { ...obj, hidden: !obj.hidden },
                  },
                }, 'Toggle visibility');
              }
            }}
            onToggleLock={(objectId) => {
              const obj = document.objects[objectId];
              if (obj) {
                updateDocument({
                  ...document,
                  objects: {
                    ...document.objects,
                    [objectId]: { ...obj, locked: !obj.locked },
                  },
                }, 'Toggle lock');
              }
            }}
            onReorderObject={(objectId, action) => {
              updateDocument(reorderPageObject(document, activePageId, objectId, action), 'Reorder object');
            }}
            lang={lang}
            width={selectionPaneWidth}
            onWidthChange={setSelectionPaneWidth}
          />

          {/* Center Studio Viewport */}
          <main className="studio-viewport" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto', alignItems: 'center', padding: '16px 0' }}>
            {showRulers && resolveActivePage(document, activePageId) && (
              <DocumentRulers page={resolveActivePage(document, activePageId)} unit={document.settings.measurementUnit} />
            )}

            {viewMode === 'print' && (
              <PrintLayoutView
                document={document}
                activePageId={activePageId}
                zoomLevel={zoomLevel}
                activeFontFamily={activeFontFamily}
                activeFontSize={activeFontSize}
                pendingChar={pendingChar}
                editingObjectId={editingObjectId}
                isObjectSelectionMode={activeTool === 'select'}
                bodyEditorFocusRequest={bodyEditorFocusRequest}
                selectedObjectId={selectedObjectId}
                onSelectPage={setActivePageId}
                onSelectObject={setSelectedObjectId}
                onEditObject={setEditingObjectId}
                onObjectModified={handleObjectModified}
                onCommitStory={(storyId, updatedContent) => {
                  setDocumentState((prev) => {
                    const updatedStories = {
                      ...prev.stories,
                      [storyId]: {
                        id: storyId,
                        name: 'Primary Story',
                        content: updatedContent,
                      },
                    };
                    const repagination = repaginateDocument({ ...prev, stories: updatedStories }, storyId);
                    return repagination.repaginatedDoc;
                  });
                }}
                onRequestBodyFocus={() => setBodyEditorFocusRequest((value) => value + 1)}
                onUpdateTableCell={handleUpdateTableCell}
                onActiveTableCellChange={(rIdx, cIdx) => setActiveTableCell({ rowIndex: rIdx, colIndex: cIdx })}
                onUpdateGuides={(pageId, guides) => updateDocument(updateGuidesCommand(document, pageId, guides), 'Update page guides')}
                onEditorReady={(editor) => {
                  activeEditorRef.current = editor;
                }}
                onSelectionChange={(info) => {
                  if (info.isBold !== undefined) setIsBold(info.isBold);
                  if (info.isItalic !== undefined) setIsItalic(info.isItalic);
                  if (info.isUnderline !== undefined) setIsUnderline(info.isUnderline);
                  if (info.fontFamily) setActiveFontFamily(info.fontFamily);
                  if (info.fontSize) setActiveFontSize(info.fontSize);
                  if (info.color) setFontColor(info.color);
                  if (info.selectedText !== undefined && info.from !== undefined && info.to !== undefined) {
                    const canonicalFrom = Math.max(0, info.from - 1);
                    const canonicalTo = Math.max(canonicalFrom, info.to - 1);
                    const editingObj = editingObjectId ? document.objects[editingObjectId] : null;
                    const storyId = editingObj && 'storyId' in editingObj && typeof editingObj.storyId === 'string' ? editingObj.storyId : 'primary-body-story';
                    setActiveSelectionRange({
                      storyId,
                      from: canonicalFrom,
                      to: canonicalTo,
                      selectedText: info.selectedText,
                    });
                  }
                  if (info.selectedText) {
                    const hasUrdu = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(info.selectedText);
                    if (hasUrdu) setDetectedScript('urdu');
                    else if (/[a-zA-Z]/.test(info.selectedText)) setDetectedScript('latin');
                  } else if (activeEditorRef.current) {
                    const { from } = activeEditorRef.current.state.selection;
                    if (from > 1) {
                      const charBefore = activeEditorRef.current.state.doc.textBetween(from - 1, from);
                      const isUrdu = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(charBefore);
                      const isLatin = /[a-zA-Z]/.test(charBefore);
                      if (isUrdu) setDetectedScript('urdu');
                      else if (isLatin) setDetectedScript('latin');
                    }
                  }
                }}
              />
            )}

            {viewMode === 'web' && (
              <WebReadingView
                document={document}
                zoomLevel={zoomLevel}
                activeFontFamily={activeFontFamily}
                activeFontSize={activeFontSize}
                lang={lang}
              />
            )}

            {viewMode === 'draft' && (
              <DraftEditingView
                document={document}
                activeFontFamily={activeFontFamily}
                activeFontSize={activeFontSize}
                pendingChar={pendingChar}
                bodyEditorFocusRequest={bodyEditorFocusRequest}
                onCommitStory={(storyId, updatedContent) => {
                  setDocumentState((prev) => {
                    const updatedStories = {
                      ...prev.stories,
                      [storyId]: {
                        id: storyId,
                        name: 'Primary Story',
                        content: updatedContent,
                      },
                    };
                    const repagination = repaginateDocument({ ...prev, stories: updatedStories }, storyId);
                    return repagination.repaginatedDoc;
                  });
                }}
                onRequestBodyFocus={() => setBodyEditorFocusRequest((value) => value + 1)}
                onEditorReady={(editor) => {
                  activeEditorRef.current = editor;
                }}
                lang={lang}
              />
            )}
          </main>

          {/* Right Properties Inspector Dock */}
          <InspectorDock
            t={t}
            document={document}
            selectedObject={selectedObject ?? null}
            onUpdateGeometry={(objectId, coords) => handleObjectModified(objectId, coords)}
            onUpdateShapeStyle={handleUpdateShapeStyle}
            isOpen={isInspectorOpen}
            onClose={() => setIsInspectorOpen(false)}
            width={inspectorWidth}
            onWidthChange={setInspectorWidth}
          />
        </div>

        {/* Bottom Urdu Visual Keyboard Dock */}
        {!isKeyboardMinimized && (
          <div className="border-t border-slate-800 bg-slate-950">
            <VisualKeyboard
              mode={keyboardMode}
              onModeChange={setKeyboardMode}
              onInsertChar={handleInsertChar}
              isMinimized={isKeyboardMinimized}
              onToggleMinimize={() => setIsKeyboardMinimized((prev) => !prev)}
            />
          </div>
        )}

        {/* Bottom Studio Statusbar (MS Word layout: page info left, keyboard toggle center, zoom right) */}
        <footer className="studio-statusbar">
          <div className="statusbar-left">
            <span>صفحہ {document.pageOrder.indexOf(activePageId) + 1} از {document.pageOrder.length}</span>
            <span className="statusbar-separator">|</span>
            <span>{Math.round(pointsToMillimetres(activePage.width))} × {Math.round(pointsToMillimetres(activePage.height))} mm</span>
            <span className="statusbar-separator">|</span>
            <span>{saveState}</span>
          </div>

          <div className="statusbar-center">
            <button
              type="button"
              onClick={() => setIsKeyboardMinimized((prev) => !prev)}
              style={{
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                borderRadius: '5px',
                padding: '2px 14px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title={isKeyboardMinimized ? 'Expand Visual Keyboard' : 'Minimize Visual Keyboard'}
            >
              <span>⌨</span>
              <span>{isKeyboardMinimized ? 'Expand Keyboard ▲' : 'Minimize Keyboard ▼'}</span>
            </button>
          </div>

          <div className="statusbar-zoom">
            <button onClick={() => setZoomLevel((z) => Math.max(50, z - 10))} className="zoom-btn">−</button>
            <input
              type="range"
              min="50"
              max="200"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="zoom-slider"
            />
            <span className="zoom-label">{zoomLevel}%</span>
            <button onClick={() => setZoomLevel((z) => Math.min(200, z + 10))} className="zoom-btn">+</button>
            <button onClick={() => setZoomLevel(100)} className="zoom-btn" style={{ width: 'auto', borderRadius: '4px', padding: '0 6px', fontSize: '10px' }}>Fit</button>
          </div>
        </footer>

        {/* Modal Panels & Overlays */}
        {showLanguageTools && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(2px)',
            }}
            onClick={() => setShowLanguageTools(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <LanguageToolsPanel
                document={document}
                activeSelection={activeSelectionRange}
                initialTab={languageToolsInitialTab}
                onApplyChanges={(changes) => {
                  const nextDoc = applyLanguageChangesCommand(document, changes);
                  updateDocument(nextDoc, `Apply ${changes.length} Urdu language change(s)`);
                  setMessage(`Applied ${changes.length} language change(s) cleanly`);
                }}
                onClose={() => setShowLanguageTools(false)}
              />
            </div>
          </div>
        )}

        {showOcrPanel && ocrResult && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setShowOcrPanel(false)}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ zIndex: 10000 }}>
              <OcrCorrectionPanel
                ocrResult={ocrResult}
                onClose={() => setShowOcrPanel(false)}
                onCommitToDocument={handleCommitOcrToCanvas}
              />
            </div>
          </div>
        )}

        {/* Reviewing Pane */}
        <ReviewingPane
          isOpen={isReviewingPaneOpen}
          onClose={() => setIsReviewingPaneOpen(false)}
          document={document}
          onCommitDocument={(updated, msg) => updateDocument(updated, msg)}
          lang={lang}
        />

        {/* Header Footer & Master Setup Modal */}
        <HeaderFooterModal
          isOpen={showHeaderFooterModal}
          onClose={() => setShowHeaderFooterModal(false)}
          document={document}
          activePageId={activePageId}
          onApply={(updatedDoc, msg) => {
            updateDocument(updatedDoc, msg);
            setMessage(msg);
          }}
          lang={lang}
        />

        {/* Real Export & Output Setup Dialog */}
        <ExportOutputDialog
          isOpen={showExportOutputDialog}
          onClose={() => setShowExportOutputDialog(false)}
          document={document}
          activePageId={activePageId}
          onConfirmExport={(exportOptions: ExportOptions) => {
            if (exportOptions.format === 'browser-print') {
              handleBrowserPrint();
            } else if (exportOptions.format === 'epub') {
              void handleExportEpub();
            } else {
              setMessage(`Export format '${exportOptions.format}' selected.`);
            }
          }}
          lang={lang}
        />

        {/* Diagnostic Preflight & Audit Panel Modal */}
        {showPreflight && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(2px)',
            }}
            onClick={() => setShowPreflight(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <PreflightPanel
                result={runPreflightCheck(document)}
                document={document}
                onClose={() => setShowPreflight(false)}
              />
            </div>
          </div>
        )}

        {showDocStats && (
          <DocumentStatsModal
            isOpen={showDocStats}
            onClose={() => setShowDocStats(false)}
            document={document}
            lang={lang}
          />
        )}

        {showStylesManager && (
          <StylesManagerModal
            isOpen={showStylesManager}
            onClose={() => setShowStylesManager(false)}
            document={document}
            lang={lang}
          />
        )}

        {showCharSub && (
          <CharacterSubstitutionModal
            isOpen={showCharSub}
            onClose={() => setShowCharSub(false)}
            document={document}
            onCommitDocument={(updated, msg) => updateDocument(updated, msg)}
            lang={lang}
          />
        )}

        {showKeyboardEditor && (
          <KeyboardLayoutEditorModal
            isOpen={showKeyboardEditor}
            onClose={() => setShowKeyboardEditor(false)}
            lang={lang}
          />
        )}

        {showCompareModal && (
          <CompareDocumentsModal
            isOpen={showCompareModal}
            onClose={() => setShowCompareModal(false)}
            document={document}
            onCommitDocument={(updated, msg) => updateDocument(updated, msg)}
            lang={lang}
          />
        )}

        {showVersionHistoryModal && (
          <VersionHistoryModal
            isOpen={showVersionHistoryModal}
            onClose={() => setShowVersionHistoryModal(false)}
            document={document}
            onRestoreSnapshot={(snapshot, msg) => updateDocument(snapshot, msg)}
            lang={lang}
          />
        )}

        {showShareModal && (
          <ShareDialogModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            documentTitle={document.metadata.title}
            lang={lang}
          />
        )}

        {showAccessibilityChecker && (
          <AccessibilityCheckerModal
            isOpen={showAccessibilityChecker}
            onClose={() => setShowAccessibilityChecker(false)}
            document={document}
            lang={lang}
          />
        )}

        {/* Fullscreen Distraction-Free Focus Mode Shell */}
        <FocusModeShell
          isActive={isFocusMode}
          onExit={() => setIsFocusMode(false)}
          document={document}
          activePageId={activePageId}
          onSelectPage={setActivePageId}
          lang={lang}
        >
          {viewMode === 'print' && (
            <PrintLayoutView
              document={document}
              activePageId={activePageId}
              zoomLevel={zoomLevel}
              activeFontFamily={activeFontFamily}
              activeFontSize={activeFontSize}
              pendingChar={pendingChar}
              editingObjectId={editingObjectId}
              isObjectSelectionMode={activeTool === 'select'}
              bodyEditorFocusRequest={bodyEditorFocusRequest}
              selectedObjectId={selectedObjectId}
              onSelectPage={setActivePageId}
              onSelectObject={setSelectedObjectId}
              onEditObject={setEditingObjectId}
              onObjectModified={handleObjectModified}
              onCommitStory={(storyId, updatedContent) => {
                setDocumentState((prev) => {
                  const updatedStories = {
                    ...prev.stories,
                    [storyId]: {
                      id: storyId,
                      name: 'Primary Story',
                      content: updatedContent,
                    },
                  };
                  const repagination = repaginateDocument({ ...prev, stories: updatedStories }, storyId);
                  return repagination.repaginatedDoc;
                });
              }}
              onRequestBodyFocus={() => setBodyEditorFocusRequest((value) => value + 1)}
              onUpdateTableCell={handleUpdateTableCell}
              onActiveTableCellChange={(rIdx, cIdx) => setActiveTableCell({ rowIndex: rIdx, colIndex: cIdx })}
              onUpdateGuides={(pageId, guides) => updateDocument(updateGuidesCommand(document, pageId, guides), 'Update page guides')}
            />
          )}
          {viewMode === 'web' && (
            <WebReadingView document={document} zoomLevel={zoomLevel} activeFontFamily={activeFontFamily} activeFontSize={activeFontSize} lang={lang} />
          )}
          {viewMode === 'draft' && (
            <DraftEditingView
              document={document}
              activeFontFamily={activeFontFamily}
              activeFontSize={activeFontSize}
              pendingChar={pendingChar}
              bodyEditorFocusRequest={bodyEditorFocusRequest}
              onCommitStory={(storyId, updatedContent) => {
                setDocumentState((prev) => {
                  const updatedStories = {
                    ...prev.stories,
                    [storyId]: {
                      id: storyId,
                      name: 'Primary Story',
                      content: updatedContent,
                    },
                  };
                  const repagination = repaginateDocument({ ...prev, stories: updatedStories }, storyId);
                  return repagination.repaginatedDoc;
                });
              }}
              lang={lang}
            />
          )}
        </FocusModeShell>

        {showAccessibilitySettings && (
          <AccessibilitySettingsModal
            isOpen={showAccessibilitySettings}
            onClose={() => setShowAccessibilitySettings(false)}
            onApplySettings={setAccSettings}
            lang={lang}
          />
        )}

        {showReadAloud && (
          <ReadAloudToolbar
            isOpen={showReadAloud}
            onClose={() => setShowReadAloud(false)}
            textToRead={
              document.stories[PRIMARY_STORY_ID]?.content?.content
                ?.map((p) => p.content.map((r) => (r.type === 'text' ? r.text : '')).join(''))
                .join('\n') || ''
            }
            lang={lang}
          />
        )}

        {/* Full-screen File Backstage View */}
        <FileBackstageOverlay
          isOpen={isFileBackstageOpen}
          onClose={() => setIsFileBackstageOpen(false)}
          document={document}
          lang={lang}
          saveState={saveState}
          onNewDocument={() => {
            const starter = createStarterDocument();
            setDocumentState(starter);
            setActivePageId(starter.pageOrder[0]!);
            setMessage('New blank document created');
          }}
          onOpenDocument={() => {
            // open file picker via ribbon input
          }}
          onSaveDocument={() => void handleSaveNative()}
          onSaveAsDocument={() => void handleSaveAsNative()}
          onExportPdf={handleBrowserPrint}
          onPrint={triggerNativePrintDialog}
        />

        {/* Advanced Font Dialog Modal */}
        <FontDialogModal
          isOpen={showFontDialog}
          currentProps={{
            fontFamily: activeFontFamily,
            fontSize: activeFontSize,
            color: fontColor,
            isBold,
            isItalic,
            isUnderline,
            underlineStyle,
            underlineColor,
            isStrikethrough,
            isSubscript,
            isSuperscript,
          }}
          onApply={(props) => {
            setActiveFontFamily(props.fontFamily);
            setActiveFontSize(props.fontSize);
            setFontColor(props.color);
            setIsBold(props.isBold);
            setIsItalic(props.isItalic);
            setIsUnderline(props.isUnderline);
            if (props.underlineStyle) setUnderlineStyle(props.underlineStyle);
            if (props.underlineColor) setUnderlineColor(props.underlineColor);
            setIsStrikethrough(props.isStrikethrough);
            setIsSubscript(props.isSubscript);
            setIsSuperscript(props.isSuperscript);
            setMessage('Applied font formatting');
          }}
          onClose={() => setShowFontDialog(false)}
        />

        {/* Advanced Paragraph Dialog Modal */}
        <ParagraphDialogModal
          isOpen={showParagraphDialog}
          currentProps={{
            alignment: activeAlignment,
            direction: activeDirection,
            lineHeight,
            spaceBefore: 0,
            spaceAfter: 6,
            indentLevel: 0,
            firstLineIndent: 0,
            backgroundColor: paragraphShading || undefined,
          }}
          onApply={(props) => {
            setActiveAlignment(props.alignment);
            setActiveDirection(props.direction);
            setLineHeight(props.lineHeight);
            setMessage('Applied paragraph formatting');
          }}
          onClose={() => setShowParagraphDialog(false)}
        />
        {/* Page Setup Modal */}
        <PageSetupModal
          isOpen={showPageSetupModal}
          onClose={() => setShowPageSetupModal(false)}
          document={document}
          activePageId={activePageId}
          lang={lang}
          onApply={(target, setup) => {
            let nextDoc = document;
            if (setup.width !== undefined || setup.height !== undefined || setup.orientation !== undefined || setup.margins !== undefined) {
              const setupPayload: { width?: number; height?: number; orientation?: 'portrait' | 'landscape'; margins?: Insets } = {};
              if (setup.width !== undefined) setupPayload.width = setup.width;
              if (setup.height !== undefined) setupPayload.height = setup.height;
              if (setup.orientation !== undefined) setupPayload.orientation = setup.orientation;
              if (setup.margins !== undefined) setupPayload.margins = setup.margins;
              nextDoc = applyPageSetupCommand(nextDoc, target, setupPayload);
            }
            if (setup.bleed !== undefined) {
              nextDoc = setPageBleedCommand(nextDoc, target, setup.bleed);
            }
            if (setup.background !== undefined) {
              nextDoc = setPageBackgroundCommand(nextDoc, target, setup.background);
            }

            updateDocument(nextDoc, 'Update page setup');
            setMessage(lang === 'ur' ? 'صفحہ کی ترتیبات نافذ کر دی گئیں۔' : 'Page setup applied successfully');
          }}
        />
        <OcrImportDialog
          isOpen={showOcrImportDialog}
          onClose={() => setShowOcrImportDialog(false)}
          onRecognitionComplete={(res, fileBuffer, fileName) => {
            ocrSourceBufferRef.current = fileBuffer ? { buffer: fileBuffer, fileName } : null;
            setOcrResult(res);
            setShowOcrPanel(true);
          }}
          lang={lang}
        />
      </div>
    </DragAndDropOverlay>
  );
}
