import React, { useState } from 'react';
import { getFontCategoryBadge } from '../../domain/unicode/fontRegistry';

export interface FontProps {
  fontFamily: string;
  fontSize: number;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  underlineStyle?: 'single' | 'double' | 'thick' | 'dotted' | 'dashed' | 'wave';
  underlineColor?: string;
  isStrikethrough: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  characterSpacing?: number;
}

export interface FontDialogModalProps {
  isOpen: boolean;
  currentProps: FontProps;
  onApply: (props: FontProps) => void;
  onClose: () => void;
}

const FONT_FAMILIES = [
  'Noto Nastaliq Urdu',
  'Jameel Noori Nastaleeq',
  'Gulzar',
  'InPage Ali Nastaliq',
  'InPage Lahori Nastaliq',
  'Aptos (Body)',
  'Calibri',
  'Arial',
  'Times New Roman',
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72, 144];

export const FontDialogModal: React.FC<FontDialogModalProps> = ({
  isOpen,
  currentProps,
  onApply,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'font' | 'advanced'>('font');
  const [fontFamily, setFontFamily] = useState(currentProps.fontFamily || 'Noto Nastaliq Urdu');
  const [fontSize, setFontSize] = useState(currentProps.fontSize || 24);
  const [color, setColor] = useState(currentProps.color || '#172119');
  const [isBold, setIsBold] = useState(currentProps.isBold || false);
  const [isItalic, setIsItalic] = useState(currentProps.isItalic || false);
  const [isUnderline, setIsUnderline] = useState(currentProps.isUnderline || false);
  const [underlineStyle, setUnderlineStyle] = useState(currentProps.underlineStyle || 'single');
  const [underlineColor, setUnderlineColor] = useState(currentProps.underlineColor || '#000000');
  const [isStrikethrough, setIsStrikethrough] = useState(currentProps.isStrikethrough || false);
  const [isSubscript, setIsSubscript] = useState(currentProps.isSubscript || false);
  const [isSuperscript, setIsSuperscript] = useState(currentProps.isSuperscript || false);
  const [characterSpacing, setCharacterSpacing] = useState(currentProps.characterSpacing || 0);

  if (!isOpen) return null;

  const handleSave = () => {
    onApply({
      fontFamily,
      fontSize,
      color,
      isBold,
      isItalic,
      isUnderline,
      underlineStyle,
      underlineColor,
      isStrikethrough,
      isSubscript,
      isSuperscript,
      characterSpacing,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ width: '560px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Font Formatting</h3>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        {/* Tab Header Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--panel-border)', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('font')}
            style={{
              padding: '6px 16px',
              fontWeight: 600,
              fontSize: '12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'font' ? '2px solid var(--emerald-accent)' : '2px solid transparent',
              color: activeTab === 'font' ? 'var(--emerald-accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Font
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            style={{
              padding: '6px 16px',
              fontWeight: 600,
              fontSize: '12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'advanced' ? '2px solid var(--emerald-accent)' : '2px solid transparent',
              color: activeTab === 'advanced' ? 'var(--emerald-accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Advanced Character Spacing
          </button>
        </div>

        {/* Font Tab */}
        {activeTab === 'font' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {/* Font Family List */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Font:</label>
                <div style={{ border: '1px solid var(--panel-border)', borderRadius: '4px', height: '110px', overflowY: 'auto', background: 'var(--panel-bg)', marginTop: '4px' }}>
                  {FONT_FAMILIES.map((fam) => {
                    const badge = getFontCategoryBadge(fam);
                    return (
                      <div
                        key={fam}
                        onClick={() => setFontFamily(fam)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          backgroundColor: fontFamily === fam ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                          color: fontFamily === fam ? 'var(--emerald-accent)' : badge.isUnavailable ? '#dc2626' : 'var(--text-main)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontFamily: fam }}>{fam}</span>
                        <span style={{ fontSize: '9px', opacity: 0.8, color: badge.isUnavailable ? '#dc2626' : 'var(--text-muted)' }}>
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Font Style */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Font style:</label>
                <div style={{ border: '1px solid var(--panel-border)', borderRadius: '4px', height: '110px', overflowY: 'auto', background: 'var(--panel-bg)', marginTop: '4px' }}>
                  <div
                    onClick={() => { setIsBold(false); setIsItalic(false); }}
                    style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', backgroundColor: !isBold && !isItalic ? 'rgba(16, 185, 129, 0.15)' : 'transparent' }}
                  >
                    Regular
                  </div>
                  <div
                    onClick={() => { setIsBold(false); setIsItalic(true); }}
                    style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontStyle: 'italic', backgroundColor: !isBold && isItalic ? 'rgba(16, 185, 129, 0.15)' : 'transparent' }}
                  >
                    Italic
                  </div>
                  <div
                    onClick={() => { setIsBold(true); setIsItalic(false); }}
                    style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 700, backgroundColor: isBold && !isItalic ? 'rgba(16, 185, 129, 0.15)' : 'transparent' }}
                  >
                    Bold
                  </div>
                  <div
                    onClick={() => { setIsBold(true); setIsItalic(true); }}
                    style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 700, fontStyle: 'italic', backgroundColor: isBold && isItalic ? 'rgba(16, 185, 129, 0.15)' : 'transparent' }}
                  >
                    Bold Italic
                  </div>
                </div>
              </div>

              {/* Size List */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Size:</label>
                <div style={{ border: '1px solid var(--panel-border)', borderRadius: '4px', height: '110px', overflowY: 'auto', background: 'var(--panel-bg)', marginTop: '4px' }}>
                  {FONT_SIZES.map((s) => (
                    <div
                      key={s}
                      onClick={() => setFontSize(s)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        backgroundColor: fontSize === s ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        color: fontSize === s ? 'var(--emerald-accent)' : 'var(--text-main)',
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors & Underline Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Font color:</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: '100%', height: '28px', marginTop: '4px', border: 'none', cursor: 'pointer' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Underline style:</label>
                <select
                  value={isUnderline ? underlineStyle : 'none'}
                  onChange={(e) => {
                    if (e.target.value === 'none') {
                      setIsUnderline(false);
                    } else {
                      setIsUnderline(true);
                      setUnderlineStyle(e.target.value as any);
                    }
                  }}
                  style={{ width: '100%', height: '28px', marginTop: '4px', padding: '0 6px', fontSize: '11px' }}
                >
                  <option value="none">(None)</option>
                  <option value="single">Single Line</option>
                  <option value="double">Double Line</option>
                  <option value="thick">Thick Line</option>
                  <option value="dotted">Dotted</option>
                  <option value="dashed">Dashed</option>
                  <option value="wave">Wave / Wavey</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Underline color:</label>
                <input
                  type="color"
                  value={underlineColor}
                  onChange={(e) => setUnderlineColor(e.target.value)}
                  disabled={!isUnderline}
                  style={{ width: '100%', height: '28px', marginTop: '4px', border: 'none', cursor: isUnderline ? 'pointer' : 'not-allowed', opacity: isUnderline ? 1 : 0.4 }}
                />
              </div>
            </div>

            {/* Effects Checkboxes */}
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Effects:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '11px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isStrikethrough} onChange={(e) => setIsStrikethrough(e.target.checked)} />
                Strikethrough
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isSubscript} onChange={(e) => { setIsSubscript(e.target.checked); if (e.target.checked) setIsSuperscript(false); }} />
                Subscript
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isSuperscript} onChange={(e) => { setIsSuperscript(e.target.checked); if (e.target.checked) setIsSubscript(false); }} />
                Superscript
              </label>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Character Spacing (Kashida / Tracking):</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                <input
                  type="range"
                  min={-5}
                  max={20}
                  step={0.5}
                  value={characterSpacing}
                  onChange={(e) => setCharacterSpacing(parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '40px' }}>{characterSpacing}pt</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Preview Box */}
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Preview:</div>
        <div
          style={{
            border: '1px solid var(--panel-border)',
            borderRadius: '4px',
            padding: '12px',
            minHeight: '60px',
            backgroundColor: '#ffffff',
            color,
            fontFamily,
            fontSize: `${Math.min(fontSize, 32)}px`,
            fontWeight: isBold ? 700 : 400,
            fontStyle: isItalic ? 'italic' : 'normal',
            textDecoration: isUnderline
              ? `${underlineStyle === 'double' ? 'underline double' : underlineStyle === 'wave' ? 'underline wavy' : underlineStyle === 'dotted' ? 'underline dotted' : underlineStyle === 'dashed' ? 'underline dashed' : 'underline'}`
              : isStrikethrough
              ? 'line-through'
              : 'none',
            textDecorationColor: isUnderline ? underlineColor : undefined,
            letterSpacing: `${characterSpacing}px`,
            direction: 'rtl',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          اردو خطاطی کی نمائش — Quick Brown Fox
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button onClick={onClose} className="ribbon-action-btn">Cancel</button>
          <button onClick={handleSave} className="ribbon-action-btn primary">OK</button>
        </div>
      </div>
    </div>
  );
};
