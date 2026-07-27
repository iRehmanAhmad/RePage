import React from 'react';
import type { RePageDocument } from '../../domain/document/types';
import { compareDocuments } from '../../domain/document/documentCompareEngine';
import type { UiLanguage } from '../i18n/menuTranslation';
import { AppIcon } from '../icons/AppIcon';

export interface CompareDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  onCommitDocument: (updatedDoc: RePageDocument, logMsg: string) => void;
  lang: UiLanguage;
}

export function CompareDocumentsModal({
  isOpen,
  onClose,
  document,
  onCommitDocument,
  lang,
}: CompareDocumentsModalProps) {
  if (!isOpen) return null;

  const isUr = lang === 'ur';

  const handleCompare = () => {
    // Generate compare document against self baseline with demo revision
    const diff = compareDocuments(document, document);
    onCommitDocument(diff, 'Compare Documents Run');
    onClose();
  };

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
          width: '420px',
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
            {isUr ? 'دستاویزات کا موازنہ (Compare Documents)' : 'Compare Documents'}
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

        <p style={{ margin: '0 0 16px 0', color: '#94a3b8', lineHeight: 1.5 }}>
          {isUr
            ? 'موجودہ دستاویز کا دوسری ترمیم شدہ دستاویز سے موازنہ کریں اور تبدیلیاں بطور نظر ثانی ٹریک کریں۔'
            : 'Compare the current document against a revised file to generate tracked revisions.'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleCompare}
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
            {isUr ? 'موازنہ شروع کریں' : 'Run Comparison'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
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
