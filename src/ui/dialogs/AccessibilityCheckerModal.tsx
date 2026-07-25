import React from 'react';
import type { RePageDocument } from '../../domain/document/types';
import { runAccessibilityAudit } from '../../domain/diagnostics/accessibilityChecker';
import type { UiLanguage } from '../i18n/menuTranslation';

export interface AccessibilityCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  lang: UiLanguage;
}

export function AccessibilityCheckerModal({
  isOpen,
  onClose,
  document,
  lang,
}: AccessibilityCheckerModalProps) {
  if (!isOpen) return null;

  const isUr = lang === 'ur';
  const issues = runAccessibilityAudit(document);

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
          width: '460px',
          maxHeight: '80vh',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '20px',
          color: '#f8fafc',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', color: '#38bdf8', fontWeight: 700 }}>
            {isUr ? 'دستاویز کی رسائی چیکر (Accessibility Checker)' : 'Accessibility Checker'}
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

        {/* Issues List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {issues.length === 0 ? (
            <div style={{ color: '#10b981', textAlign: 'center', padding: '20px 0', fontWeight: 700 }}>
              ✓ {isUr ? 'رسائی کے حوالے سے کوئی مسئلہ نہیں ملا!' : 'No accessibility issues found!'}
            </div>
          ) : (
            issues.map((iss) => (
              <div
                key={iss.id}
                style={{
                  backgroundColor: '#1e293b',
                  borderLeft: `4px solid ${iss.severity === 'error' ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: '4px',
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontWeight: 700, color: iss.severity === 'error' ? '#fca5a5' : '#fcd34d' }}>
                  {iss.severity.toUpperCase()}: {isUr ? iss.messageUrdu : iss.message}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
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
