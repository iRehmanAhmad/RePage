import React, { useState } from 'react';
import {
  CRULP_PHONETIC_MAP,
  SPECIAL_URDU_CHARACTERS,
  type KeyboardMode,
} from '../../domain/unicode/keyboardLayouts';

export interface VisualKeyboardProps {
  mode: KeyboardMode;
  onModeChange: (mode: KeyboardMode) => void;
  onInsertChar: (char: string) => void;
}

export function VisualKeyboard({ mode, onModeChange, onInsertChar }: VisualKeyboardProps) {
  const [isShift, setIsShift] = useState(false);

  const keys = Object.entries(CRULP_PHONETIC_MAP);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '10px 14px',
        backgroundColor: '#172119',
        color: '#f8fafc',
        borderTop: '1px solid #2d3748',
        fontSize: '13px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 600, color: '#34d399' }}>اردو کی بورڈ (Keyboard Mode):</span>
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as KeyboardMode)}
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #475569',
              borderRadius: '4px',
              padding: '2px 8px',
            }}
          >
            <option value="native">Native OS / IME</option>
            <option value="crulp">CRULP Phonetic</option>
            <option value="navees">Navees Phonetic</option>
            <option value="english">English (LTR)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsShift((prev) => !prev)}
          style={{
            backgroundColor: isShift ? '#059669' : '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 12px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Shift {isShift ? 'ON ▲' : 'OFF ▼'}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {keys.map(([latinKey, entry]) => {
          const char = isShift ? entry.shift : entry.normal;
          return (
            <button
              key={latinKey}
              type="button"
              onClick={() => onInsertChar(char)}
              style={{
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '6px 10px',
                fontFamily: "'Noto Nastaliq Urdu', serif",
                fontSize: '16px',
                cursor: 'pointer',
                minWidth: '36px',
                textAlign: 'center',
              }}
              title={`Key '${latinKey.toUpperCase()}'`}
            >
              {char}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>خاص علامتیں:</span>
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
              fontSize: '12px',
              cursor: 'pointer',
            }}
            title={item.description}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
