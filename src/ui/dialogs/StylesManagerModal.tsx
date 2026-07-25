import React, { useState } from 'react';
import type { RePageDocument } from '../../domain/document/types';
import type { UiLanguage } from '../i18n/menuTranslation';

export interface StylesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  onApplyStyle?: (styleName: string) => void;
  lang: UiLanguage;
}

export function StylesManagerModal({
  isOpen,
  onClose,
  document: _document,
  onApplyStyle,
  lang,
}: StylesManagerModalProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('Normal');

  if (!isOpen) return null;

  const defaultStyles = [
    { name: 'Normal', font: 'Noto Nastaliq Urdu', size: 12, lineSpacing: 1.5, isUrdu: true },
    { name: 'Heading 1 (باب / عنوان)', font: 'Jameel Noori Nastaleeq', size: 22, lineSpacing: 1.2, isUrdu: true },
    { name: 'Heading 2 (ذیلی عنوان)', font: 'Jameel Noori Nastaleeq', size: 16, lineSpacing: 1.3, isUrdu: true },
    { name: 'Heading 3 (سرخی 3)', font: 'Noto Nastaliq Urdu', size: 14, lineSpacing: 1.4, isUrdu: true },
    { name: 'Poetry (شاعری / غزل)', font: 'Jameel Noori Nastaleeq', size: 14, lineSpacing: 2.0, isUrdu: true },
    { name: 'Quote (اقتباس)', font: 'Noto Nastaliq Urdu', size: 11, lineSpacing: 1.4, isUrdu: true },
  ];

  const filteredStyles = defaultStyles.filter((s) =>
    s.name.toLowerCase().includes(filterQuery.toLowerCase()),
  );

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
          width: '460px',
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
            marginBottom: '14px',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', color: '#38bdf8', fontWeight: 700 }}>
            {isUr ? 'اسٹائلز منیجر (Styles Manager)' : 'Styles Manager'}
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

        {/* Filter Input */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder={isUr ? 'اسٹائل تلاش کریں...' : 'Search styles...'}
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

        {/* Style List */}
        <div
          style={{
            height: '200px',
            overflowY: 'auto',
            backgroundColor: '#090d16',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '6px',
            marginBottom: '16px',
          }}
        >
          {filteredStyles.map((style) => {
            const isSelected = selectedStyle === style.name;
            return (
              <div
                key={style.name}
                onClick={() => setSelectedStyle(style.name)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? '#0369a1' : 'transparent',
                  color: isSelected ? '#ffffff' : '#e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontWeight: 600, fontFamily: style.font }}>{style.name}</span>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>
                  {style.font} ({style.size}pt)
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              if (onApplyStyle) onApplyStyle(selectedStyle);
              onClose();
            }}
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
            {isUr ? 'منتخب اسٹائل لاگو کریں' : 'Apply Selected Style'}
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
