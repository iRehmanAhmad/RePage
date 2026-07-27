import React, { useState, useMemo } from 'react';
import { AppIcon } from '../icons/AppIcon';
import type { PageId, RePageDocument } from '../../domain/document/types';
import type { ExportFormat, ExportOptions, ExportPageRange } from '../../export/types';
import { FORMAT_CAPABILITIES } from '../../export/types';
import { checkExportReadiness } from '../../export/exportReadiness';

export interface ExportOutputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  activePageId: PageId;
  onConfirmExport: (options: ExportOptions) => void;
  lang?: 'ur' | 'en';
}

export const ExportOutputDialog: React.FC<ExportOutputDialogProps> = ({
  isOpen,
  onClose,
  document,
  activePageId,
  onConfirmExport,
  lang = 'ur',
}) => {
  const isUr = lang === 'ur';

  // Format selection
  const [format, setFormat] = useState<ExportFormat>('browser-print');

  // Page range selection
  const [rangeKind, setRangeKind] = useState<'all' | 'current-page' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState<number>(1);
  const [customTo, setCustomTo] = useState<number>(document.pageOrder.length || 1);

  // High DPI & Option Controls
  const [dpi, setDpi] = useState<150 | 300 | 600>(300);
  const [includeBackground, setIncludeBackground] = useState<boolean>(true);
  const [includeBleed, setIncludeBleed] = useState<boolean>(false);
  const [includeCropMarks, setIncludeCropMarks] = useState<boolean>(false);
  const [outputName, setOutputName] = useState<string>(document.metadata.title || 'RePage_Output');

  // Override / Confirmation checkbox for preflight warnings
  const [confirmWarningsOverride, setConfirmWarningsOverride] = useState<boolean>(false);

  const activeCapability = FORMAT_CAPABILITIES[format];

  // Construct ExportOptions object
  const options = useMemo<ExportOptions>(() => {
    let pageRange: ExportPageRange;
    if (rangeKind === 'current-page') {
      pageRange = { kind: 'current-page', pageId: activePageId };
    } else if (rangeKind === 'custom') {
      pageRange = { kind: 'custom', from: customFrom, to: customTo };
    } else {
      pageRange = { kind: 'all' };
    }

    return {
      format,
      pageRange,
      dpi: activeCapability.supportsDpi ? dpi : undefined,
      includeBackground: activeCapability.supportsBackground ? includeBackground : undefined,
      includeBleed: activeCapability.supportsBleed ? includeBleed : undefined,
      includeCropMarks: activeCapability.supportsCropMarks ? includeCropMarks : undefined,
      outputName: outputName.trim() || 'RePage_Output',
    };
  }, [format, rangeKind, activePageId, customFrom, customTo, dpi, includeBackground, includeBleed, includeCropMarks, outputName, activeCapability]);

  // Evaluate Export Readiness
  const readiness = useMemo(() => checkExportReadiness(document, options), [document, options]);

  if (!isOpen) return null;

  const requiresWarningConfirmation = readiness.warningsEn.length > 0;
  const isExportDisabled = !readiness.canExport || (requiresWarningConfirmation && !confirmWarningsOverride);

  const handleConfirm = () => {
    if (isExportDisabled) return;
    onConfirmExport(options);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          color: '#f8fafc',
          borderRadius: '12px',
          padding: '24px',
          width: '620px',
          maxWidth: '94vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          direction: isUr ? 'rtl' : 'ltr',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#38bdf8' }}>
            <AppIcon name="export" /> {isUr ? 'برآمد ترتیبات (Output Setup)' : 'Export & Print Output Setup'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
          >
            <AppIcon name="dismiss" /> {isUr ? 'بند کریں' : 'Close'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
          {/* Output Format Selector */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              {isUr ? 'برآمدی فارمیٹ (Output Format):' : 'Output Format:'}
            </label>
            <select
              value={format}
              onChange={(e) => {
                setFormat(e.target.value as ExportFormat);
                setConfirmWarningsOverride(false);
              }}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontWeight: 600 }}
            >
              {(Object.keys(FORMAT_CAPABILITIES) as ExportFormat[]).map((fmtKey) => {
                const cap = FORMAT_CAPABILITIES[fmtKey];
                return (
                  <option key={fmtKey} value={fmtKey}>
                    {isUr ? cap.labelUr : cap.labelEn} {!cap.isImplemented ? (isUr ? '(غیر دستیاب)' : '(Unavailable)') : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Format Truth Description Box */}
          <div
            style={{
              backgroundColor: activeCapability.isImplemented ? '#0369a122' : '#7f1d1d22',
              border: `1px solid ${activeCapability.isImplemented ? '#0284c7' : '#991b1b'}`,
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: activeCapability.isImplemented ? '#bae6fd' : '#fca5a5',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>
              {isUr ? activeCapability.labelUr : activeCapability.labelEn}
            </div>
            <div>{isUr ? activeCapability.descriptionUr : activeCapability.descriptionEn}</div>
          </div>

          {/* Page Range Selector */}
          <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
              {isUr ? 'صفحات کا دائرہ کار (Page Range):' : 'Page Range:'}
            </label>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="pageRange"
                  aria-label={isUr ? 'تمام صفحات' : 'All Pages'}
                  checked={rangeKind === 'all'}
                  onChange={() => setRangeKind('all')}
                  style={{ accentColor: '#38bdf8' }}
                />
                <span>{isUr ? `تمام صفحات (${document.pageOrder.length})` : `All Pages (${document.pageOrder.length})`}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="pageRange"
                  aria-label={isUr ? 'موجودہ صفحہ' : 'Current Page'}
                  checked={rangeKind === 'current-page'}
                  onChange={() => setRangeKind('current-page')}
                  style={{ accentColor: '#38bdf8' }}
                />
                <span>{isUr ? 'موجودہ صفحہ' : 'Current Page'}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="pageRange"
                  aria-label={isUr ? 'حسب ضرورت' : 'Custom Range'}
                  checked={rangeKind === 'custom'}
                  onChange={() => setRangeKind('custom')}
                  style={{ accentColor: '#38bdf8' }}
                />
                <span>{isUr ? 'حسب ضرورت...' : 'Custom Range…'}</span>
              </label>
            </div>

            {/* Custom Range Inputs */}
            {rangeKind === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <span>{isUr ? 'صفحہ' : 'From'}</span>
                <input
                  type="number"
                  min="1"
                  max={document.pageOrder.length}
                  value={customFrom}
                  onChange={(e) => setCustomFrom(Number(e.target.value))}
                  style={{ width: '70px', padding: '6px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc' }}
                />
                <span>{isUr ? 'سے صفحہ' : 'to'}</span>
                <input
                  type="number"
                  min="1"
                  max={document.pageOrder.length}
                  value={customTo}
                  onChange={(e) => setCustomTo(Number(e.target.value))}
                  style={{ width: '70px', padding: '6px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc' }}
                />
                <span>{isUr ? 'تک' : ''}</span>
              </div>
            )}
          </div>

          {/* Conditional Options: DPI, Bleed & Crop Marks */}
          {(activeCapability.supportsDpi || activeCapability.supportsBleed || activeCapability.supportsCropMarks) && (
            <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontWeight: 600, color: '#cbd5e1' }}>
                {isUr ? 'اضافی پبلشنگ ترتیبات:' : 'Format Options:'}
              </div>

              {/* DPI Selector */}
              {activeCapability.supportsDpi && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ width: '120px', color: '#94a3b8' }}>DPI (رزولیوشن):</label>
                  <select
                    value={dpi}
                    onChange={(e) => setDpi(Number(e.target.value) as any)}
                    style={{ padding: '6px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc' }}
                  >
                    <option value={150}>150 DPI (Draft / Screen)</option>
                    <option value={300}>300 DPI (High Quality Print)</option>
                    <option value={600}>600 DPI (Ultra High Detail)</option>
                  </select>

                  {readiness.memoryEstimate && (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      ({readiness.memoryEstimate.widthPixels} × {readiness.memoryEstimate.heightPixels} px)
                    </span>
                  )}
                </div>
              )}

              {/* Bleed & Crop Marks Toggles */}
              {(activeCapability.supportsBleed || activeCapability.supportsCropMarks || activeCapability.supportsBackground) && (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {activeCapability.supportsBackground && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeBackground}
                        onChange={(e) => setIncludeBackground(e.target.checked)}
                        style={{ accentColor: '#38bdf8' }}
                      />
                      <span>{isUr ? 'پس منظر رنگ شامل کریں' : 'Include Page Background'}</span>
                    </label>
                  )}

                  {activeCapability.supportsBleed && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeBleed}
                        onChange={(e) => setIncludeBleed(e.target.checked)}
                        style={{ accentColor: '#38bdf8' }}
                      />
                      <span>{isUr ? 'بلیڈ ایریا شامل کریں' : 'Include Bleed Area'}</span>
                    </label>
                  )}

                  {activeCapability.supportsCropMarks && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeCropMarks}
                        onChange={(e) => setIncludeCropMarks(e.target.checked)}
                        style={{ accentColor: '#38bdf8' }}
                      />
                      <span>{isUr ? 'کٹ نشانات (Crop Marks)' : 'Include Crop Marks'}</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          {/* File Output Name */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
              {isUr ? 'فائل کا نام (Output File Name):' : 'Output File Name:'}
            </label>
            <input
              type="text"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              placeholder="RePage_Document"
              style={{ width: '100%', padding: '8px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc' }}
            />
          </div>

          {/* Preflight & Readiness Blocking Reasons */}
          {readiness.blockingReasonsEn.length > 0 && (
            <div style={{ backgroundColor: '#7f1d1d33', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#fca5a5' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                {isUr ? 'برآمد بلاک کر دی گئی ہے:' : 'Export Blocked:'}
              </div>
              <ul style={{ margin: 0, paddingRight: isUr ? '18px' : 0, paddingLeft: isUr ? 0 : '18px' }}>
                {(isUr ? readiness.blockingReasonsUr : readiness.blockingReasonsEn).map((reason, idx) => (
                  <li key={`block-${idx}`}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings List & Confirmation Override Checkbox */}
          {readiness.canExport && readiness.warningsEn.length > 0 && (
            <div style={{ backgroundColor: '#78350f33', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#fcd34d' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                <AppIcon name="warning" /> {isUr ? 'تنبنیہ:' : 'Warnings:'}
              </div>
              <ul style={{ margin: '0 0 10px 0', paddingRight: isUr ? '18px' : 0, paddingLeft: isUr ? 0 : '18px' }}>
                {(isUr ? readiness.warningsUr : readiness.warningsEn).map((warn, idx) => (
                  <li key={`warn-${idx}`}>{warn}</li>
                ))}
              </ul>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#fef08a' }}>
                <input
                  type="checkbox"
                  checked={confirmWarningsOverride}
                  onChange={(e) => setConfirmWarningsOverride(e.target.checked)}
                  style={{ accentColor: '#f59e0b' }}
                />
                <span>{isUr ? 'تنبہیات کے باوجود برآمد کریں (Export anyway)' : 'I understand the warnings, Export anyway'}</span>
              </label>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="button"
            data-testid="confirm-export-button"
            onClick={handleConfirm}
            disabled={isExportDisabled}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '12px',
              backgroundColor: isExportDisabled ? '#1e293b' : '#0284c7',
              border: `1px solid ${isExportDisabled ? '#334155' : '#38bdf8'}`,
              color: isExportDisabled ? '#64748b' : '#ffffff',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: isExportDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isUr ? `برآمد کریں (${activeCapability.labelUr})` : `Export (${activeCapability.labelEn})`}
          </button>
        </div>
      </div>
    </div>
  );
};
