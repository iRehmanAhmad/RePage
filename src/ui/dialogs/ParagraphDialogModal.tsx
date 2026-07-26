import React, { useState } from 'react';
import type { TextAlignment, TextDirection } from '../../domain/rich-text/types';

export interface ParagraphProps {
  alignment: TextAlignment;
  direction: TextDirection;
  lineHeight: number;
  spaceBefore: number;
  spaceAfter: number;
  indentLevel: number;
  firstLineIndent: number;
  backgroundColor?: string | undefined;
}

export interface ParagraphDialogModalProps {
  isOpen: boolean;
  currentProps: ParagraphProps;
  onApply: (props: ParagraphProps) => void;
  onClose: () => void;
}

export const ParagraphDialogModal: React.FC<ParagraphDialogModalProps> = ({
  isOpen,
  currentProps,
  onApply,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'spacing' | 'breaks'>('spacing');
  const [alignment, setAlignment] = useState<TextAlignment>(currentProps.alignment || 'start');
  const [direction, setDirection] = useState<TextDirection>(currentProps.direction || 'rtl');
  const [lineHeight, setLineHeight] = useState<number>(currentProps.lineHeight || 1.5);
  const [spaceBefore, setSpaceBefore] = useState<number>(currentProps.spaceBefore || 0);
  const [spaceAfter, setSpaceAfter] = useState<number>(currentProps.spaceAfter || 6);
  const [indentLevel, setIndentLevel] = useState<number>(currentProps.indentLevel || 0);
  const [firstLineIndent, setFirstLineIndent] = useState<number>(currentProps.firstLineIndent || 0);
  const [widowOrphanControl, setWidowOrphanControl] = useState<boolean>(true);
  const [keepWithNext, setKeepWithNext] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onApply({
      alignment,
      direction,
      lineHeight,
      spaceBefore,
      spaceAfter,
      indentLevel,
      firstLineIndent,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ width: '540px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Paragraph Formatting</h3>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        {/* Tab Header Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--panel-border)', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('spacing')}
            style={{
              padding: '6px 16px',
              fontWeight: 600,
              fontSize: '12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'spacing' ? '2px solid var(--emerald-accent)' : '2px solid transparent',
              color: activeTab === 'spacing' ? 'var(--emerald-accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Indents and Spacing
          </button>
          <button
            onClick={() => setActiveTab('breaks')}
            style={{
              padding: '6px 16px',
              fontWeight: 600,
              fontSize: '12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'breaks' ? '2px solid var(--emerald-accent)' : '2px solid transparent',
              color: activeTab === 'breaks' ? 'var(--emerald-accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Line and Page Breaks
          </button>
        </div>

        {/* Indents and Spacing Tab */}
        {activeTab === 'spacing' && (
          <div>
            {/* General Section */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>General:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Alignment:</label>
                <select
                  value={alignment}
                  onChange={(e) => setAlignment(e.target.value as TextAlignment)}
                  style={{ width: '100%', height: '28px', marginTop: '4px', padding: '0 6px', fontSize: '11px' }}
                >
                  <option value="start">Right (Urdu) / Left (English)</option>
                  <option value="left">Left</option>
                  <option value="center">Centered</option>
                  <option value="right">Right</option>
                  <option value="justify">Justified</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Direction:</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as TextDirection)}
                  style={{ width: '100%', height: '28px', marginTop: '4px', padding: '0 6px', fontSize: '11px' }}
                >
                  <option value="rtl">Right-to-Left (Urdu)</option>
                  <option value="ltr">Left-to-Right (English)</option>
                </select>
              </div>
            </div>

            {/* Indentation Section */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Indentation:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Indent Level:</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={indentLevel}
                  onChange={(e) => setIndentLevel(Number(e.target.value))}
                  style={{ width: '100%', height: '28px', marginTop: '4px', padding: '0 6px', fontSize: '11px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>First Line Indent (pt):</label>
                <input
                  type="number"
                  step={6}
                  value={firstLineIndent}
                  onChange={(e) => setFirstLineIndent(Number(e.target.value))}
                  style={{ width: '100%', height: '28px', marginTop: '4px', padding: '0 6px', fontSize: '11px' }}
                />
              </div>
            </div>

            {/* Spacing Section */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Spacing:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Before (pt):</label>
                <input
                  type="number"
                  min={0}
                  max={72}
                  value={spaceBefore}
                  onChange={(e) => setSpaceBefore(Number(e.target.value))}
                  style={{ width: '100%', height: '28px', marginTop: '4px', padding: '0 6px', fontSize: '11px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>After (pt):</label>
                <input
                  type="number"
                  min={0}
                  max={72}
                  value={spaceAfter}
                  onChange={(e) => setSpaceAfter(Number(e.target.value))}
                  style={{ width: '100%', height: '28px', marginTop: '4px', padding: '0 6px', fontSize: '11px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Line Spacing:</label>
                <select
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  style={{ width: '100%', height: '28px', marginTop: '4px', padding: '0 6px', fontSize: '11px' }}
                >
                  <option value={1.0}>Single (1.0)</option>
                  <option value={1.15}>1.15 lines</option>
                  <option value={1.5}>1.5 lines</option>
                  <option value={2.0}>Double (2.0)</option>
                  <option value={2.5}>2.5 lines</option>
                  <option value={3.0}>3.0 lines</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Line and Page Breaks Tab */}
        {activeTab === 'breaks' && (
          <div style={{ marginBottom: '16px', fontSize: '11px' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Pagination:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={widowOrphanControl}
                  onChange={(e) => setWidowOrphanControl(e.target.checked)}
                />
                Widow/Orphan control
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={keepWithNext}
                  onChange={(e) => setKeepWithNext(e.target.checked)}
                />
                Keep with next paragraph
              </label>
            </div>
          </div>
        )}

        {/* Live Bilingual Preview Box */}
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Preview:</div>
        <div
          style={{
            border: '1px solid var(--panel-border)',
            borderRadius: '4px',
            padding: '12px',
            minHeight: '70px',
            backgroundColor: '#ffffff',
            color: '#172119',
            fontFamily: 'Noto Nastaliq Urdu',
            fontSize: '14px',
            direction: direction === 'rtl' ? 'rtl' : 'ltr',
            textAlign: alignment === 'justify' ? 'justify' : alignment === 'center' ? 'center' : alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : direction === 'rtl' ? 'right' : 'left',
            lineHeight: `${lineHeight}`,
            marginTop: `${spaceBefore}px`,
            marginBottom: `${spaceAfter}px`,
            paddingLeft: direction === 'ltr' ? `${indentLevel * 15 + firstLineIndent}px` : undefined,
            paddingRight: direction === 'rtl' ? `${indentLevel * 15 + firstLineIndent}px` : undefined,
            overflow: 'hidden',
          }}
        >
          اردو پیراگراف کی لائیو نمائش۔ یہ نمائش جدید انپیج اور ایم ایس ورڈ کے مطابق بہترین پیراگراف فارمیٹنگ فراہم کرتی ہے۔
        </div>

        {/* Dialog Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button onClick={onClose} className="ribbon-action-btn">Cancel</button>
          <button onClick={handleSave} className="ribbon-action-btn primary">OK</button>
        </div>
      </div>
    </div>
  );
};
