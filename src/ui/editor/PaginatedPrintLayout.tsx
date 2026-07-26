import React from 'react';
import type { PageId, PageObject, RePageDocument } from '../../domain/document/types';
import { renderPageNumberToken } from '../../domain/layout/paginationEngine';
import { FabricCanvas } from '../canvas/FabricCanvas';
import { DocumentBodyEditor } from './DocumentBodyEditor';
import { TextEditorOverlay } from './TextEditorOverlay';

export interface PaginatedPrintLayoutProps {
  document: RePageDocument;
  activePageId: PageId;
  zoomLevel: number;
  activeFontFamily: string;
  activeFontSize: number;
  pendingChar: string | null;
  editingObjectId: string | null;
  isObjectSelectionMode?: boolean;
  bodyEditorFocusRequest?: number;
  selectedObjectId?: string | null;
  _selectedObjectId?: string | null;
  onSelectPage: (pageId: string) => void;
  onSelectObject: (objectId: string | null) => void;
  onEditObject: (objectId: string | null) => void;
  onObjectModified: (objectId: string, coords: any) => void;
  onCommitStory: (storyId: string, content: any) => void;
  onRequestBodyFocus?: () => void;
  onEditorReady?: ((editor: any) => void) | undefined;
  onSelectionChange?: ((info: any) => void) | undefined;
  onUpdateTableCell?: ((tableId: string, rowIndex: number, colIndex: number, text: string) => void) | undefined;
  onActiveTableCellChange?: ((rowIndex: number, colIndex: number) => void) | undefined;
}

export function PaginatedPrintLayout({
  document,
  activePageId,
  zoomLevel,
  activeFontFamily,
  activeFontSize,
  pendingChar,
  editingObjectId,
  isObjectSelectionMode: _isObjectSelectionMode = false,
  bodyEditorFocusRequest = 0,
  selectedObjectId,
  onSelectPage,
  onSelectObject,
  onEditObject,
  onObjectModified,
  onCommitStory,
  onRequestBodyFocus,
  onEditorReady,
  onSelectionChange,
  onUpdateTableCell,
  onActiveTableCellChange,
}: PaginatedPrintLayoutProps) {
  const primaryStoryId = 'primary-body-story';
  const primaryStory = document.stories[primaryStoryId] || {
    id: primaryStoryId,
    name: 'Primary Story',
    content: { type: 'doc', content: [] },
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        padding: '32px 0 64px 0',
        width: '100%',
      }}
    >
      {document.pageOrder.map((pageId, pageIndex) => {
        const page = document.pages[pageId];
        if (!page) return null;

        const isActive = pageId === activePageId;
        const visibleObjects = page.objectOrder
          .map((id) => document.objects[id])
          .filter(Boolean) as PageObject[];

        const pageNumberStr = renderPageNumberToken(
          pageIndex,
          document.pageOrder.length,
          document.metadata.locale,
        );
        const editingObject = editingObjectId ? document.objects[editingObjectId] : null;
        const editingTextBox =
          editingObject?.type === 'text-frame' || editingObject?.type === 'rectangle'
            ? editingObject
            : null;
        const editingStoryId = editingTextBox
          ? editingTextBox.storyId || `shape-story-${editingTextBox.id}`
          : null;
        const editingStory = editingStoryId
          ? document.stories[editingStoryId] || {
              id: editingStoryId,
              name: 'Shape Text',
              content: { type: 'doc', content: [] },
            }
          : null;
        const isEditingTextBoxOnPage = Boolean(
          editingTextBox?.pageId === pageId && editingStory,
        );
        const editingObj = editingObjectId ? document.objects[editingObjectId] : null;
        const editingTable = editingObj && editingObj.type === 'table' ? editingObj : null;
        const isEditingTableOnPage = Boolean(editingTable?.pageId === pageId);

        return (
          <div
            key={pageId}
            onClick={() => onSelectPage(pageId)}
            className={`canvas-paper-frame ${isActive ? 'active-page-frame' : ''}`}
            style={{
              width: `${page.width}pt`,
              height: `${page.height}pt`,
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              position: 'relative',
              backgroundColor: '#ffffff',
              boxShadow: isActive
                ? '0 8px 30px rgba(56, 189, 248, 0.3), 0 4px 16px rgba(0,0,0,0.15)'
                : '0 4px 16px rgba(0,0,0,0.12)',
              borderRadius: '2px',
              transition: 'box-shadow 0.2s ease',
            }}
          >
            {/* Header Region */}
            <div
              style={{
                position: 'absolute',
                top: `${Math.max(8, page.margins.top / 2)}pt`,
                left: `${page.margins.left}pt`,
                right: `${page.margins.right}pt`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                color: '#64748b',
                userSelect: 'none',
                borderBottom: '1px stroke #e2e8f0',
                paddingBottom: '2px',
              }}
            >
              <span>{document.metadata.title}</span>
              <span style={{ fontSize: '9px' }}>RePage Header</span>
            </div>

            {/* Margin Guide */}
            <div
              className="canvas-margin-guide"
              style={{
                top: `${page.margins.top}pt`,
                right: `${page.margins.right}pt`,
                bottom: `${page.margins.bottom}pt`,
                left: `${page.margins.left}pt`,
                position: 'absolute',
                border: '1px dashed #cbd5e1',
                pointerEvents: 'none',
              }}
            />

            {/* Primary Document Body Editor */}
            <div
              style={{
                position: 'absolute',
                top: `${page.margins.top}pt`,
                right: `${page.margins.right}pt`,
                bottom: `${page.margins.bottom}pt`,
                left: `${page.margins.left}pt`,
                zIndex: 10,
                pointerEvents: editingObjectId ? 'none' : 'auto',
              }}
            >
              {isActive ? (
                <DocumentBodyEditor
                  story={primaryStory}
                  fontFamily={activeFontFamily}
                  fontSize={activeFontSize}
                  color="#172119"
                  lineHeight={1.8}
                  pendingChar={!editingObjectId ? pendingChar : null}
                  focusRequest={isActive ? bodyEditorFocusRequest : 0}
                  onCommit={(updatedContent) => onCommitStory(primaryStoryId, updatedContent)}
                  onEditorReady={onEditorReady}
                  onSelectionChange={onSelectionChange}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: '0',
                    direction: 'rtl',
                    fontFamily: activeFontFamily,
                    fontSize: `${activeFontSize}px`,
                    color: '#475569',
                    opacity: 0.85,
                  }}
                >
                  صفحہ {pageIndex + 1} - اردو دستاویز متن
                </div>
              )}
            </div>

            {/* Fabric Vector Canvas for Floating Objects & Text Boxes */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                pointerEvents: editingObjectId ? 'none' : 'auto',
              }}
            >
              <FabricCanvas
                page={page}
                objects={visibleObjects}
                stories={document.stories}
                assets={document.assets}
                selectedObjectId={selectedObjectId}
                editingObjectId={editingObjectId}
                onObjectModified={onObjectModified}
                onSelectionChanged={(id) => {
                  onSelectObject(id);
                }}
                onObjectDoubleClicked={(id) => {
                  const targetObj = document.objects[id];
                  if (targetObj?.type === 'text-frame' || targetObj?.type === 'rectangle' || targetObj?.type === 'table') {
                    onSelectObject(id);
                    onEditObject(id);
                  }
                }}
                onBlankCanvasClick={() => {
                  onSelectObject(null);
                  onRequestBodyFocus?.();
                }}
              />
            </div>

              {isEditingTextBoxOnPage && editingTextBox && editingStory && (
                <TextEditorOverlay
                  frame={editingTextBox.frame}
                  story={editingStory}
                  fontFamily={'fontFamily' in editingTextBox ? editingTextBox.fontFamily : activeFontFamily}
                  fontSize={'fontSize' in editingTextBox ? editingTextBox.fontSize : 20}
                  color={'color' in editingTextBox ? editingTextBox.color : '#1e293b'}
                  lineHeight={'lineHeight' in editingTextBox ? editingTextBox.lineHeight : 1.8}
                  pendingChar={pendingChar}
                  onCommit={(updatedContent) => {
                    const sid = editingTextBox.storyId || `shape-story-${editingTextBox.id}`;
                    onCommitStory(sid, updatedContent);
                  }}
                  onClose={() => onEditObject(null)}
                  onEditorReady={onEditorReady}
                  onSelectionChange={onSelectionChange}
                />
              )}

              {isEditingTableOnPage && editingTable && (
                <>
                  {/* Click-outside backdrop to commit and exit edit mode */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 30,
                      background: 'rgba(0,0,0,0.01)',
                      cursor: 'default',
                    }}
                    onClick={() => onEditObject(null)}
                  />

                  <div
                    style={{
                      position: 'absolute',
                      left: `${editingTable.frame.x}pt`,
                      top: `${editingTable.frame.y - 32}pt`,
                      width: `${editingTable.frame.width}pt`,
                      minHeight: `${editingTable.frame.height + 36}pt`,
                      zIndex: 35,
                      backgroundColor: '#ffffff',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
                      borderRadius: '6px',
                      border: '2px solid #0284c7',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '6px',
                    }}
                  >
                    {/* Header Control Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        marginBottom: '6px',
                        background: '#f0f9ff',
                        borderRadius: '4px',
                        borderBottom: '1px solid #bae6fd',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onEditObject(null);
                          onSelectObject(editingTable.id);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#0369a1',
                          background: '#ffffff',
                          border: '1px solid #7dd3fc',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        title="Exit text edit mode and enable dragging/resizing table on canvas"
                      >
                        <span>✥</span>
                        <span>جدول منتقل کریں (Move Table)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditObject(null)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#ffffff',
                          background: '#0284c7',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <span>✓</span>
                        <span>مکمل (Done)</span>
                      </button>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto' }}>
                      <table
                        style={{
                          width: '100%',
                          height: '100%',
                          borderCollapse: 'collapse',
                          direction: 'rtl',
                        }}
                      >
                        <tbody>
                          {editingTable.rows.map((row, rIdx) => (
                            <tr key={row.id}>
                              {row.cells.map((cell, cIdx) => {
                                let text = '';
                                const contentObj = cell.content as { content?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
                                if (contentObj?.content) {
                                  text = contentObj.content
                                    .map((p) => p.content ? p.content.map((run) => (run.type === 'text' ? run.text || '' : '')).join('') : '')
                                    .join(' ');
                                }
                                return (
                                  <td
                                    key={cell.id}
                                    style={{
                                      border: `1px solid ${editingTable.borderColor || '#cbd5e1'}`,
                                      padding: '4px 6px',
                                      backgroundColor: cell.backgroundColor || '#ffffff',
                                      direction: 'rtl',
                                      verticalAlign: 'middle',
                                    }}
                                  >
                                    <input
                                      type="text"
                                      value={text}
                                      onFocus={() => onActiveTableCellChange?.(rIdx, cIdx)}
                                      onChange={(e) => onUpdateTableCell?.(editingTable.id, rIdx, cIdx, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                          e.preventDefault();
                                          onEditObject(null);
                                        }
                                      }}
                                      style={{
                                        width: '100%',
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        direction: 'rtl',
                                        fontFamily: activeFontFamily,
                                        fontSize: '13px',
                                        color: '#0f172a',
                                        textAlign: 'right',
                                      }}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

            {/* Footer Region */}
            <div
              style={{
                position: 'absolute',
                bottom: `${Math.max(8, page.margins.bottom / 2)}pt`,
                left: `${page.margins.left}pt`,
                right: `${page.margins.right}pt`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                color: '#64748b',
                userSelect: 'none',
                borderTop: '1px stroke #e2e8f0',
                paddingTop: '2px',
              }}
            >
              <span style={{ fontSize: '9px' }}>RePage Studio</span>
              <span>{pageNumberStr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
