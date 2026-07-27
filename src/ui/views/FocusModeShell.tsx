import React, { useEffect, useState } from 'react';
import type { RePageDocument, PageId } from '../../domain/document/types';
import { AppIcon } from '../icons/AppIcon';

export interface FocusModeShellProps {
  isActive: boolean;
  onExit: () => void;
  document: RePageDocument;
  activePageId: PageId;
  onSelectPage: (pageId: PageId) => void;
  lang?: 'ur' | 'en';
  children: React.ReactNode;
}

export const FocusModeShell: React.FC<FocusModeShellProps> = ({
  isActive,
  onExit,
  document,
  activePageId,
  onSelectPage,
  lang = 'ur',
  children,
}) => {
  const [showToolbar, setShowToolbar] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');

  const isUr = lang === 'ur';
  const pageIndex = document.pageOrder.indexOf(activePageId);
  const currentPageNumber = pageIndex >= 0 ? pageIndex + 1 : 1;
  const totalPages = document.pageOrder.length;

  // Global ESC key listener to exit Focus Mode
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onExit]);

  if (!isActive) return null;

  const bgColors = {
    dark: '#090d16',
    sepia: '#f4ebd9',
    light: '#f8fafc',
  };

  const textColors = {
    dark: '#f8fafc',
    sepia: '#433422',
    light: '#0f172a',
  };

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      onSelectPage(document.pageOrder[pageIndex - 1]!);
    }
  };

  const handleNextPage = () => {
    if (pageIndex < totalPages - 1) {
      onSelectPage(document.pageOrder[pageIndex + 1]!);
    }
  };

  return (
    <div
      data-testid="focus-mode-shell"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: bgColors[theme],
        color: textColors[theme],
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
      onMouseMove={() => setShowToolbar(true)}
    >
      {/* Top Floating Control Bar */}
      <div
        style={{
          position: 'absolute',
          top: showToolbar ? '16px' : '-70px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #334155',
          borderRadius: '24px',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          color: '#f8fafc',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 10001,
          transition: 'top 0.3s ease',
          direction: isUr ? 'rtl' : 'ltr',
          fontSize: '13px',
        }}
      >
        <span style={{ fontWeight: 700, color: '#38bdf8' }}>
          <AppIcon name="target" /> {isUr ? 'فوکس موڈ' : 'Focus Mode'}
        </span>

        <span style={{ color: '#64748b' }}>|</span>

        {/* Page Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={pageIndex <= 0}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: pageIndex <= 0 ? '#475569' : '#38bdf8',
              cursor: pageIndex <= 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            <AppIcon name={isUr ? 'arrow-right' : 'arrow-left'} />
          </button>
          <span>
            {isUr ? `صفحہ ${currentPageNumber} / ${totalPages}` : `Page ${currentPageNumber} of ${totalPages}`}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={pageIndex >= totalPages - 1}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: pageIndex >= totalPages - 1 ? '#475569' : '#38bdf8',
              cursor: pageIndex >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            <AppIcon name={isUr ? 'arrow-left' : 'arrow-right'} />
          </button>
        </div>

        <span style={{ color: '#64748b' }}>|</span>

        {/* Theme Picker */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            title="Dark Theme"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#090d16',
              border: theme === 'dark' ? '2px solid #38bdf8' : '1px solid #475569',
              cursor: 'pointer',
            }}
          />
          <button
            type="button"
            onClick={() => setTheme('sepia')}
            title="Sepia Theme"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#f4ebd9',
              border: theme === 'sepia' ? '2px solid #38bdf8' : '1px solid #475569',
              cursor: 'pointer',
            }}
          />
          <button
            type="button"
            onClick={() => setTheme('light')}
            title="Light Theme"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#f8fafc',
              border: theme === 'light' ? '2px solid #38bdf8' : '1px solid #475569',
              cursor: 'pointer',
            }}
          />
        </div>

        <span style={{ color: '#64748b' }}>|</span>

        {/* Exit Button */}
        <button
          type="button"
          onClick={onExit}
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            color: '#f8fafc',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isUr ? 'خارج (ESC)' : 'Exit (ESC)'}
        </button>
      </div>

      {/* Main Focus Content Surface */}
      <div style={{ flex: 1, width: '100%', overflowY: 'auto', display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
        {children}
      </div>
    </div>
  );
};
