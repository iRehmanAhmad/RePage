import React from 'react';
import { FontColorPalette } from './FontColorPalette';

export interface ParagraphShadingPaletteProps {
  activeColor?: string | undefined;
  onSelectColor: (color: string | null) => void;
  onClose: () => void;
}

export const ParagraphShadingPalette: React.FC<ParagraphShadingPaletteProps> = ({
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
        width: '210px',
        fontSize: '11px',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
        Paragraph Shading Color
      </div>
      <FontColorPalette
        activeColor={activeColor}
        onSelectColor={(col) => {
          onSelectColor(col);
          onClose();
        }}
        onClose={onClose}
      />
      {/* No Fill Button */}
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
          marginTop: '6px',
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
          }}
        />
        <span>No Color / No Fill</span>
      </button>
    </div>
  );
};
