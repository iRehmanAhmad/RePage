import React, { useState } from 'react';
import type { PageId, RePageDocument } from '../../domain/document/types';
import { extractHeadingTree, reorderHeadingSection, type HeadingNode } from '../../domain/document/headingNavigationEngine';
import type { UiLanguage } from '../i18n/menuTranslation';

export interface NavigationPaneProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  activePageId: PageId;
  onSelectPage: (pageId: PageId) => void;
  onUpdateDocument?: ((newDoc: RePageDocument) => void) | undefined;
  lang: UiLanguage;
  width?: number | undefined;
  onWidthChange?: ((width: number) => void) | undefined;
}

type NavTab = 'headings' | 'pages' | 'results';

export function NavigationPane({
  isOpen,
  onClose,
  document,
  activePageId,
  onSelectPage,
  onUpdateDocument,
  lang,
  width = 280,
  onWidthChange,
}: NavigationPaneProps) {
  const [activeTab, setActiveTab] = useState<NavTab>('pages');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const headings = extractHeadingTree(document);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX; // Dragging right increases width
      const newWidth = Math.max(180, Math.min(480, startWidth + deltaX));
      onWidthChange?.(newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleReorder = (headingIndex: number, direction: 'up' | 'down') => {
    if (onUpdateDocument) {
      const updated = reorderHeadingSection(document, headingIndex, direction);
      onUpdateDocument(updated);
    }
  };

  const renderHeadingNode = (node: HeadingNode) => {
    const indent = (node.level - 1) * 12;

    return (
      <div key={node.id} style={{ marginBottom: '4px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            paddingLeft: `${8 + indent}px`,
            backgroundColor: '#1e293b',
            borderRadius: '4px',
            color: '#f8fafc',
            fontSize: '11px',
          }}
        >
          <span
            style={{
              fontWeight: node.level === 1 ? 700 : 500,
              color: node.level === 1 ? '#38bdf8' : '#e2e8f0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {node.text}
          </span>
          <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
            <button
              type="button"
              onClick={() => handleReorder(node.paragraphIndex, 'up')}
              title={lang === 'ur' ? 'اوپر کریں' : 'Move Up'}
              style={{
                backgroundColor: '#334155',
                border: 'none',
                color: '#38bdf8',
                borderRadius: '3px',
                padding: '1px 4px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => handleReorder(node.paragraphIndex, 'down')}
              title={lang === 'ur' ? 'نیچے کریں' : 'Move Down'}
              style={{
                backgroundColor: '#334155',
                border: 'none',
                color: '#38bdf8',
                borderRadius: '3px',
                padding: '1px 4px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              ▼
            </button>
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div style={{ marginTop: '2px' }}>
            {node.children.map((child) => renderHeadingNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        backgroundColor: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: '#f8fafc',
        fontSize: '12px',
        zIndex: 20,
        position: 'relative',
      }}
    >
      {/* Right Resizer Drag Handle */}
      <div
        onMouseDown={handleMouseDownResize}
        title="Drag to resize Navigation Pane width"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '5px',
          cursor: 'col-resize',
          zIndex: 25,
          backgroundColor: 'transparent',
        }}
      />

      {/* Pane Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#1e293b',
        }}
      >
        <span style={{ fontWeight: 700, color: '#10b981' }}>
          {lang === 'ur' ? 'نیویگیشن (Navigation)' : 'Navigation'}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '14px',
            cursor: 'pointer',
          }}
          title="Close Navigation Pane"
        >
          ✕
        </button>
      </div>

      {/* Search Input Box */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === 'ur' ? 'دستاویز میں تلاش کریں...' : 'Search document...'}
          style={{
            width: '100%',
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            outline: 'none',
          }}
        />
      </div>

      {/* Sub-tabs: Headings | Pages | Results */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#090d16',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('headings')}
          style={{
            flex: 1,
            padding: '6px 0',
            textAlign: 'center',
            backgroundColor: activeTab === 'headings' ? '#1e293b' : 'transparent',
            color: activeTab === 'headings' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            fontWeight: 600,
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {lang === 'ur' ? 'سرخی (Headings)' : 'Headings'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          style={{
            flex: 1,
            padding: '6px 0',
            textAlign: 'center',
            backgroundColor: activeTab === 'pages' ? '#1e293b' : 'transparent',
            color: activeTab === 'pages' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            fontWeight: 600,
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {lang === 'ur' ? 'صفحات (Pages)' : 'Pages'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('results')}
          style={{
            flex: 1,
            padding: '6px 0',
            textAlign: 'center',
            backgroundColor: activeTab === 'results' ? '#1e293b' : 'transparent',
            color: activeTab === 'results' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            fontWeight: 600,
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {lang === 'ur' ? 'نتائج (Results)' : 'Results'}
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {activeTab === 'pages' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {document.pageOrder.map((pageId, index) => {
              const isActive = pageId === activePageId;
              return (
                <div
                  key={pageId}
                  onClick={() => onSelectPage(pageId)}
                  style={{
                    backgroundColor: isActive ? '#0f766e' : '#1e293b',
                    border: isActive ? '2px solid #10b981' : '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px',
                    height: '110px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '80px',
                      backgroundColor: '#ffffff',
                      borderRadius: '3px',
                      opacity: 0.9,
                    }}
                  />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: isActive ? '#ffffff' : '#94a3b8' }}>
                    {index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'headings' && (
          <div>
            {headings.length > 0 ? (
              headings.map((node) => renderHeadingNode(node))
            ) : (
              <div style={{ padding: '8px 4px', color: '#94a3b8', fontSize: '11px' }}>
                {lang === 'ur' ? 'کوئی سرخی نہیں ملی' : 'No headings found in document.'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div style={{ padding: '8px 4px', color: '#94a3b8', fontSize: '11px' }}>
            {searchQuery ? (
              <span>{lang === 'ur' ? `تلاش برائے: "${searchQuery}"` : `Searching for "${searchQuery}"...`}</span>
            ) : (
              <span>{lang === 'ur' ? 'تلاش کی عبارت ٹائپ کریں' : 'Type to search document text'}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
