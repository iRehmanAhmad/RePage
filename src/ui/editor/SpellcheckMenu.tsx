import React, { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import {
  broadcastSpellcheckRecheck,
  recheckSpellcheck,
  setSpellcheckMenuHandler,
  type SpellcheckMenuInfo,
} from './spellcheckExtension';
import { addPersonalWord } from '../../domain/language/personalDictionary';
import {
  ignoreWordForSession,
  notePersonalDictionaryChanged,
} from '../../domain/language/urduSpellchecker';

export interface SpellcheckMenuProps {
  editor: Editor | null;
  lang?: 'ur' | 'en';
}

/**
 * Right-click popup for misspelled words: ranked suggestions, Add to
 * dictionary (persisted via the personal dictionary), Ignore for session.
 * One instance per mounted Tiptap editor; the extension calls back with the
 * clicked word's range so replacement is a single transaction.
 */
export function SpellcheckMenu({ editor, lang = 'ur' }: SpellcheckMenuProps) {
  const [info, setInfo] = useState<SpellcheckMenuInfo | null>(null);

  useEffect(() => {
    setSpellcheckMenuHandler(editor, (menuInfo) => setInfo(menuInfo));
    return () => setSpellcheckMenuHandler(editor, null);
  }, [editor]);

  useEffect(() => {
    if (!info) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfo(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [info ]);

  if (!info || !editor) return null;

  const close = () => setInfo(null);

  const applySuggestion = (suggestion: string) => {
    // Guard against stale positions if the document changed while the menu was open.
    const maxPos = editor.view.state.doc.content.size;
    if (info.from < 0 || info.to > maxPos || info.from >= info.to) {
      close();
      return;
    }
    editor
      .chain()
      .setTextSelection({ from: info.from, to: info.to })
      .insertContent(suggestion)
      .run();
    close();
  };

  const addToDictionary = () => {
    addPersonalWord(info.word);
    notePersonalDictionaryChanged();
    // Re-check this editor now; other mounted editors pick it up via broadcast.
    recheckSpellcheck(editor);
    broadcastSpellcheckRecheck();
    close();
  };

  const ignoreOnce = () => {
    ignoreWordForSession(info.word);
    recheckSpellcheck(editor);
    broadcastSpellcheckRecheck();
    close();
  };

  const t = {
    noSuggestions: lang === 'ur' ? 'کوئی تجویز نہیں' : 'No suggestions',
    addToDictionary: lang === 'ur' ? 'لغت میں شامل کریں' : 'Add to dictionary',
    ignore: lang === 'ur' ? 'نظر انداز کریں' : 'Ignore',
  };

  // Clamp inside the viewport so the popup never renders off-screen.
  const x = Math.min(info.x, window.innerWidth - 230);
  const y = Math.min(info.y, window.innerHeight - 220);

  return (
    <>
      {/* Click-catcher: any click outside the popup dismisses it. */}
      <div
        onMouseDown={close}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          background: 'transparent',
        }}
      />
    <div
      role="menu"
      aria-label={lang === 'ur' ? 'املا کی تجاویز' : 'Spelling suggestions'}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 1000,
        minWidth: '200px',
        maxWidth: '230px',
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '8px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        padding: '4px',
        direction: 'rtl',
      }}
    >
      {info.suggestions.length === 0 && (
        <div style={{ padding: '8px 12px', color: '#64748b', fontSize: '13px' }}>
          {t.noSuggestions}
        </div>
      )}
      {info.suggestions.map((s) => (
        <button
          key={s}
          type="button"
          role="menuitem"
          onClick={() => applySuggestion(s)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'right',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '6px',
            color: '#e2e8f0',
            fontSize: '15px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {s}
        </button>
      ))}
      <div style={{ height: '1px', backgroundColor: '#334155', margin: '4px 0' }} />
      <button
        type="button"
        role="menuitem"
        onClick={addToDictionary}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'right',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '6px',
          color: '#93c5fd',
          fontSize: '13px',
          fontWeight: 600,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1e293b';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {t.addToDictionary}
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={ignoreOnce}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'right',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '6px',
          color: '#94a3b8',
          fontSize: '13px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1e293b';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {t.ignore}
      </button>
    </div>
    </>
  );
}
