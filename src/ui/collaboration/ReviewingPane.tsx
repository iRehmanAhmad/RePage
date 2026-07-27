import React from 'react';
import type { RePageDocument } from '../../domain/document/types';
import {
  acceptAllRevisions,
  acceptRevision,
  rejectAllRevisions,
  rejectRevision,
} from '../../domain/document/trackChangesEngine';
import type { UiLanguage } from '../i18n/menuTranslation';
import { AppIcon } from '../icons/AppIcon';

export interface ReviewingPaneProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  onCommitDocument: (updatedDoc: RePageDocument, logMsg: string) => void;
  lang: UiLanguage;
}

export function ReviewingPane({
  isOpen,
  onClose,
  document,
  onCommitDocument,
  lang,
}: ReviewingPaneProps) {
  if (!isOpen) return null;

  const isUr = lang === 'ur';
  const revisions = document.revisions || [];

  return (
    <div
      style={{
        width: '320px',
        height: '100%',
        backgroundColor: '#0f172a',
        borderLeft: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        color: '#f8fafc',
        fontSize: '12px',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.4)',
        zIndex: 40,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', color: '#38bdf8', fontWeight: 700 }}>
          {isUr ? 'نظر ثانی پینل (Reviewing Pane)' : 'Reviewing Pane'}
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

      {/* Bulk Action Buttons */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => onCommitDocument(acceptAllRevisions(document), 'Accept All Revisions')}
          disabled={revisions.length === 0}
          style={{
            flex: 1,
            backgroundColor: revisions.length > 0 ? '#10b981' : '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: revisions.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {isUr ? 'سب قبول کریں (Accept All)' : 'Accept All'}
        </button>

        <button
          type="button"
          onClick={() => onCommitDocument(rejectAllRevisions(document), 'Reject All Revisions')}
          disabled={revisions.length === 0}
          style={{
            flex: 1,
            backgroundColor: revisions.length > 0 ? '#ef4444' : '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: revisions.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {isUr ? 'سب مسترد کریں (Reject All)' : 'Reject All'}
        </button>
      </div>

      {/* Revisions List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {revisions.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>
            {isUr ? 'کوئی زیرِ التواء تبدیلی موجود نہیں' : 'No pending revisions'}
          </div>
        ) : (
          revisions.map((rev) => (
            <div
              key={rev.id}
              style={{
                backgroundColor: '#1e293b',
                borderLeft: `4px solid ${rev.type === 'insert' ? '#10b981' : '#ef4444'}`,
                borderRadius: '4px',
                padding: '10px',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{rev.author}</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {rev.type === 'insert' ? (isUr ? 'اضافہ' : 'Inserted') : (isUr ? 'حذف' : 'Deleted')}
                </span>
              </div>

              <div
                style={{
                  fontFamily: "'Noto Nastaliq Urdu', serif",
                  fontSize: '13px',
                  color: '#e2e8f0',
                  margin: '6px 0',
                }}
              >
                {rev.text}
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => onCommitDocument(acceptRevision(document, rev.id), 'Accept Revision')}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <AppIcon name="check" /> {isUr ? 'قبول' : 'Accept'}
                </button>

                <button
                  type="button"
                  onClick={() => onCommitDocument(rejectRevision(document, rev.id), 'Reject Revision')}
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <AppIcon name="dismiss" /> {isUr ? 'مسترد' : 'Reject'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
