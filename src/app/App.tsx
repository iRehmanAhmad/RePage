import React, { useMemo, useState, useEffect } from 'react';
import { createStarterDocument } from '../domain/document/createDocument';
import type { Page, PageObject, RePageDocument } from '../domain/document/types';
import { pointsToMillimetres } from '../domain/geometry/units';
import {
  addPage,
  addRectangle,
  removePage,
  renameDocument,
  updateObjectGeometry,
} from '../editor/commands/documentCommands';
import { TransactionHistory } from '../editor/history/transactionHistory';
import { FabricCanvas } from '../ui/canvas/FabricCanvas';
import { VisualKeyboard } from '../ui/keyboard/VisualKeyboard';
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

// Studio Layout & MS Word Ribbon Components
import { StudioHeader } from '../ui/common/StudioHeader';
import { MsWordRibbon, ActiveTool } from '../ui/ribbon/MsWordRibbon';
import { InspectorDock } from '../ui/common/InspectorDock';
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
  const [message, setMessage] = useState('RePage Studio Ready');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>('crulp');
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');

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

  // Modal Panel Toggles
  const [showPreflight, setShowPreflight] = useState(false);
  const [showLanguageTools, setShowLanguageTools] = useState(false);
  const [showOcrPanel, setShowOcrPanel] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrPageResult | null>(null);
  const [showRecent, setShowRecent] = useState(false);

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

  const handleAddRectangle = React.useCallback(() => {
    const nextDoc = addRectangle(document, activePageId);
    updateDocument(nextDoc, 'Add rectangle');
    setMessage('Rectangle shape added');
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
            if (tool === 'rectangle') handleAddRectangle();
          }}
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
        />

        {/* Streamlined MS Word Workspace (Canvas Viewport + Format Properties Panel) */}
        <div className="studio-layout">
          {/* Center Studio Viewport */}
          <main className="studio-viewport">
            <div
              className="canvas-paper-frame"
              style={{
                width: `${activePage.width}pt`,
                height: `${activePage.height}pt`,
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
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

              {/* Fabric Canvas */}
              <FabricCanvas
                page={activePage}
                objects={visibleObjects}
                stories={document.stories}
                onObjectModified={handleObjectModified}
                onSelectionChanged={setSelectedObjectId}
              />
            </div>

            {/* Viewport Zoom Floating Bar */}
            <div className="viewport-zoom-bar">
              <button onClick={() => setZoomLevel((z) => Math.max(50, z - 10))} className="zoom-btn">
                -
              </button>
              <span className="zoom-label">{zoomLevel}%</span>
              <button onClick={() => setZoomLevel((z) => Math.min(200, z + 10))} className="zoom-btn">
                +
              </button>
              <button onClick={() => setZoomLevel(100)} className="zoom-btn px-2 text-[10px]">
                Fit
              </button>
            </div>
          </main>

          {/* Right Properties Inspector Dock */}
          <InspectorDock
            t={t}
            document={document}
            selectedObject={selectedObject ?? null}
            onUpdateGeometry={(objectId, coords) => handleObjectModified(objectId, coords)}
          />
        </div>

        {/* Bottom Urdu Visual Keyboard Dock */}
        <div className="border-t border-slate-800 bg-slate-950">
          <VisualKeyboard
            mode={keyboardMode}
            onModeChange={setKeyboardMode}
            onInsertChar={(char) => {
              setMessage(`Character inserted: ${char}`);
            }}
          />
        </div>

        {/* Bottom Studio Statusbar */}
        <footer className="studio-statusbar">
          <div className="status-indicator">
            <span className="status-dot" />
            <span>{message}</span>
          </div>

          <div>
            صفحہ {document.pageOrder.indexOf(activePageId) + 1} از {document.pageOrder.length} | {Math.round(pointsToMillimetres(activePage.width))} × {Math.round(pointsToMillimetres(activePage.height))} mm | {saveState}
          </div>
        </footer>

        {/* Modal Panels */}
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

        {showPreflight && (
          <PreflightPanel
            result={runPreflightCheck(document)}
            onClose={() => setShowPreflight(false)}
          />
        )}
      </div>
    </DragAndDropOverlay>
  );
}
