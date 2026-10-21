import React, { useState } from 'react';
import { AppIcon } from '../icons/AppIcon';
import type { TextAlignment, TextDirection } from '../../domain/rich-text/types';
import type { Translations } from '../i18n/menuTranslation';

export interface ParagraphProps {
  alignment: TextAlignment;
  direction: TextDirection;
  lineHeight: number;
  spaceBefore: number;
  spaceAfter: number;
  indentLevel: number;
  firstLineIndent: number;
  backgroundColor?: string | undefined;
  /** Paragraph starts at the top of the next page (canonical pageBreakBefore). */
  pageBreakBefore?: boolean | undefined;
}

export interface ParagraphDialogModalProps {
  isOpen: boolean;
  currentProps: ParagraphProps;
  onApply: (props: ParagraphProps) => void;
  onClose: () => void;
  t: Translations;
}

export const ParagraphDialogModal: React.FC<ParagraphDialogModalProps> = ({
  isOpen,
  currentProps,
  onApply,
  onClose,
  t,
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
  const [pageBreakBefore, setPageBreakBefore] = useState<boolean>(
    currentProps.pageBreakBefore ?? false,
  );

  // The dialog stays mounted while closed; re-read the flag from the
  // current paragraph each time it opens.
  React.useEffect(() => {
    if (isOpen) setPageBreakBefore(currentProps.pageBreakBefore ?? false);
  }, [isOpen, currentProps.pageBreakBefore]);

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
      pageBreakBefore,
    });
    onClose();
  };

  const fieldInputStyle: React.CSSProperties = {
    width: '100%',
    height: '24px',
    marginTop: '2px',
    padding: '2px 6px',
    fontSize: '11px',
    color: '#f8fafc',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '3px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const optionStyle: React.CSSProperties = {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-card" style={{ width: '450px', padding: '14px 18px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>{t.dlgParaTitle}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', borderRadius: '3px' }}>
            <AppIcon name="dismiss" size={14} />
          </button>
        </div>

        {/* Tab Header Navigation */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #334155', marginBottom: '10px' }}>
          <button
            onClick={() => setActiveTab('spacing')}
            style={{
              padding: '4px 12px',
              fontWeight: 600,
              fontSize: '11px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'spacing' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'spacing' ? '#10b981' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            {t.dlgParaSpacingTab}
          </button>
          <button
            onClick={() => setActiveTab('breaks')}
            style={{
              padding: '4px 12px',
              fontWeight: 600,
              fontSize: '11px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'breaks' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'breaks' ? '#10b981' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            {t.dlgParaBreaksTab}
          </button>
        </div>

        {/* Indents and Spacing Tab */}
        {activeTab === 'spacing' && (
          <div>
            {/* General Section */}
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.dlgParaGeneral}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e1' }}>{t.dlgParaAlignment}</label>
                <select
                  value={alignment}
                  onChange={(e) => setAlignment(e.target.value as TextAlignment)}
                  style={fieldInputStyle}
                >
                  <option value="start" style={optionStyle}>{t.dlgParaAlignStart}</option>
                  <option value="left" style={optionStyle}>{t.dlgParaAlignLeft}</option>
                  <option value="center" style={optionStyle}>{t.dlgParaAlignCenter}</option>
                  <option value="right" style={optionStyle}>{t.dlgParaAlignRight}</option>
                  <option value="justify" style={optionStyle}>{t.dlgParaAlignJustify}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e1' }}>{t.dlgParaDirection}</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as TextDirection)}
                  style={fieldInputStyle}
                >
                  <option value="rtl" style={optionStyle}>{t.dlgParaRtl}</option>
                  <option value="ltr" style={optionStyle}>{t.dlgParaLtr}</option>
                </select>
              </div>
            </div>

            {/* Indentation Section */}
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.dlgParaIndentation}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e1' }}>{t.dlgParaIndentLevel}</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={indentLevel}
                  onChange={(e) => setIndentLevel(Number(e.target.value))}
                  style={fieldInputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e1' }}>{t.dlgParaFirstLineIndent}</label>
                <input
                  type="number"
                  step={6}
                  value={firstLineIndent}
                  onChange={(e) => setFirstLineIndent(Number(e.target.value))}
                  style={fieldInputStyle}
                />
              </div>
            </div>

            {/* Spacing Section */}
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.dlgParaSpacing}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e1' }}>{t.dlgParaBefore}</label>
                <input
                  type="number"
                  min={0}
                  max={72}
                  value={spaceBefore}
                  onChange={(e) => setSpaceBefore(Number(e.target.value))}
                  style={fieldInputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e1' }}>{t.dlgParaAfter}</label>
                <input
                  type="number"
                  min={0}
                  max={72}
                  value={spaceAfter}
                  onChange={(e) => setSpaceAfter(Number(e.target.value))}
                  style={fieldInputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e1' }}>{t.dlgParaLineSpacing}</label>
                <select
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  style={fieldInputStyle}
                >
                  <option value={1.0} style={optionStyle}>{t.dlgParaSingle}</option>
                  <option value={1.15} style={optionStyle}>{t.dlgParaLines115}</option>
                  <option value={1.5} style={optionStyle}>{t.dlgParaLines15}</option>
                  <option value={2.0} style={optionStyle}>{t.dlgParaDouble}</option>
                  <option value={2.5} style={optionStyle}>{t.dlgParaLines25}</option>
                  <option value={3.0} style={optionStyle}>{t.dlgParaLines30}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Line and Page Breaks Tab */}
        {activeTab === 'breaks' && (
          <div style={{ marginBottom: '10px', fontSize: '11px' }}>
            <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.dlgParaPagination}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={widowOrphanControl}
                  onChange={(e) => setWidowOrphanControl(e.target.checked)}
                />
                {t.dlgParaWidowOrphan}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={keepWithNext}
                  onChange={(e) => setKeepWithNext(e.target.checked)}
                />
                {t.dlgParaKeepWithNext}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={pageBreakBefore}
                  onChange={(e) => setPageBreakBefore(e.target.checked)}
                />
                {t.dlgParaPageBreakBefore}
              </label>
            </div>
          </div>
        )}

        {/* Live Bilingual Preview Box */}
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', marginBottom: '3px' }}>{t.dlgPreviewLabel}</div>
        <div
          style={{
            border: '1px solid #334155',
            borderRadius: '4px',
            padding: '6px 10px',
            minHeight: '46px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'Noto Nastaliq Urdu',
            fontSize: '13px',
            direction: direction === 'rtl' ? 'rtl' : 'ltr',
            textAlign: alignment === 'justify' ? 'justify' : alignment === 'center' ? 'center' : alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : direction === 'rtl' ? 'right' : 'left',
            lineHeight: `${lineHeight}`,
            marginTop: `${spaceBefore}px`,
            marginBottom: `${spaceAfter}px`,
            paddingLeft: direction === 'ltr' ? `${indentLevel * 10 + firstLineIndent}px` : undefined,
            paddingRight: direction === 'rtl' ? `${indentLevel * 10 + firstLineIndent}px` : undefined,
            overflow: 'hidden',
          }}
        >
          اردو پیراگراف کی لائیو نمائش۔ یہ نمائش جدید انپیج اور ایم ایس ورڈ کے مطابق بہترین پیراگراف فارمیٹنگ فراہم کرتی ہے۔
        </div>

        {/* Dialog Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '4px 14px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#cbd5e1',
              backgroundColor: '#334155',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            {t.dlgCancel}
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '4px 18px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            {t.dlgOk}
          </button>
        </div>
      </div>
    </div>
  );
};
