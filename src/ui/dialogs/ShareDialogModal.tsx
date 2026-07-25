import React, { useState } from 'react';
import type { UiLanguage } from '../i18n/menuTranslation';

export interface ShareDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  lang: UiLanguage;
}

export function ShareDialogModal({
  isOpen,
  onClose,
  documentTitle,
  lang,
}: ShareDialogModalProps) {
  const [role, setRole] = useState<'editor' | 'reviewer' | 'viewer'>('editor');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isUr = lang === 'ur';
  const shareUrl = `https://repage.app/collab/#room=repage_${encodeURIComponent(documentTitle.toLowerCase())}&role=${role}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          width: '440px',
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
            {isUr ? 'دستاویز شیئر کریں (Share & Permissions)' : 'Share Document'}
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

        {/* Permission Role Switcher */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '11px' }}>
            {isUr ? 'معاونین کے لیے اجازت نامہ (Permissions):' : 'Collaborator Access Level:'}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'editor', label: isUr ? 'ایڈیٹر (Editor)' : 'Editor' },
              { id: 'reviewer', label: isUr ? 'ریویور (Reviewer)' : 'Reviewer' },
              { id: 'viewer', label: isUr ? 'صرف دیکھنے والا (Viewer)' : 'Viewer' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as typeof role)}
                style={{
                  flex: 1,
                  backgroundColor: role === r.id ? '#0284c7' : '#1e293b',
                  color: role === r.id ? '#ffffff' : '#cbd5e1',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '6px',
                  fontWeight: 600,
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generated Share Link Box */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px', fontSize: '11px' }}>
            {isUr ? 'لائیو سیشن لنک:' : 'Live Session Link:'}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={shareUrl}
              style={{
                flex: 1,
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '6px 10px',
                color: '#38bdf8',
                fontSize: '11px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                backgroundColor: copied ? '#10b981' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {copied ? (isUr ? 'کاپی ہوگیا!' : 'Copied!') : isUr ? 'کاپی کریں' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
