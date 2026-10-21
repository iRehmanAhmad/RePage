import React, { useState } from 'react';
import type { UiLanguage } from '../i18n/menuTranslation';
import { AppIcon } from '../icons/AppIcon';
import {
  clampStepAndRepeatSpec,
  measurementToPoints,
  type MeasurementUnit,
  type StepAndRepeatSpec,
} from '../../domain/geometry/stepAndRepeat';

export interface StepAndRepeatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lang: UiLanguage;
  /** The document's measurement unit — gaps are entered in this unit. */
  unit: MeasurementUnit;
  objectName: string;
  /** Called with the grid spec, gaps already converted to points. */
  onConfirm: (spec: StepAndRepeatSpec) => void;
}

/**
 * Step-and-repeat dialog (Phase 4 batch 12): asks for a rows × columns
 * grid and the gaps between copies (in the document's measurement unit),
 * shows the resulting copy count live, and hands points-based geometry
 * to the stepAndRepeatObjectCommand. Copies that fall outside the page
 * are still created — the note under the grid says so honestly.
 */
export function StepAndRepeatDialog({
  isOpen,
  onClose,
  lang,
  unit,
  objectName,
  onConfirm,
}: StepAndRepeatDialogProps) {
  const [rows, setRows] = useState(2);
  const [columns, setColumns] = useState(2);
  const [horizontalGap, setHorizontalGap] = useState(unit === 'pt' ? 12 : unit === 'mm' ? 4 : 0.17);
  const [verticalGap, setVerticalGap] = useState(unit === 'pt' ? 12 : unit === 'mm' ? 4 : 0.17);

  if (!isOpen) return null;
  const isUr = lang === 'ur';

  const spec = clampStepAndRepeatSpec({
    rows,
    columns,
    horizontalGapPoints: measurementToPoints(horizontalGap || 0, unit),
    verticalGapPoints: measurementToPoints(verticalGap || 0, unit),
  });
  const copyCount = spec.rows * spec.columns - 1;

  const fieldLabel: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '3px',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '6px 8px',
    color: '#f8fafc',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const numberField = (
    label: string,
    value: number,
    setValue: (n: number) => void,
    step: number,
    min: number,
  ): React.ReactNode => (
    <label style={{ flex: 1 }}>
      <span style={fieldLabel}>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        step={step}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        style={inputStyle}
      />
    </label>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
      }}
    >
      <div
        style={{
          width: '380px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '18px 22px',
          color: '#f8fafc',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          fontSize: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 700 }}>
            {isUr ? 'مرحلہ وار نقل (Step and Repeat)' : 'Step and Repeat'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px',
            }}
          >
            <AppIcon name="dismiss" size={16} />
          </button>
        </div>

        <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '12px' }}>
          {objectName}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          {numberField(isUr ? 'قطاریں (Rows)' : 'Rows', rows, setRows, 1, 1)}
          {numberField(isUr ? 'کالم (Columns)' : 'Columns', columns, setColumns, 1, 1)}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          {numberField(
            isUr ? `افقی فاصلہ (${unit})` : `Horizontal gap (${unit})`,
            horizontalGap,
            setHorizontalGap,
            unit === 'pt' ? 1 : 0.1,
            0,
          )}
          {numberField(
            isUr ? `عمودی فاصلہ (${unit})` : `Vertical gap (${unit})`,
            verticalGap,
            setVerticalGap,
            unit === 'pt' ? 1 : 0.1,
            0,
          )}
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
          {isUr
            ? `کل نقلیں: ${copyCount} — صفحے سے باہر جانے والی نقلیں بھی بنائی جائیں گی۔`
            : `Copies to create: ${copyCount} — copies that fall outside the page are created too.`}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
              color: '#cbd5e1',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isUr ? 'کنسل' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={copyCount < 1}
            onClick={() => onConfirm(spec)}
            style={{
              backgroundColor: copyCount < 1 ? '#475569' : '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 18px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: copyCount < 1 ? 'not-allowed' : 'pointer',
            }}
          >
            {isUr ? 'نقلیں بنائیں' : 'Create Copies'}
          </button>
        </div>
      </div>
    </div>
  );
}
