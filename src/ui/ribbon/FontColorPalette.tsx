import React, { useState } from 'react';

export interface FontColorPaletteProps {
  activeColor?: string | undefined;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

function getLightness(hex: string): number {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (max + min) / 2;
}

const THEME_COLOR_COLUMNS = [
  // 0: White / Gray spectrum
  ['#ffffff', '#f2f2f2', '#e6e6e6', '#d9d9d9', '#bfbfbf', '#808080'],
  // 1: Pure Black to Light Gray spectrum
  ['#ffffff', '#d9d9d9', '#a6a6a6', '#595959', '#262626', '#000000'],
  // 2: Warm Off-White / Silver spectrum
  ['#fbf9f6', '#e7e6e6', '#d9d9d9', '#bfbfbf', '#7f7f7f', '#3b3b3b'],
  // 3: Dark Slate Blue spectrum
  ['#edf2f7', '#d9e1f2', '#b4c6e7', '#8ea9db', '#305496', '#1f3864'],
  // 4: Accent Blue spectrum
  ['#eef4fc', '#dedeef', '#bdd7ee', '#9cc3e5', '#2f5597', '#203764'],
  // 5: Accent Orange / Amber spectrum
  ['#fff5ee', '#fce4d6', '#f8cbad', '#f4b084', '#c65911', '#833c0c'],
  // 6: Accent Grey / Warm Steel spectrum
  ['#f4f4f6', '#edd9c0', '#e2f0d9', '#c6e0b4', '#7f7f7f', '#404040'],
  // 7: Accent Gold / Yellow spectrum
  ['#fffae6', '#fff2cc', '#ffe699', '#ffd966', '#bf8f00', '#806000'],
  // 8: Sky Blue / Cyan spectrum
  ['#e6f7ff', '#ddebf7', '#bdd7ee', '#9cc3e5', '#2e75b6', '#1f4e78'],
  // 9: Accent Green spectrum
  ['#f0f9eb', '#e2f0d9', '#c6e0b4', '#a9d08e', '#548235', '#234015'],
];

// Sort each column strictly from High (Darkest/Strongest) at Row 0 down to Low/Dim (Lightest) at Row 5
const SORTED_THEME_COLOR_COLUMNS = THEME_COLOR_COLUMNS.map((col) =>
  [...col].sort((a, b) => getLightness(a) - getLightness(b)),
);

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
        {[0, 1, 2, 3, 4, 5].map((rowIdx) =>
          SORTED_THEME_COLOR_COLUMNS.map((col, colIdx) => {
            const hex = col[rowIdx] || '#ffffff';
            return (
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
            );
          }),
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
