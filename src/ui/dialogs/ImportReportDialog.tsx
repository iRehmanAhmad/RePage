import React from 'react';
import type { ImportReport } from '../../persistence/import/docxImporter';
import type { UiLanguage } from '../i18n/menuTranslation';
import { AppIcon } from '../icons/AppIcon';

export interface ImportReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: ImportReport | null;
  lang: UiLanguage;
}

/**
 * Honest import report shown after a .docx import: what came in
 * (countable), what was simplified or dropped, and any warnings.
 */
export function ImportReportDialog({ isOpen, onClose, report, lang }: ImportReportDialogProps) {
  if (!isOpen || !report) return null;
  const isUr = lang === 'ur';

  const rows: Array<[string, string, number]> = [
    [isUr ? 'پیراگراف (Paragraphs)' : 'Paragraphs', '#f8fafc', report.paragraphCount],
    [isUr ? 'الفاظ (Words)' : 'Words', '#10b981', report.wordCount],
    [isUr ? 'سرخیاں (Headings)' : 'Headings', '#f8fafc', report.headingCount],
    [isUr ? 'فہرست آئٹم (List items)' : 'List items', '#f8fafc', report.listItemCount],
    [isUr ? 'جدول (Tables)' : 'Tables', '#f8fafc', report.tableCount],
    [isUr ? 'تصاویر (Images)' : 'Images', '#f8fafc', report.imageCount],
    [isUr ? 'حواشی (Footnotes)' : 'Footnotes', '#f8fafc', report.footnoteCount],
    [isUr ? 'صفحات (Pages)' : 'Pages', '#38bdf8', report.pageCount],
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '420px',
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '20px',
          color: '#f8fafc',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '12px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', color: '#38bdf8', fontWeight: 700 }}>
            {isUr ? 'درآمد کی رپورٹ (Import Report)' : 'Import Report'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="dismiss" />
          </button>
        </div>

        <div
          style={{
            marginBottom: '12px',
            color: '#94a3b8',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={report.filename}
        >
          {report.filename}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {rows.map(([label, color, value]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid #1e293b',
                paddingBottom: '4px',
              }}
            >
              <span style={{ color: '#94a3b8' }}>{label}:</span>
              <span style={{ fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
        </div>

        {report.dropped.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
              {isUr ? 'آسان یا چھوڑی گئی چیزیں (Simplified / skipped):' : 'Simplified / skipped:'}
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#cbd5e1' }}>
              {report.dropped.map((d, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.warnings.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
              {isUr ? 'تنبیہات (Warnings):' : 'Warnings:'}
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#cbd5e1' }}>
              {report.warnings.map((w, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              backgroundColor: '#0f766e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isUr ? 'ٹھیک ہے (OK)' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportReportDialog;
