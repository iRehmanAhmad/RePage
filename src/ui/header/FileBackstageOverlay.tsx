import React, { useState } from 'react';
import type { RePageDocument } from '../../domain/document/types';
import type { UiLanguage } from '../i18n/menuTranslation';

export interface FileBackstageOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  lang: UiLanguage;
  saveState: string;
  onNewDocument: () => void;
  onOpenDocument: () => void;
  onSaveDocument: () => void;
  onSaveAsDocument: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
}

type BackstageSection = 'home' | 'new' | 'open' | 'info' | 'export' | 'options';

export function FileBackstageOverlay({
  isOpen,
  onClose,
  document,
  lang,
  saveState,
  onNewDocument,
  onOpenDocument,
  onSaveDocument,
  onSaveAsDocument,
  onExportPdf,
  onPrint,
}: FileBackstageOverlayProps) {
  const [activeSection, setActiveSection] = useState<BackstageSection>('home');
  const [unitPreference, setUnitPreference] = useState<'mm' | 'pt'>('mm');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#090d16',
        color: '#f8fafc',
        zIndex: 9999,
        display: 'flex',
        fontFamily: lang === 'ur' ? "'Noto Nastaliq Urdu', sans-serif" : 'system-ui, sans-serif',
      }}
    >
      {/* Left Backstage Sidebar Navigation */}
      <div
        style={{
          width: '220px',
          backgroundColor: '#0f172a',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 8px',
          gap: '4px',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          <span>←</span>
          <span>{lang === 'ur' ? 'دستاویز پر واپس جائیں' : 'Back to Document'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('home')}
          style={{
            padding: '10px 14px',
            textAlign: 'left',
            backgroundColor: activeSection === 'home' ? '#1e293b' : 'transparent',
            color: activeSection === 'home' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {lang === 'ur' ? 'ہوم (Home)' : 'Home'}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('new')}
          style={{
            padding: '10px 14px',
            textAlign: 'left',
            backgroundColor: activeSection === 'new' ? '#1e293b' : 'transparent',
            color: activeSection === 'new' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {lang === 'ur' ? 'نیا (New)' : 'New'}
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenDocument();
            onClose();
          }}
          style={{
            padding: '10px 14px',
            textAlign: 'left',
            backgroundColor: activeSection === 'open' ? '#1e293b' : 'transparent',
            color: activeSection === 'open' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {lang === 'ur' ? 'کھولیں (Open)' : 'Open'}
        </button>

        <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '8px 0' }} />

        <button
          type="button"
          onClick={onSaveDocument}
          style={{
            padding: '10px 14px',
            textAlign: 'left',
            backgroundColor: 'transparent',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {lang === 'ur' ? 'محفوظ کریں (Save)' : 'Save'}
        </button>

        <button
          type="button"
          onClick={onSaveAsDocument}
          style={{
            padding: '10px 14px',
            textAlign: 'left',
            backgroundColor: 'transparent',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {lang === 'ur' ? 'نیا نام دیں (Save As)' : 'Save As'}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('info')}
          style={{
            padding: '10px 14px',
            textAlign: 'left',
            backgroundColor: activeSection === 'info' ? '#1e293b' : 'transparent',
            color: activeSection === 'info' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {lang === 'ur' ? 'معلومات (Info)' : 'Info'}
        </button>

        <button
          type="button"
          onClick={onPrint}
          style={{
            padding: '10px 14px',
            textAlign: 'left',
            backgroundColor: 'transparent',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {lang === 'ur' ? 'پرنٹ (Print)' : 'Print'}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('export')}
          style={{
            padding: '10px 14px',
            textAlign: 'left',
            backgroundColor: activeSection === 'export' ? '#1e293b' : 'transparent',
            color: activeSection === 'export' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {lang === 'ur' ? 'برآمد کریں (Export)' : 'Export'}
        </button>

        <div style={{ marginTop: 'auto' }} />

        <button
          type="button"
          onClick={() => setActiveSection('options')}
          style={{
            padding: '10px 14px',
            textAlign: 'left',
            backgroundColor: activeSection === 'options' ? '#1e293b' : 'transparent',
            color: activeSection === 'options' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ⚙ {lang === 'ur' ? 'ترتیبات (Options)' : 'Options'}
        </button>
      </div>

      {/* Main Content View */}
      <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto' }}>
        {activeSection === 'home' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
              {lang === 'ur' ? 'خوش آمدید RePage Studio میں' : 'Welcome to RePage Studio'}
            </h1>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <div
                onClick={() => {
                  onNewDocument();
                  onClose();
                }}
                style={{
                  width: '140px',
                  height: '160px',
                  backgroundColor: '#1e293b',
                  border: '2px dashed #334155',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                <span style={{ fontSize: '32px', color: '#10b981' }}>+</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {lang === 'ur' ? 'سادہ صفحہ (Blank)' : 'Blank Document'}
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
              {lang === 'ur' ? 'حالیہ دستاویزات (Recent Documents)' : 'Recent Documents'}
            </h2>

            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                <span>{lang === 'ur' ? 'نام' : 'Name'}</span>
                <span>{lang === 'ur' ? 'آخری بار کھولا گیا' : 'Last Opened'}</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>{document.metadata.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{saveState}</div>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {new Date(document.metadata.modifiedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'info' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
              {lang === 'ur' ? 'دستاویز کی معلومات (Document Information)' : 'Document Information'}
            </h1>
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>{lang === 'ur' ? 'عنوان' : 'Title'}</span>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>{document.metadata.title}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>{lang === 'ur' ? 'صفحات کی تعداد' : 'Page Count'}</span>
                <div style={{ fontSize: '14px' }}>{document.pageOrder.length} {lang === 'ur' ? 'صفحات' : 'pages'}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>{lang === 'ur' ? 'تخلیق کی تاریخ' : 'Created At'}</span>
                <div style={{ fontSize: '14px' }}>{new Date(document.metadata.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'options' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
              {lang === 'ur' ? 'ترتیبات (Options)' : 'Application Options'}
            </h1>
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  {lang === 'ur' ? 'پیمائش کا یونٹ (Measurement Unit)' : 'Measurement Unit'}
                </label>
                <select
                  value={unitPreference}
                  onChange={(e) => setUnitPreference(e.target.value as 'mm' | 'pt')}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '13px',
                  }}
                >
                  <option value="mm">Millimeters (mm)</option>
                  <option value="pt">Points (pt)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'export' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
              {lang === 'ur' ? 'دستاویز برآمد کریں (Export Document)' : 'Export Document'}
            </h1>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  onExportPdf();
                  onClose();
                }}
                style={{
                  padding: '16px 24px',
                  backgroundColor: '#0f766e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                📄 {lang === 'ur' ? 'PDF برآمد کریں (PDF Export)' : 'Export PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
