import React, { useState, useRef } from 'react';
import type { ThemeMode } from '../theme/themeEngine';
import type { UiLanguage, Translations } from '../i18n/menuTranslation';
import { QatItemKey, QAT_CATALOG } from '../header/qatEngine';
import { AppIcon } from '../icons/AppIcon';

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
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveState: string;
  qatItems: QatItemKey[];
  onToggleQatItem: (key: QatItemKey) => void;
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
  onRunPreflight,
  onToggleCollab,
  onOpenLanguageTools,
  onOpenOcr,
  onExportPdf,
  onExportEpub,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  saveState,
  qatItems,
  onToggleQatItem,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showQatDropdown, setShowQatDropdown] = useState(false);

  // Trigger handlers for QAT keys
  const triggerQatAction = (key: QatItemKey) => {
    switch (key) {
      case 'save': onSaveDocument(); break;
      case 'undo': if (canUndo) onUndo(); break;
      case 'redo': if (canRedo) onRedo(); break;
      case 'open': fileInputRef.current?.click(); break;
      case 'saveAs': onSaveAsDocument(); break;
      case 'preflight': onRunPreflight(); break;
      case 'pdf': onExportPdf(); break;
      case 'epub': onExportEpub(); break;
      case 'ocr': onOpenOcr(); break;
      case 'langTools': onOpenLanguageTools(); break;
      case 'collab': onToggleCollab(); break;
    }
  };

  return (
    <header className="studio-header">
      {/* Hidden File Input */}
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

      {/* TOP LEFT: Brand Mark + Quick Access Toolbar (QAT) */}
      <div className="header-left">
        <div className="brand-block">
          <div className="brand-mark">آ</div>
          <div className="brand-info">
            <span className="brand-title">RePage Studio</span>
            <span className="brand-version">Urdu Publishing 1.0</span>
          </div>
        </div>

        {/* Quick Access Toolbar (QAT) */}
        <div className="qat-bar">
          {qatItems.map((key) => {
            const def = QAT_CATALOG.find((item) => item.key === key);
            if (!def) return null;
            const label = lang === 'ur' ? def.labelUr : def.labelEn;
            const isDisabled = (key === 'undo' && !canUndo) || (key === 'redo' && !canRedo);

            return (
              <button
                key={key}
                onClick={() => triggerQatAction(key)}
                disabled={isDisabled}
                className={`qat-btn ${isDisabled ? 'disabled' : ''}`}
                title={`Quick Access: ${label}`}
              >
                <AppIcon name={def.icon} size={16} />
              </button>
            );
          })}

          {/* Customize QAT Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowQatDropdown(!showQatDropdown)}
              className="qat-btn customize-btn"
              title="Customize Quick Access Toolbar"
            >
              <AppIcon name="chevron-down" size={14} />
            </button>

            {showQatDropdown && (
              <div className="qat-dropdown-menu">
                <div className="qat-dropdown-header">Customize Quick Access Toolbar</div>
                {QAT_CATALOG.map((item) => {
                  const isChecked = qatItems.includes(item.key);
                  const itemLabel = lang === 'ur' ? item.labelUr : item.labelEn;

                  return (
                    <label key={item.key} className="qat-dropdown-item">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleQatItem(item.key)}
                      />
                      <AppIcon name={item.icon} size={16} />
                      <span>{itemLabel}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOP CENTER: Centered Document Title Input & Save Badge */}
      <div className="header-center">
        <div className="title-field-centered">
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Document Name..."
            dir={lang === 'ur' ? 'rtl' : 'ltr'}
          />
          <span className="save-badge">{saveState}</span>
        </div>
      </div>

      {/* TOP RIGHT: Global Settings (Language & Theme Selectors) */}
      <div className="header-right">
        {/* Language Selector */}
        <select
          value={lang}
          onChange={(e) => onLanguageChange(e.target.value as UiLanguage)}
          className="header-select"
          title="Software Menu Language"
        >
          <option value="en">English</option>
          <option value="ur">اردو</option>
        </select>

        {/* Theme Selector */}
        <select
          value={themeMode}
          onChange={(e) => onThemeModeChange(e.target.value as ThemeMode)}
          className="header-select"
          title="Color Theme Mode"
        >
          <option value="light">{t.themeLight}</option>
          <option value="dark">{t.themeDark}</option>
          <option value="system">{t.themeSystem}</option>
        </select>
      </div>
    </header>
  );
};
