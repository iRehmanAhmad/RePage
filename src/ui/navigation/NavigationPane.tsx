import React, { useState } from 'react';
import type { PageId, RePageDocument } from '../../domain/document/types';
import { extractHeadingTree, reorderHeadingSection, type HeadingNode } from '../../domain/document/headingNavigationEngine';
import type { UiLanguage } from '../i18n/menuTranslation';
import { findInUrduText, replaceInUrduText } from '../../domain/rich-text/findReplace';
import { AppIcon } from '../icons/AppIcon';

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
  initialTab?: NavTab | undefined;
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
  initialTab,
}: NavigationPaneProps) {
  const [activeTab, setActiveTab] = useState<NavTab>(initialTab || 'pages');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [ignoreAerab, setIgnoreAerab] = useState(true);
  const [matchVariants, setMatchVariants] = useState(true);
  const [replaceMsg, setReplaceMsg] = useState('');

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const results: { storyId: string; paragraphIndex: number; text: string; matchesCount: number }[] = [];
    for (const [storyId, story] of Object.entries(document.stories)) {
      if (story.content?.content) {
        story.content.content.forEach((p, pIdx) => {
          if (p.content) {
            const fullParaText = p.content
              .filter((r) => r.type === 'text' && 'text' in r && typeof r.text === 'string')
              .map((r) => ('text' in r ? r.text : ''))
              .join('');
            if (fullParaText) {
              const matches = findInUrduText(fullParaText, searchQuery, { ignoreAerab, matchVariants });
              if (matches.length > 0) {
                results.push({
                  storyId,
                  paragraphIndex: pIdx,
                  text: fullParaText,
                  matchesCount: matches.length,
                });
              }
            }
          }
        });
      }
    }
    return results;
  }, [document.stories, searchQuery, ignoreAerab, matchVariants]);

  const handleReplaceAll = () => {
    if (!searchQuery || !onUpdateDocument) return;
    const updatedStories = { ...document.stories };
    let totalCount = 0;

    for (const [storyId, story] of Object.entries(updatedStories)) {
      if (story.content?.content) {
        const nextContent = { ...story.content };
        nextContent.content = nextContent.content.map((p) => {
          if (p.content) {
            const nextRuns = p.content.map((run) => {
              if (run.type === 'text' && typeof run.text === 'string') {
                const matches = findInUrduText(run.text, searchQuery, { ignoreAerab, matchVariants });
                if (matches.length > 0) {
                  totalCount += matches.length;
                  return { ...run, text: replaceInUrduText(run.text, searchQuery, replaceQuery, { ignoreAerab, matchVariants }) };
                }
              }
              return run;
            });
            return { ...p, content: nextRuns };
          }
          return p;
        });
        updatedStories[storyId] = { ...story, content: nextContent };
      }
    }

    onUpdateDocument({ ...document, stories: updatedStories });
    setReplaceMsg(lang === 'ur' ? `${totalCount} مقامات تبدیل کر دیے گئے` : `Replaced ${totalCount} occurrences`);
  };

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
              <AppIcon name="arrow-up" size={12} />
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
              <AppIcon name="arrow-down" size={12} />
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
          <AppIcon name="dismiss" />
        </button>
      </div>

      <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setReplaceMsg(''); }}
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
          {lang === 'ur' ? 'سرخی' : 'Headings'}
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
          {lang === 'ur' ? 'صفحات' : 'Pages'}
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
          {lang === 'ur' ? 'تلاش و تبدیل' : 'Find & Replace'}
        </button>
      </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#f8fafc' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: '#94a3b8' }}>
                {lang === 'ur' ? 'تبدیل کریں بذریعہ:' : 'Replace with:'}
              </label>
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder={lang === 'ur' ? 'متبادل متن...' : 'Replacement text...'}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '2px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '10px', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={ignoreAerab}
                  onChange={(e) => setIgnoreAerab(e.target.checked)}
                />
                <span>{lang === 'ur' ? 'اعراب نظر انداز کریں' : 'Ignore Diacritics/Aerab'}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '10px', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={matchVariants}
                  onChange={(e) => setMatchVariants(e.target.checked)}
                />
                <span>{lang === 'ur' ? 'حروف یکساں رکھیں (ك=ک, ي=ی)' : 'Match Character Variants'}</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleReplaceAll}
                disabled={!searchQuery}
                style={{
                  flex: 1,
                  padding: '6px',
                  backgroundColor: searchQuery ? '#0284c7' : '#334155',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '11px',
                  cursor: searchQuery ? 'pointer' : 'not-allowed',
                }}
              >
                {lang === 'ur' ? 'تمام تبدیل کریں' : 'Replace All'}
              </button>
            </div>

            {replaceMsg && (
              <div style={{ padding: '4px', color: '#10b981', fontSize: '10px', textAlign: 'center', fontWeight: 600 }}>
                {replaceMsg}
              </div>
            )}

            {/* Results Match Summary & Snippet List */}
            {searchQuery.trim() !== '' && (
              <div style={{ marginTop: '8px', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
                <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, marginBottom: '6px' }}>
                  {searchResults.reduce((acc, r) => acc + r.matchesCount, 0)}{' '}
                  {lang === 'ur' ? 'مطابقت کے مقامات ملے:' : 'results found:'}
                </div>
                {searchResults.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#94a3b8', padding: '4px' }}>
                    {lang === 'ur' ? 'کوئی متن نہیں ملا' : 'No matching text found'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                    {searchResults.map((res, idx) => (
                      <div
                        key={`${res.storyId}-${res.paragraphIndex}-${idx}`}
                        style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '4px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          direction: 'rtl',
                          textAlign: 'right',
                          fontFamily: "'Noto Nastaliq Urdu', serif",
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#f8fafc' }}>
                          {res.text}
                        </div>
                        <span style={{ fontSize: '9px', color: '#10b981', direction: 'ltr', display: 'block' }}>
                          {res.matchesCount} match{res.matchesCount > 1 ? 'es' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
