import React, { useState, useRef } from 'react';
import { AppIcon } from '../icons/AppIcon';
import {
  createDefaultCustomLayout,
  deleteCustomKeyboardLayout,
  duplicateCustomKeyboardLayout,
  exportLayoutToJson,
  importLayoutFromJson,
  saveCustomKeyboardLayout,
  validateCustomKeyMapping,
  type CustomKeyboardLayout,
} from '../../domain/unicode/customKeyboardEngine';
import type { UiLanguage } from '../i18n/menuTranslation';

export interface KeyboardLayoutEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: UiLanguage;
}

export function KeyboardLayoutEditorModal({
  isOpen,
  onClose,
  lang,
}: KeyboardLayoutEditorModalProps) {
  const [layout, setLayout] = useState<CustomKeyboardLayout>(() =>
    createDefaultCustomLayout('میرا کی بورڈ (My Keyboard)'),
  );
  const [activeKey, setActiveKey] = useState<string>('a');
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isUr = lang === 'ur';

  const handleKeyMappingChange = (normalChar: string, shiftChar: string) => {
    if (!validateCustomKeyMapping(normalChar) || !validateCustomKeyMapping(shiftChar)) {
      setValidationError(isUr ? 'غیر درست حرف درج کیا گیا ہے' : 'Invalid character mapping');
      return;
    }
    setValidationError(null);
    setLayout((prev) => ({
      ...prev,
      mappings: {
        ...prev.mappings,
        [activeKey]: {
          normal: normalChar,
          shift: shiftChar,
        },
      },
    }));
  };

  const handleSave = () => {
    saveCustomKeyboardLayout(layout);
    onClose();
  };

  const handleDuplicate = () => {
    const dup = duplicateCustomKeyboardLayout(layout.id);
    if (dup) {
      setLayout(dup);
    }
  };

  const handleDelete = () => {
    deleteCustomKeyboardLayout(layout.id);
    setLayout(createDefaultCustomLayout('میرا کی بورڈ (My Keyboard)'));
  };

  const handleExport = () => {
    const json = exportLayoutToJson(layout);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layout.name.toLowerCase().replace(/\s+/g, '_')}_layout.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const imported = importLayoutFromJson(content);
      if (imported) {
        setLayout(imported);
      } else {
        setValidationError(isUr ? 'JSON لے آؤٹ امپورٹ ناکام ہو گئی' : 'Failed to import JSON layout');
      }
    };
    reader.readAsText(file);
  };

  const currentMapping = layout.mappings[activeKey] || { normal: '', shift: '' };

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
          width: '480px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
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
            marginBottom: '14px',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', color: '#38bdf8', fontWeight: 700 }}>
            {isUr ? 'کسٹم کی بورڈ لے آؤٹ ایڈیٹر' : 'Custom Keyboard Layout Editor'}
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

        {/* Management Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '12px',
            flexWrap: 'wrap',
            backgroundColor: '#020617',
            padding: '6px',
            borderRadius: '6px',
          }}
        >
          <button
            type="button"
            onClick={handleDuplicate}
            style={{
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="copy" /> {isUr ? 'ڈپلیکیٹ' : 'Duplicate'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            style={{
              backgroundColor: '#1e293b',
              color: '#f87171',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="delete" /> {isUr ? 'حذف کریں' : 'Delete'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            style={{
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="download" /> {isUr ? 'ایکسپورٹ JSON' : 'Export JSON'}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="upload" /> {isUr ? 'امپورٹ JSON' : 'Import JSON'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
        </div>

        {validationError && (
          <div style={{ color: '#f87171', fontSize: '11px', marginBottom: '8px' }}>
            <AppIcon name="warning" /> {validationError}
          </div>
        )}

        {/* Layout Name Input */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px', fontSize: '11px' }}>
            {isUr ? 'لے آؤٹ کا نام:' : 'Layout Name:'}
          </label>
          <input
            type="text"
            value={layout.name}
            onChange={(e) => setLayout({ ...layout, name: e.target.value })}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '6px 10px',
              color: '#f8fafc',
              fontSize: '11px',
              outline: 'none',
            }}
          />
        </div>

        {/* Key Picker Grid */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px', fontSize: '11px' }}>
            {isUr ? 'بٹن منتخب کریں:' : 'Select Key to Remap:'}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {'abcdefghijklmnopqrstuvwxyz'.split('').map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setActiveKey(k)}
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: activeKey === k ? '#0284c7' : '#1e293b',
                  color: activeKey === k ? '#ffffff' : '#cbd5e1',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Key Character Mapping Inputs */}
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span style={{ fontWeight: 700, color: '#38bdf8' }}>
            {isUr ? `بٹن '${activeKey.toUpperCase()}' کی میپنگ:` : `Mapping for Key '${activeKey.toUpperCase()}':`}
          </span>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ flex: 1 }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>
                {isUr ? 'عادی حرف (Normal):' : 'Normal Character:'}
              </span>
              <input
                type="text"
                value={currentMapping.normal}
                onChange={(e) => handleKeyMappingChange(e.target.value, currentMapping.shift)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  fontFamily: "'Noto Nastaliq Urdu', serif",
                }}
              />
            </label>

            <label style={{ flex: 1 }}>
              <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>
                {isUr ? 'شفٹ حرف (Shift):' : 'Shift Character:'}
              </span>
              <input
                type="text"
                value={currentMapping.shift}
                onChange={(e) => handleKeyMappingChange(currentMapping.normal, e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  fontFamily: "'Noto Nastaliq Urdu', serif",
                }}
              />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isUr ? 'لے آؤٹ محفوظ کریں' : 'Save Layout'}
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
            {isUr ? 'منسوخ کریں' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
