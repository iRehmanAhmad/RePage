import React from 'react';

export interface StudioHeaderProps {
  documentTitle: string;
  onTitleChange: (newTitle: string) => void;
  onNewDocument?: () => void;
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
          dir="rtl"
        />
        <span className="save-badge">{saveState}</span>
      </div>

      {/* Header Quick Actions */}
      <div className="header-actions">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-studio"
          title="فائل کھولیں (Open File)"
        >
          <span>📂</span>
          <span>کھولیں</span>
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

        <button onClick={onSaveDocument} className="btn-studio" title="محفوظ کریں (Save)">
          <span>💾</span>
          <span>محفوظ</span>
        </button>

        <button onClick={onSaveAsDocument} className="btn-studio gold" title="نام سے محفوظ کریں (Save As)">
          <span>💾</span>
          <span>محفوظ کریں</span>
        </button>

        <button onClick={onShowRecentFiles} className="btn-studio" title="حالیہ فائلیں (Recent Files)">
          <span>📜</span>
        </button>

        <button onClick={onRunPreflight} className="btn-studio" title="پری فلائٹ رپورٹس">
          <span>🔍</span>
        </button>

        <button onClick={onOpenLanguageTools} className="btn-studio" title="اردو آلات (Language Tools)">
          <span>🌐</span>
        </button>

        <button onClick={onOpenOcr} className="btn-studio" title="تصویر متن شناسی (Urdu OCR)">
          <span>📷</span>
        </button>

        <button onClick={onToggleCollab} className="btn-studio" title="لائیو باہمی تعاون (Live Collaboration)">
          <span>👥</span>
        </button>

        <div className="ribbon-divider" />

        <button onClick={onExportPdf} className="btn-studio primary" title="برآمد پی ڈی ایف (Export PDF)">
          <span>📄</span>
          <span>PDF</span>
        </button>

        <button onClick={onExportEpub} className="btn-studio primary" title="برآمد ای پب (Export ePUB)">
          <span>📚</span>
          <span>ePUB</span>
        </button>
      </div>
    </header>
  );
};
