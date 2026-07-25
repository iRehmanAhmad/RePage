import React, { useState } from 'react';
import {
  QWERTY_ROW_1,
  QWERTY_ROW_2,
  QWERTY_ROW_3,
  SPECIAL_URDU_CHARACTERS,
  getLayoutMapForMode,
  type KeyboardMode,
} from '../../domain/unicode/keyboardLayouts';

export interface VisualKeyboardProps {
  mode: KeyboardMode;
  onModeChange: (mode: KeyboardMode) => void;
  onInsertChar: (char: string) => void;
}

export function VisualKeyboard({ mode, onModeChange, onInsertChar }: VisualKeyboardProps) {
  const [isShift, setIsShift] = useState(false);

  const currentLayout = getLayoutMapForMode(mode);

  const renderRow = (rowKeys: string[]) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
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
              borderRadius: '6px',
              padding: '3px 8px',
              minWidth: '42px',
              height: '42px',
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '10px 16px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderTop: '1px solid #1e293b',
        fontSize: '12px',
      }}
    >
      {/* Keyboard Header & Mode Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 700, color: '#10b981' }}>اردو کی بورڈ (Keyboard Mode):</span>
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as KeyboardMode)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '3px 10px',
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
          </select>

          {mode === 'native' && (
            <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
              (Using System OS Windows Urdu IME)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsShift((prev) => !prev)}
          style={{
            backgroundColor: isShift ? '#059669' : '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 14px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '11px',
            boxShadow: isShift ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
          }}
        >
          Shift {isShift ? 'ON ▲' : 'OFF ▼'}
        </button>
      </div>

      {/* 3 Realistic QWERTY Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', margin: '4px 0' }}>
        {renderRow(QWERTY_ROW_1)}
        {renderRow(QWERTY_ROW_2)}
        {renderRow(QWERTY_ROW_3)}
      </div>

      {/* Special Urdu Characters & Controls Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>خاص علامتیں (Marks):</span>
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
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title={item.description}
          >
            {item.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onInsertChar(' ')}
          style={{
            backgroundColor: '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '3px 16px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Space (وقفہ)
        </button>
      </div>
    </div>
  );
}
