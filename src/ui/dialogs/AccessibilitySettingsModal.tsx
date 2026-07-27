import React, { useState } from 'react';
import { AppIcon } from '../icons/AppIcon';
import {
  loadAccessibilitySettings,
  saveAccessibilitySettings,
  type AccessibilitySettings,
} from '../../domain/diagnostics/accessibilitySettings';
import type { UiLanguage } from '../i18n/menuTranslation';

export interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySettings: (settings: AccessibilitySettings) => void;
  lang: UiLanguage;
}

export function AccessibilitySettingsModal({
  isOpen,
  onClose,
  onApplySettings,
  lang,
}: AccessibilitySettingsModalProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() =>
    loadAccessibilitySettings(),
  );

  if (!isOpen) return null;

  const isUr = lang === 'ur';

  const handleSave = () => {
    saveAccessibilitySettings(settings);
    onApplySettings(settings);
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
            {isUr ? 'رسائی اور کسٹمائزیشن (Accessibility & UI)' : 'Accessibility & Display'}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {/* High Contrast Mode */}
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>{isUr ? 'ہائی کنٹراسٹ موڈ (High Contrast Theme):' : 'High Contrast Theme:'}</span>
            <input
              type="checkbox"
              checked={settings.isHighContrast}
              onChange={(e) => setSettings({ ...settings, isHighContrast: e.target.checked })}
            />
          </label>

          {/* Touch Mode */}
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>{isUr ? 'ٹچ موڈ (Touchscreen Mode - 44px Buttons):' : 'Touch Mode (Large Targets):'}</span>
            <input
              type="checkbox"
              checked={settings.isTouchMode}
              onChange={(e) => setSettings({ ...settings, isTouchMode: e.target.checked })}
            />
          </label>

          {/* Reduced Motion */}
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>{isUr ? 'کم شدہ حرکت (Reduced Motion):' : 'Reduced Motion:'}</span>
            <input
              type="checkbox"
              checked={settings.isReducedMotion}
              onChange={(e) => setSettings({ ...settings, isReducedMotion: e.target.checked })}
            />
          </label>

          {/* UI Scaling Selector */}
          <div>
            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px' }}>
              {isUr ? 'انٹرفیس کا سائز (UI Scale):' : 'UI Display Scale:'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[100, 125, 150, 200].map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setSettings({ ...settings, uiScale: scale })}
                  style={{
                    flex: 1,
                    backgroundColor: settings.uiScale === scale ? '#0284c7' : '#1e293b',
                    color: settings.uiScale === scale ? '#ffffff' : '#cbd5e1',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {scale}%
                </button>
              ))}
            </div>
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
            {isUr ? 'ترتیبات محفوظ کریں' : 'Save Settings'}
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
