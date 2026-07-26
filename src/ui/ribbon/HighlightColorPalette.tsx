import React from 'react';

export interface HighlightColorPaletteProps {
  activeColor?: string | null | undefined;
  onSelectColor: (color: string | null) => void;
  onClose: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', hex: '#ffff00' },
  { name: 'Bright Green', hex: '#00ff00' },
  { name: 'Turquoise', hex: '#00ffff' },
  { name: 'Pink', hex: '#ff00ff' },
  { name: 'Blue', hex: '#0000ff' },
  { name: 'Red', hex: '#ff0000' },
  { name: 'Dark Blue', hex: '#000080' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Green', hex: '#008000' },
  { name: 'Violet', hex: '#800080' },
  { name: 'Dark Red', hex: '#800000' },
  { name: 'Dark Yellow', hex: '#808000' },
  { name: '50% Gray', hex: '#808080' },
  { name: '25% Gray', hex: '#c0c0c0' },
  { name: 'Black', hex: '#000000' },
];

export const HighlightColorPalette: React.FC<HighlightColorPaletteProps> = ({
  activeColor,
  onSelectColor,
  onClose,
}) => {
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
        width: '180px',
        fontSize: '11px',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
        Highlight Color
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '8px' }}>
        {HIGHLIGHT_COLORS.map((item) => (
          <button
            key={item.hex}
            onClick={() => {
              onSelectColor(item.hex);
              onClose();
            }}
            title={item.name}
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: item.hex,
              border: '1px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '3px',
              cursor: 'pointer',
              outline: activeColor === item.hex ? '2px solid var(--emerald-accent)' : 'none',
            }}
          />
        ))}
      </div>

      {/* No Color Button */}
      <button
        onClick={() => {
          onSelectColor(null);
          onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '4px 8px',
          border: '1px solid var(--panel-border)',
          borderRadius: '4px',
          background: 'transparent',
          color: 'var(--text-main)',
          cursor: 'pointer',
          fontSize: '11px',
        }}
        className="ribbon-menu-item"
      >
        <span
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '2px',
            border: '1px dashed #ef4444',
            backgroundColor: 'transparent',
            position: 'relative',
          }}
        />
        <span>No Color</span>
      </button>
    </div>
  );
};
