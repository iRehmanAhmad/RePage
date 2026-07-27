import React from 'react';
import type { RePageDocument } from '../../domain/document/types';
import { loadVersionHistory, saveVersionSnapshot } from '../../domain/document/versionHistoryEngine';
import type { UiLanguage } from '../i18n/menuTranslation';
import { AppIcon } from '../icons/AppIcon';

export interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  onRestoreSnapshot: (snapshot: RePageDocument, logMsg: string) => void;
  lang: UiLanguage;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  document,
  onRestoreSnapshot,
  lang,
}: VersionHistoryModalProps) {
  if (!isOpen) return null;

  const isUr = lang === 'ur';
  const versions = loadVersionHistory();

  const handleSaveCurrentVersion = () => {
    saveVersionSnapshot(document, `نسخہ (Version ${versions.length + 1})`);
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
            {isUr ? 'دستاویز کی ورژن ہسٹری (Version History)' : 'Version History'}
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

        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleSaveCurrentVersion}
            style={{
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + {isUr ? 'موجودہ نسخہ محفوظ کریں' : 'Save Current Version'}
          </button>
        </div>

        {/* Version List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {versions.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>
              {isUr ? 'کوئی پرانا نسخہ موجود نہیں' : 'No version history saved'}
            </div>
          ) : (
            versions.map((ver) => (
              <div
                key={ver.id}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#38bdf8' }}>{ver.label}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {new Date(ver.timestamp).toLocaleString()} • {ver.author}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onRestoreSnapshot(ver.snapshot, `Restore Version ${ver.label}`);
                    onClose();
                  }}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {isUr ? 'بہال کریں' : 'Restore'}
                </button>
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
