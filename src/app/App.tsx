import React, { useMemo, useState, useEffect } from 'react';
import { createStarterDocument, PRIMARY_STORY_ID } from '../domain/document/createDocument';
import type { Page, PageObject, RePageDocument, ShapeKind, ViewMode } from '../domain/document/types';
import { pointsToMillimetres } from '../domain/geometry/units';
import { repaginateDocument } from '../domain/layout/paginationEngine';
import { applyPageSetup, insertSectionBreak } from '../domain/layout/sectionEngine';
import { DocumentRulers } from '../ui/editor/DocumentRulers';
import { PaginatedPrintLayout } from '../ui/editor/PaginatedPrintLayout';
import {
  addTableObject,
  alignPageObjects,
  reorderPageObject,
  setObjectWrapping,
} from '../editor/commands/objectCommands';
import { SelectionPane } from '../ui/navigation/SelectionPane';
import {
  addPage,
  addRectangle,
  addTextFrame,
  removePage,
  renameDocument,
  updateObjectGeometry,
} from '../editor/commands/documentCommands';
import { TransactionHistory } from '../editor/history/transactionHistory';
import { FabricCanvas } from '../ui/canvas/FabricCanvas';
import { VisualKeyboard } from '../ui/keyboard/VisualKeyboard';
import { TextEditorOverlay } from '../ui/editor/TextEditorOverlay';
import { DocumentBodyEditor } from '../ui/editor/DocumentBodyEditor';
import { PreflightPanel } from '../ui/diagnostics/PreflightPanel';
import { runPreflightCheck } from '../domain/diagnostics/preflightEngine';
import { DragAndDropOverlay } from '../ui/common/DragAndDropOverlay';
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
import { runUrduOcr, OcrPageResult } from '../domain/ocr/ocrEngine';
import { convertOcrResultToDocumentObjects } from '../domain/ocr/ocrCorrection';
import { exportDocumentToPdfMetadata, exportDocumentToEpub } from '../export/exportEngine';

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
import { addBookmarkCommand, insertTocCommand } from '../editor/commands/longDocumentCommands';
import { addCaptionToObject } from '../domain/document/captionEngine';
import { buildIndexRichTextDocument, generateSubjectIndex } from '../domain/document/indexEngine';
import { insertFootnote, insertEndnote } from '../domain/rich-text/notesEngine';

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

  const [viewMode, setViewMode] = useState<ViewMode>('print');
  const [showRulers, setShowRulers] = useState(true);

  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>('crulp');
  const [isKeyboardMinimized, setIsKeyboardMinimized] = useState(true);
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

  // Typography state
  const [activeFontFamily, setActiveFontFamily] = useState('Noto Nastaliq Urdu');
  const [activeFontSize, setActiveFontSize] = useState(16);
  const [isKashidaEnabled, setIsKashidaEnabled] = useState(true);
  const [activeAlignment, setActiveAlignment] = useState('start');

  const activePage = resolveActivePage(document, activePageId);
  const visibleObjects = useMemo(
    () =>
      activePage.objectOrder
        .map((objectId) => document.objects[objectId])
        .filter((object): object is PageObject => Boolean(object && !object.hidden)),
    [activePage.objectOrder, document.objects],
  );

  const selectedObject = selectedObjectId ? document.objects[selectedObjectId] : null;

  // Find object being edited
  const editingObject = editingObjectId ? document.objects[editingObjectId] : null;
  const editingStory = editingObject && editingObject.type === 'text-frame' ? document.stories[editingObject.storyId] : null;

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
        setEditingObjectId(newObjectId);
      }
      setMessage(`Shape added. Type directly inside it.`);
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
      setEditingObjectId(newTextFrameId);
    }
    setMessage('Text Frame added. Type to edit text.');
  }, [activePageId, document, updateDocument]);

  const handleAddFootnote = React.useCallback(() => {
    const storyId = selectedObject && selectedObject.type === 'text-frame' ? selectedObject.storyId : 'story-1';
    insertFootnote(document.id, storyId, 'نیا حاشیہ (New Footnote)');
    setMessage('Footnote added');
  }, [document.id, selectedObject]);

  const handleAddEndnote = React.useCallback(() => {
    const storyId = selectedObject && selectedObject.type === 'text-frame' ? selectedObject.storyId : 'story-1';
    insertEndnote(document.id, storyId, 'نئی تعلیق (New Endnote)');
    setMessage('Endnote added');
  }, [document.id, selectedObject]);

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

  const handleExportPdf = React.useCallback(() => {
    const meta = exportDocumentToPdfMetadata(document);
    triggerNativePrintDialog();
    setMessage(`Exporting PDF: ${meta.title}`);
  }, [document]);

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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTriggerOcr = React.useCallback(async () => {
    const dummyBuffer = new ArrayBuffer(2048);
    const res = await runUrduOcr(dummyBuffer, 'Urdu_Scan_Page1.png');
    setOcrResult(res);
    setShowOcrPanel(true);
  }, []);

  const handleCommitOcrToCanvas = React.useCallback((finalResult: OcrPageResult) => {
    const { imageFrame, textFrame, story } = convertOcrResultToDocumentObjects(finalResult, activePageId);
    setDocumentState((prev) => ({
      ...prev,
      objects: {
        ...prev.objects,
        [imageFrame.id]: imageFrame,
        [textFrame.id]: textFrame,
      },
      stories: {
        ...prev.stories,
        [story.id]: story,
      },
      pages: {
        ...prev.pages,
        [activePageId]: {
          ...prev.pages[activePageId]!,
          objectOrder: [...prev.pages[activePageId]!.objectOrder, imageFrame.id, textFrame.id],
        },
      },
    }));
    setShowOcrPanel(false);
    setMessage('OCR text frame and source image added to page');
  }, [activePageId]);

  // Handle Double Click on Text Frame or Shape
  const handleObjectDoubleClicked = React.useCallback((objectId: string) => {
    const obj = document.objects[objectId];
    if (obj && (obj.type === 'text-frame' || obj.type === 'rectangle')) {
      setSelectedObjectId(objectId);
      setEditingObjectId(objectId);
      setMessage(obj.type === 'rectangle' ? 'Editing Shape Text. Press ESC to exit.' : 'Editing Text Frame. Press ESC to exit.');
    }
  }, [document.objects]);

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

  return (
    <DragAndDropOverlay onFileDrop={(file) => void handleOpenImportFile(file)}>
      <div className="app-shell">
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
          onExportPdf={handleExportPdf}
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
          }}
          onInsertShape={(kind) => handleAddRectangle(kind)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.canUndo()}
          canRedo={history.canRedo()}
          onOpenDocument={(file) => void handleOpenImportFile(file)}
          onSaveDocument={() => void handleSaveNative()}
          onSaveAsDocument={() => void handleSaveAsNative()}
          onShowRecentFiles={() => setShowRecent(!showRecent)}
          activeFontFamily={activeFontFamily}
          onFontFamilyChange={setActiveFontFamily}
          activeFontSize={activeFontSize}
          onFontSizeChange={setActiveFontSize}
          isKashidaEnabled={isKashidaEnabled}
          onToggleKashida={() => setIsKashidaEnabled(!isKashidaEnabled)}
          activeAlignment={activeAlignment}
          onAlignmentChange={setActiveAlignment}
          onAddPage={handleAddPage}
          onRemovePage={handleRemovePage}
          onAddFootnote={handleAddFootnote}
          onAddEndnote={handleAddEndnote}
          onOpenLanguageTools={() => setShowLanguageTools(true)}
          onOpenOcr={() => void handleTriggerOcr()}
          onExportPdf={handleExportPdf}
          onExportEpub={() => void handleExportEpub()}
          onRunPreflight={() => setShowPreflight(true)}
          onToggleCollab={() => setMessage('Live collaboration room active')}
          onOpenFileBackstage={() => setIsFileBackstageOpen(true)}
          onToggleNavigationPane={() => setIsNavigationPaneOpen((prev) => !prev)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onToggleOrientation={() => {
            setDocumentState((prev) =>
              applyPageSetup(prev, activePageId, {
                orientation: activePage.width > activePage.height ? 'portrait' : 'landscape',
              }),
            );
          }}
          onInsertSectionBreak={(type) => {
            setDocumentState((prev) => insertSectionBreak(prev, type, activePageId));
          }}
          showRulers={showRulers}
          onToggleRulers={() => setShowRulers((prev) => !prev)}
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
          onInsertTable={() => {
            updateDocument(addTableObject(document, activePageId), 'Insert Table');
          }}
          onOpenStylesManager={() => setShowStylesManager(true)}
          onOpenDocStats={() => setShowDocStats(true)}
          onInsertToc={() => updateDocument(insertTocCommand(document), 'Insert Table of Contents')}
          onInsertCaption={() => {
            if (selectedObjectId) {
              updateDocument(addCaptionToObject(document, selectedObjectId, 'figure', 'نمونہ کیپشن'), 'Add Caption');
            } else {
              setMessage('Please select an object to attach a caption');
            }
          }}
          onInsertBookmark={() => updateDocument(addBookmarkCommand(document, 'بک مارک ۱', 0), 'Add Bookmark')}
          onInsertIndex={() => {
            const idx = generateSubjectIndex(document);
            const docWithIndex = {
              ...document,
              stories: {
                ...document.stories,
                'index-story': {
                  id: 'index-story',
                  name: 'Subject Index',
                  content: buildIndexRichTextDocument(idx),
                },
              },
            };
            updateDocument(docWithIndex, 'Insert Subject Index');
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
            {showRulers && activePage && <DocumentRulers page={activePage} unit={document.settings.measurementUnit} />}

            {viewMode === 'print' ? (
              <PaginatedPrintLayout
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
              />
            ) : (
            <div
              className="canvas-paper-frame"
              style={{
                width: `${activePage.width}pt`,
                height: `${activePage.height}pt`,
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                position: 'relative',
              }}
            >
              {/* Margin Guide */}
              <div
                className="canvas-margin-guide"
                style={{
                  top: `${activePage.margins.top}pt`,
                  right: `${activePage.margins.right}pt`,
                  bottom: `${activePage.margins.bottom}pt`,
                  left: `${activePage.margins.left}pt`,
                }}
              />

              {/* Primary Document Body Editor (Word-Style Typing Surface) */}
              <div
                style={{
                  position: 'absolute',
                  top: `${activePage.margins.top}pt`,
                  right: `${activePage.margins.right}pt`,
                  bottom: `${activePage.margins.bottom}pt`,
                  left: `${activePage.margins.left}pt`,
                  zIndex: 5,
                }}
              >
                <DocumentBodyEditor
                  story={
                    document.stories[PRIMARY_STORY_ID] || {
                      id: PRIMARY_STORY_ID,
                      name: 'Primary Document Story',
                      content: { type: 'doc', content: [] },
                    }
                  }
                  fontFamily={activeFontFamily}
                  fontSize={activeFontSize}
                  color="#172119"
                  lineHeight={1.8}
                  pendingChar={!editingObjectId ? pendingChar : null}
                  focusRequest={bodyEditorFocusRequest}
                  onCommit={(updatedContent) => {
                    setDocumentState((prev) => ({
                      ...prev,
                      stories: {
                        ...prev.stories,
                        [PRIMARY_STORY_ID]: {
                          id: PRIMARY_STORY_ID,
                          name: 'Primary Document Story',
                          content: updatedContent,
                        },
                      },
                    }));
                  }}
                />
              </div>

              {/* Fabric Vector Canvas for Floating Objects & Text Boxes */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: editingObjectId ? 'none' : 'auto' }}>
                <FabricCanvas
                  page={activePage}
                  objects={visibleObjects}
                  stories={document.stories}
                  selectedObjectId={selectedObjectId}
                  onObjectModified={handleObjectModified}
                  onSelectionChanged={(id) => {
                    setSelectedObjectId(id);
                  }}
                  onObjectDoubleClicked={handleObjectDoubleClicked}
                  onBlankCanvasClick={() => {
                    setSelectedObjectId(null);
                    setBodyEditorFocusRequest((value) => value + 1);
                  }}
                />
              </div>

              {/* Interactive In-place Rich Text Editor Overlay */}
              {editingObject && editingObject.type === 'text-frame' && editingStory && (
                <TextEditorOverlay
                  frame={editingObject.frame}
                  story={editingStory}
                  fontFamily={editingObject.fontFamily || activeFontFamily}
                  fontSize={editingObject.fontSize || activeFontSize}
                  color={editingObject.color}
                  pendingChar={pendingChar}
                  onCommit={(updatedContent) => {
                    setDocumentState((prev) => ({
                      ...prev,
                      stories: {
                        ...prev.stories,
                        [editingObject.storyId]: {
                          ...prev.stories[editingObject.storyId]!,
                          content: updatedContent,
                        },
                      },
                    }));
                  }}
                  onClose={() => setEditingObjectId(null)}
                />
              )}
            </div>
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
          <LanguageToolsPanel
            initialText="پاکستان کا قومی ترانہ"
            onClose={() => setShowLanguageTools(false)}
          />
        )}

        {showOcrPanel && ocrResult && (
          <OcrCorrectionPanel
            ocrResult={ocrResult}
            onClose={() => setShowOcrPanel(false)}
            onCommitToDocument={handleCommitOcrToCanvas}
          />
        )}

        {/* Reviewing Pane */}
        <ReviewingPane
          isOpen={isReviewingPaneOpen}
          onClose={() => setIsReviewingPaneOpen(false)}
          document={document}
          onCommitDocument={(updated, msg) => updateDocument(updated, msg)}
          lang={lang}
        />

        {/* Diagnostic Preflight & Audit Panel Modal */}
        {showPreflight && (
          <PreflightPanel
            result={runPreflightCheck(document)}
            onClose={() => setShowPreflight(false)}
          />
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
          onExportPdf={handleExportPdf}
          onPrint={triggerNativePrintDialog}
        />
      </div>
    </DragAndDropOverlay>
  );
}
