import React, { useEffect, useMemo, useState } from 'react';
import { createStarterDocument } from '../domain/document/createDocument';
import type { Page, PageObject, RePageDocument } from '../domain/document/types';
import { pointsToMillimetres } from '../domain/geometry/units';
import {
  addPage,
  addRectangle,
  deleteObject,
  removePage,
  renameDocument,
  updateObjectGeometry,
} from '../editor/commands/documentCommands';
import { TransactionHistory } from '../editor/history/transactionHistory';
import { browserPlatform } from '../platform/browser/browserPlatform';
import { clearRecovery, getLatestRecovery, saveRecovery } from '../persistence/autosave/database';
import { createUrdupPackage, readUrdupPackage } from '../persistence/package/urdupPackage';
import { FabricCanvas } from '../ui/canvas/FabricCanvas';
import { TextEditorOverlay } from '../ui/editor/TextEditorOverlay';

type SaveState = 'Saved locally' | 'Unsaved changes' | 'Saving…' | 'Save failed';

const history = new TransactionHistory();

function safeFilename(title: string): string {
  const printableTitle = Array.from(title)
    .filter((character) => character.charCodeAt(0) >= 32)
    .join('');
  const name = printableTitle.replace(/[<>:"/\\|?*]/g, '-').trim();
  return `${name || 'RePage-Document'}.urdup`;
}

function resolveActivePage(document: RePageDocument, activePageId: string): Page {
  const page = document.pages[activePageId] ?? document.pages[document.pageOrder[0]!];
  if (!page) {
    throw new Error('The canonical document has no resolvable page.');
  }
  return page;
}

export function App() {
  void React;
  const [document, setDocumentState] = useState<RePageDocument>(() => createStarterDocument());
  const [activePageId, setActivePageId] = useState(() => document.pageOrder[0]!);
  const [saveState, setSaveState] = useState<SaveState>('Unsaved changes');
  const [message, setMessage] = useState('Foundation workspace');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [recoveredItem, setRecoveredItem] = useState<{ document: RePageDocument; savedAt: string } | null>(null);

  const [, setHistoryVersion] = useState(0);

  const activePage = resolveActivePage(document, activePageId);
  const visibleObjects = useMemo(
    () =>
      activePage.objectOrder
        .map((objectId) => document.objects[objectId])
        .filter((object): object is PageObject => Boolean(object && !object.hidden)),
    [activePage.objectOrder, document.objects],
  );

  const selectedObject = selectedObjectId ? document.objects[selectedObjectId] : null;
  const selectedTextFrame = selectedObject?.type === 'text-frame' ? selectedObject : null;
  const activeStory = selectedTextFrame ? document.stories[selectedTextFrame.storyId] : null;

  const initialDocumentIdRef = React.useRef(document.id);
  const initialDocumentId = initialDocumentIdRef.current;

  // Check for recovery on startup
  useEffect(() => {
    void getLatestRecovery().then((recovery) => {
      if (recovery && recovery.document.id !== initialDocumentId) {
        setRecoveredItem(recovery);
      }
    });
  }, [initialDocumentId]);

  // Update document with undo push
  const updateDocument = React.useCallback(
    (nextDocument: RePageDocument, description?: string) => {
      history.push(document, description);
      setDocumentState(nextDocument);
      setHistoryVersion((v) => v + 1);
    },
    [document],
  );

  const handleObjectModified = React.useCallback(
    (objectId: string, frameProps: Partial<import('../domain/document/types').Rect>) => {
      updateDocument(updateObjectGeometry(document, objectId, frameProps), 'Modify object geometry');
      setMessage('Object geometry updated on canvas');
    },
    [document, updateDocument],
  );

  const handleDeleteSelected = React.useCallback(() => {
    if (!selectedObjectId) return;
    try {
      updateDocument(deleteObject(document, selectedObjectId), 'Delete object');
      setSelectedObjectId(null);
      setMessage('Object deleted');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete object.');
    }
  }, [document, selectedObjectId, updateDocument]);

  const handleUndo = React.useCallback(() => {
    if (!history.canUndo()) return;
    const previous = history.undo(document);
    if (previous) {
      setDocumentState(previous);
      setHistoryVersion((v) => v + 1);
      setMessage('Undo applied');
    }
  }, [document]);

  const handleRedo = React.useCallback(() => {
    if (!history.canRedo()) return;
    const next = history.redo(document);
    if (next) {
      setDocumentState(next);
      setHistoryVersion((v) => v + 1);
      setMessage('Redo applied');
    }
  }, [document]);

  // Global keybindings for Undo/Redo & Delete
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        if (event.shiftKey) {
          event.preventDefault();
          handleRedo();
        } else {
          event.preventDefault();
          handleUndo();
        }
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        handleRedo();
      } else if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
      ) {
        if (selectedObjectId) {
          event.preventDefault();
          handleDeleteSelected();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDeleteSelected, selectedObjectId]);

  useEffect(() => {
    setSaveState('Unsaved changes');
    const timeoutId = window.setTimeout(() => {
      setSaveState('Saving…');
      void saveRecovery(document)
        .then(() => setSaveState('Saved locally'))
        .catch(() => setSaveState('Save failed'));
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [document]);

  function handleAddPage() {
    const next = addPage(document, activePageId);
    updateDocument(next, 'Add page');
    setActivePageId(next.pageOrder[next.pageOrder.indexOf(activePageId) + 1] ?? next.pageOrder.at(-1)!);
    setMessage('Page added');
  }

  function handleRemovePage() {
    try {
      const next = removePage(document, activePageId);
      updateDocument(next, 'Remove page');
      setActivePageId(next.pageOrder[0]!);
      setMessage('Page removed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove page.');
    }
  }

  function handleAddRectangle() {
    updateDocument(addRectangle(document, activePageId), 'Add rectangle');
    setMessage('Rectangle added through domain command');
  }

  async function handleSavePackage() {
    try {
      const bytes = await createUrdupPackage(document);
      browserPlatform.download(bytes, safeFilename(document.metadata.title), 'application/vnd.urdup+zip');
      setMessage('Portable .urdup package created');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create package.');
    }
  }

  async function handleOpenPackage(file: File | undefined) {
    if (!file) return;
    try {
      const opened = await readUrdupPackage(await file.arrayBuffer());
      history.clear();
      setDocumentState(opened);
      setActivePageId(opened.pageOrder[0]!);
      setMessage(`${file.name} opened and validated`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to open package.');
    }
  }

  function handleRestoreRecovery() {
    if (!recoveredItem) return;
    history.clear();
    setDocumentState(recoveredItem.document);
    setActivePageId(recoveredItem.document.pageOrder[0]!);
    setRecoveredItem(null);
    setMessage('Previous session document restored from recovery snapshot');
  }

  function handleDiscardRecovery() {
    setRecoveredItem(null);
    void clearRecovery();
    setMessage('Recovery snapshot discarded');
  }

  return (
    <div className="app-shell">
      {recoveredItem && (
        <div className="recovery-banner" role="alert" style={{ background: '#2d3748', color: '#fff', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Unsaved session found from {new Date(recoveredItem.savedAt).toLocaleTimeString()} ({recoveredItem.document.metadata.title})</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="button primary" onClick={handleRestoreRecovery}>Restore Session</button>
            <button type="button" className="button secondary" onClick={handleDiscardRecovery}>Discard</button>
          </div>
        </div>
      )}

      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">ا</span>
          <div>
            <strong>RePage</strong>
            <span>Foundation 0.1</span>
          </div>
        </div>

        <label className="title-field">
          <span className="sr-only">Document title</span>
          <input
            value={document.metadata.title}
            dir="auto"
            onChange={(event) => {
              if (event.target.value.trim()) {
                updateDocument(renameDocument(document, event.target.value), 'Rename document');
              }
            }}
          />
        </label>

        <div className="top-actions">
          <label className="button secondary file-button">
            Open
            <input
              type="file"
              accept=".urdup,application/zip"
              onChange={(event) => void handleOpenPackage(event.target.files?.[0])}
            />
          </label>
          <button className="button primary" type="button" onClick={() => void handleSavePackage()}>
            Save package
          </button>
        </div>
      </header>

      <nav className="commandbar" aria-label="Editor commands">
        <button type="button" onClick={handleUndo} disabled={!history.canUndo()}>Undo</button>
        <button type="button" onClick={handleRedo} disabled={!history.canRedo()}>Redo</button>
        <span className="command-separator" />
        <button type="button" onClick={handleAddPage}>Add page</button>
        <button type="button" onClick={handleRemovePage}>Remove page</button>
        <span className="command-separator" />
        <button type="button" onClick={handleAddRectangle}>Rectangle</button>
        {selectedTextFrame && (
          <button
            type="button"
            className="button secondary"
            onClick={() => setIsEditingText((prev) => !prev)}
          >
            {isEditingText ? 'Done editing' : 'Edit text'}
          </button>
        )}
        {selectedObjectId && (
          <button type="button" className="button danger" onClick={handleDeleteSelected}>
            Delete selected
          </button>
        )}
        <span className="phase-chip">Urdu Rich-Text: Tiptap (M2.3)</span>
      </nav>

      <div className="editor-layout">
        <aside className="pages-panel" aria-label="Document pages">
          <div className="panel-heading">
            <span>Pages</span>
            <small>{document.pageOrder.length}</small>
          </div>
          <ol className="page-list">
            {document.pageOrder.map((pageId, index) => {
              const page = document.pages[pageId]!;
              return (
                <li key={pageId}>
                  <button
                    type="button"
                    className={pageId === activePageId ? 'page-item active' : 'page-item'}
                    onClick={() => setActivePageId(pageId)}
                  >
                    <span className="page-thumbnail"><i /></span>
                    <span>{index + 1}. {page.name}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="workspace">
          <div className="workspace-label">
            <span>{activePage.name}</span>
            <span>
              {pointsToMillimetres(activePage.width).toFixed(0)} ×{' '}
              {pointsToMillimetres(activePage.height).toFixed(0)} mm
            </span>
          </div>
          <section
            className="page-surface"
            aria-label={`${activePage.name} document canvas`}
            style={{ aspectRatio: `${activePage.width} / ${activePage.height}`, position: 'relative' }}
          >
            <div className="margin-guide" aria-hidden="true" />
            <FabricCanvas
              page={activePage}
              objects={visibleObjects}
              onObjectModified={handleObjectModified}
              onSelectionChanged={(id) => {
                setSelectedObjectId(id);
                const obj = id ? document.objects[id] : null;
                if (obj?.type === 'text-frame') {
                  setIsEditingText(true);
                } else {
                  setIsEditingText(false);
                }
              }}
            />
            {isEditingText && selectedTextFrame && activeStory && (
              <TextEditorOverlay
                frame={selectedTextFrame.frame}
                story={activeStory}
                fontFamily={selectedTextFrame.fontFamily}
                fontSize={selectedTextFrame.fontSize}
                color={selectedTextFrame.color}
                lineHeight={selectedTextFrame.lineHeight}
                onCommit={(updatedContent) => {
                  const nextDoc: RePageDocument = {
                    ...document,
                    stories: {
                      ...document.stories,
                      [activeStory.id]: {
                        ...activeStory,
                        content: updatedContent,
                      },
                    },
                  };
                  updateDocument(nextDoc, 'Update Urdu story text');
                }}
                onClose={() => setIsEditingText(false)}
              />
            )}
          </section>
        </main>

        <aside className="inspector-panel" aria-label="Document inspector">
          <div className="panel-heading">Foundation state</div>
          <dl className="facts">
            <div><dt>Schema</dt><dd>v{document.schemaVersion}</dd></div>
            <div><dt>Units</dt><dd>{document.settings.measurementUnit}</dd></div>
            <div><dt>Objects</dt><dd>{activePage.objectOrder.length}</dd></div>
            <div><dt>Stories</dt><dd>{Object.keys(document.stories).length}</dd></div>
            <div><dt>Undo stack</dt><dd>{history.undoCount}</dd></div>
            <div><dt>Redo stack</dt><dd>{history.redoCount}</dd></div>
          </dl>
          <div className="architecture-note">
            <strong>Canonical first</strong>
            <p>This interface reads a validated document model. Fabric, rich text, and collaboration attach through adapters.</p>
          </div>
        </aside>
      </div>

      <footer className="statusbar">
        <span>{message}</span>
        <span>{saveState}</span>
      </footer>
    </div>
  );
}
