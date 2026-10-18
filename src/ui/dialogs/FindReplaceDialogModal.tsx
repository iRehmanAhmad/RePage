import React, { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import type { RePageDocument } from '../../domain/document/types';
import type { UiLanguage } from '../i18n/menuTranslation';
import { findInUrduText, replaceInUrduText } from '../../domain/rich-text/findReplace';
import { CustomMessageBoxModal } from './CustomMessageBoxModal';
import { AppIcon } from '../icons/AppIcon';

export interface FindReplaceDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'find' | 'replace';
  document: RePageDocument;
  activeEditor?: Editor | null;
  onUpdateDocument?: (nextDoc: RePageDocument) => void;
  lang: UiLanguage;
}

export function FindReplaceDialogModal({
  isOpen,
  onClose,
  document,
  activeEditor,
  onUpdateDocument,
  lang,
  initialTab = 'find',
}: FindReplaceDialogModalProps) {
  const [activeTab, setActiveTab] = useState<'find' | 'replace'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [ignoreAerab, setIgnoreAerab] = useState(true);
  const [matchVariants, setMatchVariants] = useState(true);
  const [matchCase, setMatchCase] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const [msgBox, setMsgBox] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'alert';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const isUr = lang === 'ur';

  // Helper to extract matches with exact character positions inside Tiptap active editor
  const getEditorMatches = () => {
    if (!activeEditor || !searchQuery.trim()) return [];
    const doc = activeEditor.state.doc;
    const matchesList: { from: number; to: number }[] = [];

    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const found = findInUrduText(node.text, searchQuery, { ignoreAerab, matchVariants });
        for (const m of found) {
          matchesList.push({
            from: pos + m.index,
            to: pos + m.index + m.length,
          });
        }
      }
    });
    return matchesList;
  };

  // Calculate total matching occurrences across document stories (for summary)
  const matches = (() => {
    if (!searchQuery.trim()) return [];
    const list: { storyId: string; pIndex: number; runIndex: number; text: string }[] = [];
    for (const [storyId, story] of Object.entries(document.stories)) {
      if (story.content?.content) {
        story.content.content.forEach((p, pIdx) => {
          if (p.content) {
            p.content.forEach((run, rIdx) => {
              if (run.type === 'text' && 'text' in run && typeof run.text === 'string') {
                const found = findInUrduText(run.text, searchQuery, { ignoreAerab, matchVariants });
                if (found.length > 0) {
                  found.forEach(() => {
                    list.push({ storyId, pIndex: pIdx, runIndex: rIdx, text: run.text as string });
                  });
                }
              }
            });
          }
        });
      }
    }
    return list;
  })();

  const totalMatches = matches.length;

  const handleFindNext = () => {
    if (!searchQuery.trim()) return;

    if (activeEditor) {
      const matchesList = getEditorMatches();
      if (matchesList.length === 0) {
        setStatusMsg(isUr ? 'کوئی متن نہیں ملا' : 'No matches found.');
        return;
      }

      const currentPos = activeEditor.state.selection.to;
      let nextMatch = matchesList.find((m) => m.from >= currentPos);

      if (!nextMatch) {
        // Reached end of document! Show custom dark-themed confirm message box
        setMsgBox({
          isOpen: true,
          title: isUr ? 'تلاش کی حد (Search Scope)' : 'RePage Document Search',
          message: isUr
            ? 'دستاویز کے آخری حصے تک پہنچ چکے ہیں۔ کیا آپ شروع سے دوبارہ تلاش کرنا چاہتے ہیں؟'
            : "We've reached the end of the document. Do you want to continue searching from the beginning?",
          type: 'confirm',
          confirmText: isUr ? 'جی ہاں (Yes)' : 'Yes',
          cancelText: isUr ? 'نہیں (No)' : 'No',
          onConfirm: () => {
            setMsgBox(null);
            const first = matchesList[0];
            if (first && activeEditor) {
              activeEditor.chain().focus().setTextSelection({ from: first.from, to: first.to }).scrollIntoView().run();
              setActiveMatchIndex(0);
              setStatusMsg(isUr ? `${matchesList.length} میں سے 1` : `Match 1 of ${matchesList.length}`);
            }
          },
          onCancel: () => {
            setMsgBox(null);
            setStatusMsg(isUr ? 'تلاش مکمل ہوئی۔' : 'Finished searching document.');
          },
        });
        return;
      }

      if (nextMatch) {
        activeEditor
          .chain()
          .focus()
          .setTextSelection({ from: nextMatch.from, to: nextMatch.to })
          .scrollIntoView()
          .run();

        const matchIdx = matchesList.findIndex((m) => m.from === nextMatch!.from);
        setActiveMatchIndex(matchIdx);
        setStatusMsg(isUr ? `${matchesList.length} میں سے ${matchIdx + 1}` : `Match ${matchIdx + 1} of ${matchesList.length}`);
      }
      return;
    }

    if (totalMatches === 0) {
      setStatusMsg(isUr ? 'کوئی متن نہیں ملا' : 'No matches found');
      return;
    }
    const nextIdx = (activeMatchIndex + 1) % totalMatches;
    setActiveMatchIndex(nextIdx);
    setStatusMsg(isUr ? `${totalMatches} میں سے ${nextIdx + 1}` : `Match ${nextIdx + 1} of ${totalMatches}`);
  };

  const handleFindPrev = () => {
    if (!searchQuery.trim()) return;

    if (activeEditor) {
      const matchesList = getEditorMatches();
      if (matchesList.length === 0) {
        setStatusMsg(isUr ? 'کوئی متن نہیں ملا' : 'No matches found.');
        return;
      }

      const currentPos = activeEditor.state.selection.from;
      let prevMatch = matchesList.filter((m) => m.to <= currentPos).pop();

      if (!prevMatch) {
        // Reached start of document! Show custom dark-themed confirm message box
        setMsgBox({
          isOpen: true,
          title: isUr ? 'تلاش کی حد (Search Scope)' : 'RePage Document Search',
          message: isUr
            ? 'دستاویز کے شروع تک پہنچ چکے ہیں۔ کیا آپ آخر سے دوبارہ تلاش کرنا چاہتے ہیں؟'
            : "We've reached the beginning of the document. Do you want to continue searching from the end?",
          type: 'confirm',
          confirmText: isUr ? 'جی ہاں (Yes)' : 'Yes',
          cancelText: isUr ? 'نہیں (No)' : 'No',
          onConfirm: () => {
            setMsgBox(null);
            const last = matchesList[matchesList.length - 1];
            if (last && activeEditor) {
              activeEditor.chain().focus().setTextSelection({ from: last.from, to: last.to }).scrollIntoView().run();
              setActiveMatchIndex(matchesList.length - 1);
              setStatusMsg(isUr ? `${matchesList.length} میں سے ${matchesList.length}` : `Match ${matchesList.length} of ${matchesList.length}`);
            }
          },
          onCancel: () => {
            setMsgBox(null);
            setStatusMsg(isUr ? 'تلاش مکمل ہوئی۔' : 'Finished searching document.');
          },
        });
        return;
      }

      if (prevMatch) {
        activeEditor
          .chain()
          .focus()
          .setTextSelection({ from: prevMatch.from, to: prevMatch.to })
          .scrollIntoView()
          .run();

        const matchIdx = matchesList.findIndex((m) => m.from === prevMatch!.from);
        setActiveMatchIndex(matchIdx);
        setStatusMsg(isUr ? `${matchesList.length} میں سے ${matchIdx + 1}` : `Match ${matchIdx + 1} of ${matchesList.length}`);
      }
      return;
    }

    if (totalMatches === 0) {
      setStatusMsg(isUr ? 'کوئی متن نہیں ملا' : 'No matches found');
      return;
    }
    const prevIdx = (activeMatchIndex - 1 + totalMatches) % totalMatches;
    setActiveMatchIndex(prevIdx);
    setStatusMsg(isUr ? `${totalMatches} میں سے ${prevIdx + 1}` : `Match ${prevIdx + 1} of ${totalMatches}`);
  };

  const handleReplaceSingle = () => {
    if (!searchQuery.trim()) return;
    if (activeEditor) {
      const { from, to } = activeEditor.state.selection;
      const selectedText = activeEditor.state.doc.textBetween(from, to, ' ');

      if (from !== to && findInUrduText(selectedText, searchQuery, { ignoreAerab, matchVariants }).length > 0) {
        activeEditor.chain().focus().insertContent(replaceQuery).run();
        setStatusMsg(isUr ? 'ایک جگہ تبدیل کر دیا گیا' : 'Replaced 1 occurrence');
      }

      handleFindNext();
      return;
    }
    handleReplaceAll();
  };

  const handleReplaceAll = () => {
    if (!searchQuery.trim() || !onUpdateDocument) return;
    const updatedStories = { ...document.stories };
    let count = 0;

    for (const [storyId, story] of Object.entries(updatedStories)) {
      if (story.content?.content) {
        const nextContent = { ...story.content };
        nextContent.content = nextContent.content.map((p) => {
          if (p.content) {
            const nextRuns = p.content.map((run) => {
              if (run.type === 'text' && 'text' in run && typeof run.text === 'string') {
                const found = findInUrduText(run.text, searchQuery, { ignoreAerab, matchVariants });
                if (found.length > 0) {
                  count += found.length;
                  return {
                    ...run,
                    text: replaceInUrduText(run.text, searchQuery, replaceQuery, { ignoreAerab, matchVariants }),
                  };
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
    const summaryText = isUr
      ? `مکمل ہو گیا۔ کل ${count} مقامات پر متن کامیابی کے ساتھ تبدیل کر دیا گیا ہے۔`
      : `All done. We made ${count} replacement${count === 1 ? '' : 's'}.`;
    setStatusMsg(summaryText);

    // Display Custom Alert Message Box
    setMsgBox({
      isOpen: true,
      title: isUr ? 'تبدیلی مکمل (Replace All Summary)' : 'RePage Replace All',
      message: summaryText,
      type: 'alert',
      confirmText: isUr ? 'ٹھیک ہے (OK)' : 'OK',
      onConfirm: () => {
        setMsgBox(null);
      },
    });
  };

  return (
    <>
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
          zIndex: 99999,
        }}
      >
        <div
          style={{
            width: '450px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '16px 20px',
            color: '#f8fafc',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            fontSize: '12px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              borderBottom: '1px solid #334155',
              paddingBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('find')}
                style={{
                  backgroundColor: activeTab === 'find' ? '#0284c7' : 'transparent',
                  color: activeTab === 'find' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isUr ? 'تلاش (Find)' : 'Find'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('replace')}
                style={{
                  backgroundColor: activeTab === 'replace' ? '#0284c7' : 'transparent',
                  color: activeTab === 'replace' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isUr ? 'تبدیل (Replace)' : 'Replace'}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <AppIcon name="dismiss" size={16} />
            </button>
          </div>

          {/* Form Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                {isUr ? 'تلاش کا متن (Find what):' : 'Find what:'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFindNext();
                    }
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setStatusMsg('');
                    setActiveMatchIndex(0);
                  }}
                  placeholder={isUr ? 'تلاش کا متن ٹائپ کریں...' : 'Type text to find...'}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {totalMatches > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '10px',
                      color: '#10b981',
                      fontWeight: 700,
                    }}
                  >
                    {totalMatches} matches
                  </span>
                )}
              </div>
            </div>

            {activeTab === 'replace' && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                  {isUr ? 'متبادل متن (Replace with):' : 'Replace with:'}
                </label>
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder={isUr ? 'متبادل متن ٹائپ کریں...' : 'Type replacement text...'}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Search Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={ignoreAerab}
                  onChange={(e) => setIgnoreAerab(e.target.checked)}
                />
                <span>{isUr ? 'اعراب نظر انداز کریں (Ignore Diacritics)' : 'Ignore Diacritics/Aerab'}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={matchVariants}
                  onChange={(e) => setMatchVariants(e.target.checked)}
                />
                <span>{isUr ? 'حروف یکساں رکھیں (ك=ک, ي=y)' : 'Match Character Variants (ك=ک, ي=ی)'}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                />
                <span>{isUr ? 'حروف کی کیس یکساں رکھیں (Match Case)' : 'Match Case'}</span>
              </label>
            </div>

            {/* Status Message */}
            {statusMsg && (
              <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, textAlign: 'center', padding: '2px 0' }}>
                {statusMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleFindPrev}
                disabled={!searchQuery}
                style={{
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: searchQuery ? 'pointer' : 'not-allowed',
                  opacity: searchQuery ? 1 : 0.5,
                }}
              >
                {isUr ? 'پچھلا (Prev)' : 'Find Prev'}
              </button>

              <button
                type="button"
                onClick={handleFindNext}
                disabled={!searchQuery}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: searchQuery ? 'pointer' : 'not-allowed',
                  opacity: searchQuery ? 1 : 0.5,
                }}
              >
                {isUr ? 'اگلا (Next)' : 'Find Next'}
              </button>

              {activeTab === 'replace' && (
                <>
                  <button
                    type="button"
                    onClick={handleReplaceSingle}
                    disabled={!searchQuery}
                    style={{
                      backgroundColor: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: searchQuery ? 'pointer' : 'not-allowed',
                      opacity: searchQuery ? 1 : 0.5,
                    }}
                  >
                    {isUr ? 'تبدیل کریں' : 'Replace'}
                  </button>

                  <button
                    type="button"
                    onClick={handleReplaceAll}
                    disabled={!searchQuery}
                    style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: searchQuery ? 'pointer' : 'not-allowed',
                      opacity: searchQuery ? 1 : 0.5,
                    }}
                  >
                    {isUr ? 'تمام تبدیل کریں' : 'Replace All'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Render Custom Message Box Modal */}
      {msgBox && msgBox.isOpen && (
        <CustomMessageBoxModal
          isOpen={msgBox.isOpen}
          title={msgBox.title}
          message={msgBox.message}
          type={msgBox.type}
          confirmText={msgBox.confirmText}
          cancelText={msgBox.cancelText}
          onConfirm={msgBox.onConfirm}
          onCancel={msgBox.onCancel}
        />
      )}
    </>
  );
}
