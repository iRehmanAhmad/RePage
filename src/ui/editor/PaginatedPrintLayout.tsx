import React from 'react';
import type { PageId, RePageDocument } from '../../domain/document/types';
import { getSectionForPage } from '../../domain/layout/sectionEngine';
import { computeColumnSeparatorGuides } from '../../domain/layout/columnEngine';
import { resolvePageCompositeObjects } from '../../domain/layout/masterPageEngine';
import { getSectionPageNumberString } from '../../domain/unicode/pageNumbering';
import { FabricCanvas } from '../canvas/FabricCanvas';
import { DocumentBodyEditor } from './DocumentBodyEditor';
import { TextEditorOverlay } from './TextEditorOverlay';
import { AppIcon } from '../icons/AppIcon';

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
  onUpdateGuides?: ((pageId: PageId, guides: import('../../domain/document/types').PageGuide[]) => void) | undefined;
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
  onUpdateGuides,
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
        const visibleObjects = resolvePageCompositeObjects(document, pageId);

        const sectionPageNumStr = getSectionPageNumberString(document, pageId);
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

        const section = getSectionForPage(document, pageId);
        const isSectionStart = section.startPageId === pageId && pageIndex > 0;

        // Running Header & Footer Resolution
        const headerStory = section.headerStoryId ? document.stories[section.headerStoryId] : null;
        const footerStory = section.footerStoryId ? document.stories[section.footerStoryId] : null;

        const extractStoryText = (story: typeof headerStory) => {
          if (!story || !story.content?.content?.[0]) return null;
          const p = story.content.content[0];
          return (p.content || [])
            .filter((node): node is { type: 'text'; text: string } => node.type === 'text')
            .map((r) => r.text)
            .join('');
        };

        const headerText = extractStoryText(headerStory) || headerStory?.name || document.metadata.title || 'RePage Document';
        const footerText = extractStoryText(footerStory) || footerStory?.name || 'RePage Studio';

        // Calculate Effective Margins considering Gutter & Mirror Margins
        const pageIndexInDoc = document.pageOrder.indexOf(pageId);
        const isEvenPage = pageIndexInDoc % 2 === 1;

        let effectiveLeftMargin = page.margins.left;
        let effectiveRightMargin = page.margins.right;
        const effectiveTopMargin = page.margins.top;
        const effectiveBottomMargin = page.margins.bottom;

        if (page.mirrorMargins && isEvenPage) {
          effectiveLeftMargin = page.margins.right;
          effectiveRightMargin = page.margins.left;
        }

        const gutterWidth = page.gutter || 0;
        const gutterPos = page.gutterPosition || (document.metadata.locale === 'ur-PK' ? 'right' : 'left');

        if (gutterPos === 'left') {
          effectiveLeftMargin += gutterWidth;
        } else if (gutterPos === 'right') {
          effectiveRightMargin += gutterWidth;
        }

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
              backgroundColor: page.background || '#ffffff',
              boxShadow: isActive
                ? '0 8px 30px rgba(56, 189, 248, 0.3), 0 4px 16px rgba(0,0,0,0.15)'
                : '0 4px 16px rgba(0,0,0,0.12)',
              borderRadius: '2px',
              transition: 'box-shadow 0.2s ease',
            }}
          >
            {/* Section Break Visual Indicator Banner */}
            {isSectionStart && (
              <div
                className="section-break-banner"
                style={{
                  position: 'absolute',
                  top: '-24px',
                  right: '0',
                  left: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#0284c7',
                  backgroundColor: '#e0f2fe',
                  border: '1px stroke #bae6fd',
                  borderRadius: '4px',
                  userSelect: 'none',
                  zIndex: 30,
                }}
              >
                <span>
                  <AppIcon name="cut" size={14} /> {document.metadata.locale === 'ur-PK' ? 'سیکشن بریک' : 'Section Break'} ({section.breakType === 'next-page' ? (document.metadata.locale === 'ur-PK' ? 'نیا صفحہ' : 'Next Page') : (document.metadata.locale === 'ur-PK' ? 'جاری' : 'Continuous')})
                </span>
                <span style={{ fontSize: '9px', opacity: 0.85 }}>
                  {document.metadata.locale === 'ur-PK'
                    ? `کالمز: ${section.columns} | حواشی: ${Math.round(effectiveTopMargin / 2.835)}mm`
                    : `Cols: ${section.columns} | Margins: ${Math.round(effectiveTopMargin / 2.835)}mm`}
                </span>
              </div>
            )}
            {/* Header Region */}
            <div
              style={{
                position: 'absolute',
                top: `${Math.max(8, effectiveTopMargin / 2)}pt`,
                left: `${effectiveLeftMargin}pt`,
                right: `${effectiveRightMargin}pt`,
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
              <span>{headerText}</span>
              <span style={{ fontSize: '9px' }}>{document.metadata.locale === 'ur-PK' ? 'سیکشن ' + section.columns : 'Section Header'}</span>
            </div>

            {/* Bleed Frame Visual Indicator Overlay */}
            {page.bleed &&
              (page.bleed.top > 0 || page.bleed.right > 0 || page.bleed.bottom > 0 || page.bleed.left > 0) && (
                <div
                  className="canvas-bleed-guide"
                  style={{
                    position: 'absolute',
                    top: `-${page.bleed.top}pt`,
                    right: `-${page.bleed.right}pt`,
                    bottom: `-${page.bleed.bottom}pt`,
                    left: `-${page.bleed.left}pt`,
                    border: '1px dashed #ef4444',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '-14px',
                      right: '4px',
                      fontSize: '9px',
                      color: '#ef4444',
                      fontWeight: 600,
                      backgroundColor: '#fee2e2',
                      padding: '1px 4px',
                      borderRadius: '2px',
                    }}
                  >
                    {document.metadata.locale === 'ur-PK' ? 'بلیڈ فریم' : 'Bleed Box'} ({Math.round(page.bleed.top / 2.835)}mm)
                  </span>
                </div>
              )}

            {/* Margin Guide */}
            <div
              className="canvas-margin-guide"
              style={{
                top: `${effectiveTopMargin}pt`,
                right: `${effectiveRightMargin}pt`,
                bottom: `${effectiveBottomMargin}pt`,
                left: `${effectiveLeftMargin}pt`,
                position: 'absolute',
                border: '1px dashed #cbd5e1',
                pointerEvents: 'none',
              }}
            />

            {/* User Guidelines Overlay */}
            {page.guides?.map((guide) => (
              <div
                key={guide.id}
                className={`canvas-user-guide canvas-user-guide-${guide.orientation}`}
                style={{
                  position: 'absolute',
                  top: guide.orientation === 'horizontal' ? `${guide.position}pt` : 0,
                  left: guide.orientation === 'vertical' ? `${guide.position}pt` : 0,
                  width: guide.orientation === 'horizontal' ? '100%' : '1px',
                  height: guide.orientation === 'vertical' ? '100%' : '1px',
                  borderTop: guide.orientation === 'horizontal' ? '1px dashed #06b6d4' : 'none',
                  borderLeft: guide.orientation === 'vertical' ? '1px dashed #06b6d4' : 'none',
                  pointerEvents: 'none',
                  zIndex: 16,
                }}
              />
            ))}

            {/* Interactive Rulers (Horizontal & Vertical) */}
            {document.settings.showRulers && (
              <>
                {/* Horizontal Top Ruler */}
                <div
                  className="canvas-ruler-horizontal"
                  onClick={(e) => {
                    if (!onUpdateGuides) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickXPt = (e.clientX - rect.left) / (zoomLevel / 100);
                    const newGuide = {
                      id: `guide-v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      orientation: 'vertical' as const,
                      position: Math.round(clickXPt),
                    };
                    onUpdateGuides(pageId, [...(page.guides || []), newGuide]);
                  }}
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    left: 0,
                    right: 0,
                    height: '16px',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #cbd5e1',
                    fontSize: '9px',
                    color: '#64748b',
                    cursor: 'crosshair',
                    zIndex: 25,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 4px',
                    userSelect: 'none',
                  }}
                  title={document.metadata.locale === 'ur-PK' ? 'عمودی گائیڈ شامل کرنے کے لیے کلک کریں' : 'Click to add vertical guide'}
                >
                  <span>0 pt</span>
                  <span>{Math.round(page.width)} pt</span>
                </div>

                {/* Vertical Left Ruler */}
                <div
                  className="canvas-ruler-vertical"
                  onClick={(e) => {
                    if (!onUpdateGuides) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickYPt = (e.clientY - rect.top) / (zoomLevel / 100);
                    const newGuide = {
                      id: `guide-h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      orientation: 'horizontal' as const,
                      position: Math.round(clickYPt),
                    };
                    onUpdateGuides(pageId, [...(page.guides || []), newGuide]);
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '-18px',
                    width: '16px',
                    backgroundColor: '#f8fafc',
                    borderRight: '1px solid #cbd5e1',
                    fontSize: '9px',
                    color: '#64748b',
                    cursor: 'crosshair',
                    zIndex: 25,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 0',
                    userSelect: 'none',
                  }}
                  title={document.metadata.locale === 'ur-PK' ? 'افقی گائیڈ شامل کرنے کے لیے کلک کریں' : 'Click to add horizontal guide'}
                >
                  <span>0</span>
                  <span>{Math.round(page.height)}</span>
                </div>
              </>
            )}

            {/* Visual Column Separator Guides (Gutter Rules) */}
            {section.columns > 1 &&
              computeColumnSeparatorGuides(
                page.width,
                page.height,
                page.margins,
                section.columns,
                section.columnGap,
                section.rtlColumnOrder,
              ).map((guide, idx) => (
                <div
                  key={`col-guide-${idx}`}
                  className="canvas-column-separator-guide"
                  style={{
                    position: 'absolute',
                    left: `${guide.x}pt`,
                    top: `${guide.startY}pt`,
                    height: `${guide.endY - guide.startY}pt`,
                    width: '1px',
                    borderLeft: '1px dashed #94a3b8',
                    pointerEvents: 'none',
                    zIndex: 15,
                  }}
                />
              ))}

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
                  columns={section.columns}
                  columnGap={section.columnGap}
                  rtlColumnOrder={section.rtlColumnOrder}
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
                        <AppIcon name="check" size={14} />
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
                bottom: `${Math.max(8, effectiveBottomMargin / 2)}pt`,
                left: `${effectiveLeftMargin}pt`,
                right: `${effectiveRightMargin}pt`,
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
              <span style={{ fontSize: '9px' }}>{footerText}</span>
              <span>{sectionPageNumStr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
