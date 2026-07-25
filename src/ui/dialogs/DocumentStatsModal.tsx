import React from 'react';
import type { RePageDocument } from '../../domain/document/types';
import type { UiLanguage } from '../i18n/menuTranslation';

export interface DocumentStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  lang: UiLanguage;
}

export function DocumentStatsModal({
  isOpen,
  onClose,
  document,
  lang,
}: DocumentStatsModalProps) {
  if (!isOpen) return null;

  // Calculate statistics across stories in document
  let wordCount = 0;
  let characterCountNoSpaces = 0;
  let characterCountWithSpaces = 0;
  let paragraphCount = 0;

  for (const story of Object.values(document.stories)) {
    if (!story?.content?.content) continue;
    for (const paragraph of story.content.content) {
      paragraphCount++;
      const text = paragraph.content
        .map((run) => (run.type === 'text' ? run.text : ''))
        .join(' ');

      const words = text.trim().split(/\s+/).filter(Boolean);
      wordCount += words.length;
      characterCountWithSpaces += text.length;
      characterCountNoSpaces += text.replace(/\s+/g, '').length;
    }
  }

  const pageCount = document.pageOrder.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  const isUr = lang === 'ur';

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
    >
      <div
        style={{
          width: '380px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '20px',
          color: '#f8fafc',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '12px',
        }}
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
            {isUr ? 'دستاویز کے شماریات (Document Statistics)' : 'Document Statistics'}
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
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px border #1e293b', paddingBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>{isUr ? 'صفحات (Pages):' : 'Pages:'}</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{pageCount}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px border #1e293b', paddingBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>{isUr ? 'الفاظ (Words):' : 'Words:'}</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>{wordCount}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px border #1e293b', paddingBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>{isUr ? 'حروف (بدون خلا):' : 'Characters (no spaces):'}</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{characterCountNoSpaces}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px border #1e293b', paddingBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>{isUr ? 'حروف (بمع خلا):' : 'Characters (with spaces):'}</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{characterCountWithSpaces}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px border #1e293b', paddingBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>{isUr ? 'پیراگراف (Paragraphs):' : 'Paragraphs:'}</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{paragraphCount}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px border #1e293b', paddingBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>{isUr ? 'تخمینی وقت مطالعہ:' : 'Estimated reading time:'}</span>
            <span style={{ fontWeight: 700, color: '#fbbf24' }}>
              {isUr ? `تقریباً ${readingTimeMinutes} منٹ` : `~${readingTimeMinutes} min`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isUr ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
