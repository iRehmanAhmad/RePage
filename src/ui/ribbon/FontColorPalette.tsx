import React, { useState } from 'react';

export interface FontColorPaletteProps {
  activeColor?: string | undefined;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

const THEME_COLOR_COLUMNS = [
  ['#ffffff', '#f2f2f2', '#d9d9d9', '#bfbfbf', '#a6a6a6', '#7f7f7f'],
  ['#000000', '#7f7f7f', '#595959', '#3f3f3f', '#262626', '#0c0c0c'],
  ['#e7e6e6', '#d9d9d9', '#bfbfbf', '#a6a6a6', '#7f7f7f', '#3b3b3b'],
  ['#44546a', '#d9e1f2', '#b4c6e7', '#8ea9db', '#305496', '#1f3864'],
  ['#5b9bd5', '#dedeef', '#bdd7ee', '#9cc3e5', '#2f5597', '#203764'],
  ['#ed7d31', '#fce4d6', '#f8cbad', '#f4b084', '#c65911', '#833c0c'],
  ['#a5a5a5', '#edd9c0', '#e2f0d9', '#c6e0b4', '#a9d08e', '#548235'],
  ['#ffc000', '#fff2cc', '#ffe699', '#ffd966', '#bf8f00', '#806000'],
  ['#4472c4', '#d9e1f2', '#b4c6e7', '#8ea9db', '#2f5597', '#1f3864'],
  ['#70ad47', '#e2f0d9', '#c6e0b4', '#a9d08e', '#548235', '#375623'],
];

const STANDARD_COLORS = [
  '#c00000',
  '#ff0000',
  '#ffc000',
  '#ffff00',
  '#92d050',
  '#00b050',
  '#00b0f0',
  '#0070c0',
  '#002060',
  '#7030a0',
];

export const FontColorPalette: React.FC<FontColorPaletteProps> = ({
  activeColor,
  onSelectColor,
  onClose,
}) => {
  const [customColor, setCustomColor] = useState(activeColor || '#000000');

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        zIndex: 9999,
        backgroundColor: 'var(--panel-bg)',
        color: 'var(--text-main)',
        border: '1px solid var(--panel-border)',
        borderRadius: '6px',
        boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.5)',
        padding: '8px 10px',
        width: '240px',
        fontSize: '11px',
      }}
    >
      {/* Automatic Default Color */}
      <button
        onClick={() => {
          onSelectColor('inherit');
          onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '4px 6px',
          border: '1px solid transparent',
          borderRadius: '4px',
          background: 'transparent',
          color: 'var(--text-main)',
          cursor: 'pointer',
          marginBottom: '8px',
        }}
        className="ribbon-menu-item"
      >
        <span
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '2px',
            border: '1px solid #94a3b8',
            backgroundColor: '#000000',
          }}
        />
        <span>Automatic</span>
      </button>

      {/* Theme Colors Section */}
      <div style={{ fontWeight: 600, fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
        Theme Colors
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '2px', marginBottom: '8px' }}>
        {THEME_COLOR_COLUMNS.map((col, colIdx) =>
          col.map((hex, rowIdx) => (
            <button
              key={`${colIdx}-${rowIdx}`}
              onClick={() => {
                onSelectColor(hex);
                onClose();
              }}
              title={hex}
              style={{
                width: '18px',
                height: rowIdx === 0 ? '18px' : '14px',
                backgroundColor: hex,
                border: '1px solid rgba(0, 0, 0, 0.15)',
                borderRadius: '2px',
                cursor: 'pointer',
                outline: activeColor === hex ? '2px solid var(--emerald-accent)' : 'none',
              }}
            />
          )),
        )}
      </div>

      {/* Standard Colors Section */}
      <div style={{ fontWeight: 600, fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
        Standard Colors
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '2px', marginBottom: '8px' }}>
        {STANDARD_COLORS.map((hex) => (
          <button
            key={hex}
            onClick={() => {
              onSelectColor(hex);
              onClose();
            }}
            title={hex}
            style={{
              width: '18px',
              height: '18px',
              backgroundColor: hex,
              border: '1px solid rgba(0, 0, 0, 0.15)',
              borderRadius: '2px',
              cursor: 'pointer',
              outline: activeColor === hex ? '2px solid var(--emerald-accent)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Custom Color Input */}
      <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>Custom:</span>
        <input
          type="color"
          value={customColor}
          onChange={(e) => {
            setCustomColor(e.target.value);
            onSelectColor(e.target.value);
          }}
          style={{ width: '28px', height: '22px', border: 'none', background: 'none', cursor: 'pointer' }}
        />
      </div>
    </div>
  );
};
