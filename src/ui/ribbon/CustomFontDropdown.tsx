import React, { useState, useRef, useEffect } from 'react';
import type { UiLanguage } from '../i18n/menuTranslation';

export interface FontGroup {
  label: string;
  fonts: string[];
}

export interface CustomFontDropdownProps {
  value: string;
  onChange: (font: string) => void;
  onPreview?: ((font: string | null) => void) | undefined;
  groups: FontGroup[];
  width?: string | undefined;
  title?: string | undefined;
  lang?: UiLanguage | undefined;
  isHighlighted?: boolean | undefined;
}

export function CustomFontDropdown({
  value,
  onChange,
  onPreview,
  groups,
  width = '140px',
  title = 'Font Family',
  lang = 'en',
  isHighlighted = false,
}: CustomFontDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
          onPreview?.(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onPreview]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (!nextState) onPreview?.(null);
        }}
        title={title}
        style={{
          width,
          minWidth: width,
          height: '28px',
          fontSize: '11px',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          border: isHighlighted ? '1px solid #10b981' : '1px solid #334155',
          borderRadius: '3px',
          padding: '0 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontFamily: value ? `"${value}", system-ui, sans-serif` : 'system-ui, sans-serif',
          boxShadow: isHighlighted ? '0 0 0 2px rgba(16, 185, 129, 0.25)' : 'none',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px' }}>
          {value}
        </span>
        <span style={{ fontSize: '9px', color: '#94a3b8', marginLeft: '2px' }}>▼</span>
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div
          onMouseLeave={() => onPreview?.(null)}
          style={{
            position: 'absolute',
            top: '100%',
            left: lang === 'ur' ? 'auto' : 0,
            right: lang === 'ur' ? 0 : 'auto',
            width: '220px',
            maxHeight: '320px',
            overflowY: 'auto',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '4px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
            zIndex: 99999,
            marginTop: '2px',
            padding: '4px 0',
          }}
        >
          {groups.map((group) => {
            if (!group.fonts || group.fonts.length === 0) return null;
            return (
              <div key={group.label} style={{ marginBottom: '4px' }}>
                <div
                  style={{
                    padding: '4px 10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid #334155',
                    marginBottom: '2px',
                  }}
                >
                  {group.label}
                </div>
                {group.fonts.map((fontName) => {
                  const isSelected = value === fontName;
                  return (
                    <div
                      key={fontName}
                      onClick={() => {
                        onChange(fontName);
                        onPreview?.(null);
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => onPreview?.(fontName)}
                      style={{
                        height: '26px',
                        padding: '0 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#0284c7' : 'transparent',
                        color: isSelected ? '#ffffff' : '#f8fafc',
                        fontSize: '12px',
                        userSelect: 'none',
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#334155';
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span
                        style={{
                          fontFamily: `"${fontName}", system-ui, sans-serif`,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '12px',
                        }}
                      >
                        {fontName}
                      </span>
                      {isSelected && <span style={{ fontSize: '10px', color: '#38bdf8' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
