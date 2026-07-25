import React from 'react';
import type { ThemeMode } from '../theme/themeEngine';
import type { UiLanguage, Translations } from '../i18n/menuTranslation';

export interface StudioHeaderProps {
  t: Translations;
  lang: UiLanguage;
  onLanguageChange: (lang: UiLanguage) => void;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  documentTitle: string;
  onTitleChange: (newTitle: string) => void;
  onOpenDocument: (file: File) => void;
  onSaveDocument: () => void;
  onSaveAsDocument: () => void;
  onShowRecentFiles: () => void;
  onRunPreflight: () => void;
  onToggleCollab: () => void;
  onOpenLanguageTools: () => void;
  onOpenOcr: () => void;
  onExportPdf: () => void;
  onExportEpub: () => void;
  saveState: string;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  t,
  lang,
  onLanguageChange,
  themeMode,
  onThemeModeChange,
  documentTitle,
  onTitleChange,
  onOpenDocument,
  onSaveDocument,
  onSaveAsDocument,
  onShowRecentFiles,
  onRunPreflight,
  onToggleCollab,
  onOpenLanguageTools,
  onOpenOcr,
  onExportPdf,
  onExportEpub,
  saveState,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <header className="studio-header">
      {/* Brand & Logo */}
      <div className="brand-block">
        <div className="brand-mark">آ</div>
        <div className="brand-info">
          <span className="brand-title">RePage Studio</span>
          <span className="brand-version">Urdu Publishing 1.0</span>
        </div>
      </div>

      {/* Center Editable Document Title & Save State */}
      <div className="title-field">
        <input
          type="text"
          value={documentTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="میری پہلی اردو دستاویز..."
          dir={lang === 'ur' ? 'rtl' : 'ltr'}
        />
        <span className="save-badge">{saveState}</span>
      </div>

      {/* Header Quick Actions */}
      <div className="header-actions">
        {/* Language Selector */}
        <select
          value={lang}
          onChange={(e) => onLanguageChange(e.target.value as UiLanguage)}
          className="header-select"
          title="Software Menu Language"
        >
          <option value="ur">اردو</option>
          <option value="en">English</option>
        </select>

        {/* Theme Selector */}
        <select
          value={themeMode}
          onChange={(e) => onThemeModeChange(e.target.value as ThemeMode)}
          className="header-select"
          title="Color Theme Mode"
        >
          <option value="dark">🌙 {t.themeDark}</option>
          <option value="light">☀️ {t.themeLight}</option>
          <option value="system">💻 {t.themeSystem}</option>
        </select>

        <div className="ribbon-divider" />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-studio"
          title={t.open}
        >
          <span>📂</span>
          <span>{t.open}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".urdup,.inp,.txt,.docx,.html,.rtf,.svg,.pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onOpenDocument(file);
            }}
          />
        </button>

        <button onClick={onSaveDocument} className="btn-studio" title={t.save}>
          <span>💾</span>
          <span>{t.save}</span>
        </button>

        <button onClick={onSaveAsDocument} className="btn-studio gold" title={t.saveAs}>
          <span>💾</span>
          <span>{t.saveAs}</span>
        </button>

        <button onClick={onShowRecentFiles} className="btn-studio" title={t.recent}>
          <span>📜</span>
        </button>

        <button onClick={onRunPreflight} className="btn-studio" title={t.preflight}>
          <span>🔍</span>
        </button>

        <button onClick={onOpenLanguageTools} className="btn-studio" title={t.tabUrduTools}>
          <span>🌐</span>
        </button>

        <button onClick={onOpenOcr} className="btn-studio" title={t.ocr}>
          <span>📷</span>
        </button>

        <button onClick={onToggleCollab} className="btn-studio" title={t.collabRoom}>
          <span>👥</span>
        </button>

        <div className="ribbon-divider" />

        <button onClick={onExportPdf} className="btn-studio primary" title={t.exportPdf}>
          <span>📄</span>
          <span>PDF</span>
        </button>

        <button onClick={onExportEpub} className="btn-studio primary" title={t.exportEpub}>
          <span>📚</span>
          <span>ePUB</span>
        </button>
      </div>
    </header>
  );
};
