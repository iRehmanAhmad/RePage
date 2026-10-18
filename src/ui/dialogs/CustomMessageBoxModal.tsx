import React from 'react';
import { AppIcon } from '../icons/AppIcon';

export interface CustomMessageBoxModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'confirm' | 'alert' | undefined;
  confirmText?: string | undefined;
  cancelText?: string | undefined;
  onConfirm: () => void;
  onCancel?: (() => void) | undefined;
}

export function CustomMessageBoxModal({
  isOpen,
  title,
  message,
  type = 'alert',
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: CustomMessageBoxModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          width: '400px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '18px 20px',
          color: '#f8fafc',
          boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
          fontSize: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AppIcon name="search" size={16} />
            <h4 style={{ margin: 0, fontSize: '14px', color: '#38bdf8', fontWeight: 700 }}>
              {title}
            </h4>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <AppIcon name="dismiss" size={14} />
            </button>
          )}
        </div>

        <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#e2e8f0', marginBottom: '18px' }}>
          {message}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {type === 'confirm' && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                backgroundColor: '#334155',
                color: '#cbd5e1',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cancelText || 'No'}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 18px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {confirmText || (type === 'confirm' ? 'Yes' : 'OK')}
          </button>
        </div>
      </div>
    </div>
  );
}
