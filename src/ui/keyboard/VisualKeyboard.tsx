import React, { useState } from 'react';
import {
  QWERTY_ROW_1,
  QWERTY_ROW_2,
  QWERTY_ROW_3,
  SPECIAL_URDU_CHARACTERS,
  getLayoutMapForMode,
  type KeyboardMode,
} from '../../domain/unicode/keyboardLayouts';
import { loadCustomKeyboardLayouts } from '../../domain/unicode/customKeyboardEngine';

export interface VisualKeyboardProps {
  mode: KeyboardMode;
  onModeChange: (mode: KeyboardMode) => void;
  onInsertChar: (char: string) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function VisualKeyboard({
  mode,
  onModeChange,
  onInsertChar,
  isMinimized: externalMinimized,
  onToggleMinimize,
}: VisualKeyboardProps) {
  const [isShift, setIsShift] = useState(false);
  const [internalMinimized, setInternalMinimized] = useState(false);

  const isMinimized = externalMinimized ?? internalMinimized;

  const handleToggleMinimize = () => {
    if (onToggleMinimize) {
      onToggleMinimize();
    } else {
      setInternalMinimized((prev) => !prev);
    }
  };

  const customLayouts = loadCustomKeyboardLayouts();
  const currentLayout = getLayoutMapForMode(mode);

  const renderRow = (rowKeys: string[]) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
      {rowKeys.map((latinKey) => {
        const entry = currentLayout[latinKey];
        const char = entry ? (isShift ? entry.shift : entry.normal) : latinKey;
        const latinLabel = isShift ? latinKey.toUpperCase() : latinKey;

        return (
          <button
            key={latinKey}
            type="button"
            onClick={() => onInsertChar(char)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: '5px',
              padding: '2px 6px',
              minWidth: '40px',
              height: '40px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              position: 'relative',
            }}
            title={`Key '${latinKey.toUpperCase()}' ➔ ${char}`}
          >
            {/* Small Latin Key Label in top-left */}
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: '#64748b',
                alignSelf: 'flex-start',
                lineHeight: 1,
              }}
            >
              {latinLabel}
            </span>

            {/* Main Urdu Character in center */}
            <span
              style={{
                fontFamily: mode === 'english' ? 'inherit' : "'Noto Nastaliq Urdu', serif",
                fontSize: mode === 'english' ? '14px' : '17px',
                fontWeight: 600,
                color: '#f8fafc',
                lineHeight: 1.1,
              }}
            >
              {char}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (isMinimized) {
    if (onToggleMinimize) {
      return null;
    }
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '2px 12px',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderTop: '1px solid #1e293b',
          fontSize: '11px',
        }}
      >
        <button
          type="button"
          onClick={handleToggleMinimize}
          style={{
            backgroundColor: '#1e293b',
            color: '#38bdf8',
            border: '1px solid #334155',
            borderRadius: '5px',
            padding: '2px 14px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Expand Visual Keyboard"
        >
          <span>⌨</span>
          <span>Expand Keyboard ▲</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderTop: '1px solid #1e293b',
        fontSize: '11px',
      }}
    >
      {/* Consolidated Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: '#10b981' }}>اردو کی بورڈ (Keyboard Mode):</span>
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as KeyboardMode)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '5px',
              padding: '2px 8px',
              fontWeight: 600,
              fontSize: '11px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="crulp">CRULP Phonetic (Standard Urdu)</option>
            <option value="navees">Navees Phonetic</option>
            <option value="english">English (LTR Latin)</option>
            <option value="native">Native OS Pass-through</option>
            {customLayouts.map((l) => (
              <option key={l.id} value={`custom:${l.id}`}>
                {l.name} (Custom)
              </option>
            ))}
          </select>

          {/* Shift Toggle */}
          {mode !== 'native' && (
            <button
              type="button"
              onClick={() => setIsShift((prev) => !prev)}
              style={{
                backgroundColor: isShift ? '#059669' : '#334155',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                padding: '3px 10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '10px',
                boxShadow: isShift ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
              }}
            >
              Shift {isShift ? 'ON ▲' : 'OFF ▼'}
            </button>
          )}

          {/* Special Urdu Marks & Diacritics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>اعراب:</span>
            {[
              { label: 'زبر', char: '\u064e' },
              { label: 'زیر', char: '\u0650' },
              { label: 'پیش', char: '\u064f' },
              { label: 'جزم', char: '\u0652' },
              { label: 'شد', char: '\u0651' },
              { label: 'کھڑی زبر', char: '\u0670' },
              { label: 'دو زبر', char: '\u064b' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onInsertChar(item.char)}
                style={{
                  backgroundColor: '#0369a1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title={`Insert ${item.label}`}
              >
                {item.char}
              </button>
            ))}
            {SPECIAL_URDU_CHARACTERS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onInsertChar(item.char)}
                style={{
                  backgroundColor: '#0f766e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title={item.description}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Minimize Toggle */}
        <button
          type="button"
          onClick={handleToggleMinimize}
          style={{
            backgroundColor: '#1e293b',
            color: '#38bdf8',
            border: '1px solid #334155',
            borderRadius: '5px',
            padding: '3px 10px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Minimize Visual Keyboard"
        >
          <span>⌨</span>
          <span>Minimize Keyboard ▼</span>
        </button>
      </div>

      {/* Honest Native OS Mode Banner vs Key Grid */}
      {mode === 'native' ? (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#020617',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            color: '#38bdf8',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          ⌨ Native OS Keyboard Mode Active — Key mapping grid is disabled. Type directly using your operating system keyboard.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
          {renderRow(QWERTY_ROW_1)}
          {renderRow(QWERTY_ROW_2)}
          {renderRow(QWERTY_ROW_3)}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => onInsertChar(' ')}
              style={{
                backgroundColor: '#334155',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '5px',
                padding: '4px 32px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                minWidth: '220px',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              Space (وقفہ)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
