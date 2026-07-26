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
                zIndex: 5,
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
                zIndex: 10,
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
                  if (targetObj?.type === 'text-frame' || targetObj?.type === 'rectangle') {
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
                />
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
