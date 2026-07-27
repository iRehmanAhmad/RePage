import React, { useState, useEffect } from 'react';
import type { Insets, RePageDocument } from '../../domain/document/types';
import type { PageLayoutTarget } from '../../editor/commands/pageLayoutCommands';
import type { UiLanguage } from '../i18n/menuTranslation';
import {
  PAGE_PRESETS,
  inchesToPoints,
  millimetresToPoints,
  pointsToInches,
  pointsToMillimetres,
} from '../../domain/geometry/units';
import { getPagesForSection, getSectionForPage } from '../../domain/layout/sectionEngine';

export interface PageSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  activePageId: string;
  lang: UiLanguage;
  onApply: (
    target: PageLayoutTarget,
    setup: {
      width?: number;
      height?: number;
      orientation?: 'portrait' | 'landscape';
      margins?: Insets;
      bleed?: Insets;
      background?: string;
    },
  ) => void;
}

export function PageSetupModal({
  isOpen,
  onClose,
  document: doc,
  activePageId,
  lang,
  onApply,
}: PageSetupModalProps) {
  const isUr = lang === 'ur';
  const unit = doc.settings.measurementUnit || 'mm';

  const activePage = doc.pages[activePageId] || doc.pages[doc.pageOrder[0]!];
  const activeSection = getSectionForPage(doc, activePageId);

  // Conversion helpers based on document unit setting
  const toUnit = (pt: number) => {
    if (unit === 'in') return Number(pointsToInches(pt).toFixed(2));
    if (unit === 'pt') return Number(pt.toFixed(1));
    return Number(pointsToMillimetres(pt).toFixed(1)); // mm default
  };

  const toPoints = (val: number) => {
    if (unit === 'in') return inchesToPoints(val);
    if (unit === 'pt') return val;
    return millimetresToPoints(val);
  };

  const unitLabel = unit === 'in' ? 'in' : unit === 'pt' ? 'pt' : 'mm';

  // Modal State
  const [applyTargetKind, setApplyTargetKind] = useState<'current-page' | 'current-section' | 'whole-document'>('current-section');
  const [presetKey, setPresetKey] = useState<string>('custom');
  const [widthVal, setWidthVal] = useState<number>(toUnit(activePage?.width || 595.28));
  const [heightVal, setHeightVal] = useState<number>(toUnit(activePage?.height || 841.89));
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    activePage && activePage.width > activePage.height ? 'landscape' : 'portrait',
  );

  // Margins & Gutter
  const [marginTop, setMarginTop] = useState<number>(toUnit(activePage?.margins.top || 42.52));
  const [marginRight, setMarginRight] = useState<number>(toUnit(activePage?.margins.right || 42.52));
  const [marginBottom, setMarginBottom] = useState<number>(toUnit(activePage?.margins.bottom || 42.52));
  const [marginLeft, setMarginLeft] = useState<number>(toUnit(activePage?.margins.left || 42.52));
  const [gutter, setGutter] = useState<number>(0);
  const [gutterPosition, setGutterPosition] = useState<'left' | 'right' | 'top'>('right');
  const [useMirrorMargins, setUseMirrorMargins] = useState<boolean>(false);

  // Bleed & Background
  const [bleedTop, setBleedTop] = useState<number>(toUnit(activePage?.bleed.top || 0));
  const [bleedRight, setBleedRight] = useState<number>(toUnit(activePage?.bleed.right || 0));
  const [bleedBottom, setBleedBottom] = useState<number>(toUnit(activePage?.bleed.bottom || 0));
  const [bleedLeft, setBleedLeft] = useState<number>(toUnit(activePage?.bleed.left || 0));
  const [backgroundColor, setBackgroundColor] = useState<string>(activePage?.background || '#ffffff');
  const [showPrintableArea, setShowPrintableArea] = useState<boolean>(true);

  // Validation Error / Warning State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [overflowWarning, setOverflowWarning] = useState<string | null>(null);

  // Sync initial state when active page changes or dialog opens
  useEffect(() => {
    if (activePage) {
      const getVal = (pt: number) => {
        if (unit === 'in') return Number(pointsToInches(pt).toFixed(2));
        if (unit === 'pt') return Number(pt.toFixed(1));
        return Number(pointsToMillimetres(pt).toFixed(1));
      };

      setWidthVal(getVal(activePage.width));
      setHeightVal(getVal(activePage.height));
      setOrientation(activePage.width > activePage.height ? 'landscape' : 'portrait');
      setMarginTop(getVal(activePage.margins.top));
      setMarginRight(getVal(activePage.margins.right));
      setMarginBottom(getVal(activePage.margins.bottom));
      setMarginLeft(getVal(activePage.margins.left));
      setBleedTop(getVal(activePage.bleed.top));
      setBleedRight(getVal(activePage.bleed.right));
      setBleedBottom(getVal(activePage.bleed.bottom));
      setBleedLeft(getVal(activePage.bleed.left));
      setBackgroundColor(activePage.background || '#ffffff');
    }
  }, [isOpen, activePageId, activePage, unit]);

  if (!isOpen) return null;

  // Preset Selection Handler
  const handlePresetSelect = (key: string) => {
    setPresetKey(key);
    if (key === 'a4') {
      setWidthVal(toUnit(PAGE_PRESETS.a4.width));
      setHeightVal(toUnit(PAGE_PRESETS.a4.height));
    } else if (key === 'a5') {
      setWidthVal(toUnit(PAGE_PRESETS.a5.width));
      setHeightVal(toUnit(PAGE_PRESETS.a5.height));
    } else if (key === 'a3') {
      setWidthVal(toUnit(PAGE_PRESETS.a3.width));
      setHeightVal(toUnit(PAGE_PRESETS.a3.height));
    } else if (key === 'letter') {
      setWidthVal(toUnit(PAGE_PRESETS.letter.width));
      setHeightVal(toUnit(PAGE_PRESETS.letter.height));
    } else if (key === 'legal') {
      setWidthVal(toUnit(PAGE_PRESETS.legal.width));
      setHeightVal(toUnit(PAGE_PRESETS.legal.height));
    } else if (key === 'book6x9') {
      setWidthVal(toUnit(PAGE_PRESETS.book6x9.width));
      setHeightVal(toUnit(PAGE_PRESETS.book6x9.height));
    }
  };

  // Validation Logic
  const validate = (): boolean => {
    setValidationError(null);
    setOverflowWarning(null);

    const wPt = toPoints(widthVal);
    const hPt = toPoints(heightVal);

    if (!Number.isFinite(wPt) || !Number.isFinite(hPt) || wPt <= 0 || hPt <= 0) {
      setValidationError(isUr ? 'صفحہ کے ابعاد درست مثبت ہندسے ہونے چاہئیں۔' : 'Page dimensions must be positive finite numbers.');
      return false;
    }

    const minPt = toPoints(unit === 'in' ? 2 : 50); // min 50mm
    const maxPt = toPoints(unit === 'in' ? 40 : 1000); // max 1000mm
    if (wPt < minPt || wPt > maxPt || hPt < minPt || hPt > maxPt) {
      setValidationError(isUr ? `صفحہ سائز ${unit === 'in' ? '2" سے 40"' : '50mm سے 1000mm'} کے درمیان ہونا چاہیے۔` : `Page dimensions must be between 50mm and 1000mm.`);
      return false;
    }

    const mTopPt = toPoints(marginTop);
    const mBotPt = toPoints(marginBottom);
    const mLeftPt = toPoints(marginLeft);
    const mRightPt = toPoints(marginRight);
    const gutterPt = toPoints(gutter);

    if (mTopPt < 0 || mBotPt < 0 || mLeftPt < 0 || mRightPt < 0 || gutterPt < 0) {
      setValidationError(isUr ? 'حواشی اور گٹر منفی نہیں ہو سکتے۔' : 'Margins and gutter cannot be negative.');
      return false;
    }

    const totalHorizontalMargin = mLeftPt + mRightPt + (gutterPosition !== 'top' ? gutterPt : 0);
    const totalVerticalMargin = mTopPt + mBotPt + (gutterPosition === 'top' ? gutterPt : 0);

    const effectiveWidth = orientation === 'landscape' && wPt < hPt ? hPt : (orientation === 'portrait' && wPt > hPt ? hPt : wPt);
    const effectiveHeight = orientation === 'landscape' && wPt < hPt ? wPt : (orientation === 'portrait' && wPt > hPt ? wPt : hPt);

    if (effectiveWidth - totalHorizontalMargin < 20 || effectiveHeight - totalVerticalMargin < 20) {
      setValidationError(isUr ? 'حواشی اور گٹر کا کل سائز قابلِ طباعت رقبہ کو ختم کر رہا ہے۔' : 'Margins and gutter leave insufficient printable area.');
      return false;
    }

    if (bleedTop < 0 || bleedRight < 0 || bleedBottom < 0 || bleedLeft < 0) {
      setValidationError(isUr ? 'بلیڈ (Bleed) منفی نہیں ہو سکتا۔' : 'Bleed values cannot be negative.');
      return false;
    }

    // Check for target objects exceeding printable area
    let targetPageIds: string[] = [];
    if (applyTargetKind === 'current-page') targetPageIds = [activePageId];
    else if (applyTargetKind === 'current-section') targetPageIds = getPagesForSection(doc, activeSection.id);
    else targetPageIds = doc.pageOrder;

    let overflowObjectCount = 0;
    for (const pid of targetPageIds) {
      const page = doc.pages[pid];
      if (!page) continue;
      for (const objId of page.objectOrder) {
        const obj = doc.objects[objId];
        if (!obj) continue;
        if (
          obj.frame.x < mLeftPt ||
          obj.frame.y < mTopPt ||
          obj.frame.x + obj.frame.width > effectiveWidth - mRightPt ||
          obj.frame.y + obj.frame.height > effectiveHeight - mBotPt
        ) {
          overflowObjectCount++;
        }
      }
    }

    if (overflowObjectCount > 0) {
      setOverflowWarning(
        isUr
          ? `تنبانیہ: ${overflowObjectCount} اشیاء ان حواشی یا صفحہ کے ابعاد سے باہر نکل رہی ہیں۔`
          : `Warning: ${overflowObjectCount} object(s) fall outside the proposed printable area.`,
      );
    }

    return true;
  };

  const handleConfirm = () => {
    if (!validate()) return;

    let target: PageLayoutTarget;
    if (applyTargetKind === 'current-page') {
      target = { kind: 'current-page', pageId: activePageId };
    } else if (applyTargetKind === 'current-section') {
      target = { kind: 'current-section', sectionId: activeSection.id };
    } else {
      target = { kind: 'whole-document' };
    }

    onApply(target, {
      width: toPoints(widthVal),
      height: toPoints(heightVal),
      orientation,
      margins: {
        top: toPoints(marginTop),
        right: toPoints(marginRight),
        bottom: toPoints(marginBottom),
        left: toPoints(marginLeft),
      },
      bleed: {
        top: toPoints(bleedTop),
        right: toPoints(bleedRight),
        bottom: toPoints(bleedBottom),
        left: toPoints(bleedLeft),
      },
      background: backgroundColor,
    });

    onClose();
  };

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
        zIndex: 120,
      }}
    >
      <div
        style={{
          width: '560px',
          maxHeight: '90vh',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '20px',
          color: '#f8fafc',
          boxShadow: '0 15px 30px rgba(0,0,0,0.5)',
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          direction: isUr ? 'rtl' : 'ltr',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', color: '#38bdf8', fontWeight: 700 }}>
            📐 {isUr ? 'صفحہ کی ترتیبات (Page Setup)' : 'Page Setup'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Errors & Warnings */}
        {validationError && (
          <div
            style={{
              backgroundColor: '#450a0a',
              border: '1px solid #991b1b',
              color: '#fca5a5',
              padding: '8px 12px',
              borderRadius: '6px',
              marginBottom: '12px',
            }}
          >
            ⚠️ {validationError}
          </div>
        )}
        {overflowWarning && (
          <div
            style={{
              backgroundColor: '#422006',
              border: '1px solid #92400e',
              color: '#fbbf24',
              padding: '8px 12px',
              borderRadius: '6px',
              marginBottom: '12px',
            }}
          >
            ⚠️ {overflowWarning}
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {/* Section 1: Apply To Target */}
          <div style={{ marginBottom: '16px', backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '8px' }}>
            <label style={{ fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              {isUr ? 'اطلاق کریں (Apply to):' : 'Apply to:'}
            </label>
            <select
              value={applyTargetKind}
              onChange={(e) => setApplyTargetKind(e.target.value as any)}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '12px',
              }}
            >
              <option value="current-page">{isUr ? 'موجودہ صفحہ (Current Page Only)' : 'Current Page Only'}</option>
              <option value="current-section">{isUr ? 'موجودہ سیکشن (Current Section)' : 'Current Section'}</option>
              <option value="whole-document">{isUr ? 'پوری دستاویز (Whole Document)' : 'Whole Document'}</option>
            </select>
          </div>

          {/* Section 2: Size & Orientation */}
          <div style={{ marginBottom: '16px', backgroundColor: '#1e293b', padding: '12px 14px', borderRadius: '8px' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8', display: 'block', marginBottom: '8px' }}>
              {isUr ? 'سائز و رخ (Page Size & Orientation)' : 'Page Size & Orientation'}
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>{isUr ? 'سائز کا پیش سیٹ:' : 'Preset Size:'}</label>
                <select
                  value={presetKey}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '6px',
                  }}
                >
                  <option value="a4">A4 (210 × 297 mm)</option>
                  <option value="a5">A5 (148 × 210 mm)</option>
                  <option value="a3">A3 (297 × 420 mm)</option>
                  <option value="letter">Letter (8.5 × 11 in)</option>
                  <option value="legal">Legal (8.5 × 14 in)</option>
                  <option value="book6x9">6 × 9 in Book (152.4 × 228.6 mm)</option>
                  <option value="custom">{isUr ? 'حسبِ ضرورت (Custom)' : 'Custom'}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>{isUr ? 'صفحہ کا رخ:' : 'Orientation:'}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #334155',
                      backgroundColor: orientation === 'portrait' ? '#0284c7' : '#0f172a',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    📄 {isUr ? 'عمودی (Portrait)' : 'Portrait'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #334155',
                      backgroundColor: orientation === 'landscape' ? '#0284c7' : '#0f172a',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    🖼️ {isUr ? 'افقی (Landscape)' : 'Landscape'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>{isUr ? `چوڑائی (${unitLabel}):` : `Width (${unitLabel}):`}</label>
                <input
                  type="number"
                  step="0.1"
                  value={widthVal}
                  onChange={(e) => {
                    setPresetKey('custom');
                    setWidthVal(parseFloat(e.target.value) || 0);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '6px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>{isUr ? `لمبائی (${unitLabel}):` : `Height (${unitLabel}):`}</label>
                <input
                  type="number"
                  step="0.1"
                  value={heightVal}
                  onChange={(e) => {
                    setPresetKey('custom');
                    setHeightVal(parseFloat(e.target.value) || 0);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '6px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Margins & Gutter */}
          <div style={{ marginBottom: '16px', backgroundColor: '#1e293b', padding: '12px 14px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>{isUr ? 'حواشی (Margins & Gutter)' : 'Margins & Gutter'}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#94a3b8' }}>
                <input
                  type="checkbox"
                  checked={useMirrorMargins}
                  onChange={(e) => setUseMirrorMargins(e.target.checked)}
                />
                {isUr ? 'آئینہ دار حواشی (Inside / Outside)' : 'Mirror Margins'}
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '2px' }}>{isUr ? `ऊپر (${unitLabel}):` : `Top (${unitLabel}):`}</label>
                <input
                  type="number"
                  step="0.1"
                  value={marginTop}
                  onChange={(e) => setMarginTop(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '2px' }}>{isUr ? `نیچے (${unitLabel}):` : `Bottom (${unitLabel}):`}</label>
                <input
                  type="number"
                  step="0.1"
                  value={marginBottom}
                  onChange={(e) => setMarginBottom(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '2px' }}>
                  {useMirrorMargins ? (isUr ? `اندرونی (Inside ${unitLabel}):` : `Inside (${unitLabel}):`) : (isUr ? `دائیں (Right ${unitLabel}):` : `Right (${unitLabel}):`)}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={marginRight}
                  onChange={(e) => setMarginRight(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '2px' }}>
                  {useMirrorMargins ? (isUr ? `بیرونی (Outside ${unitLabel}):` : `Outside (${unitLabel}):`) : (isUr ? `بائیں (Left ${unitLabel}):` : `Left (${unitLabel}):`)}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={marginLeft}
                  onChange={(e) => setMarginLeft(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '5px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '2px' }}>{isUr ? `گٹر بائنڈنگ (${unitLabel}):` : `Gutter (${unitLabel}):`}</label>
                <input
                  type="number"
                  step="0.1"
                  value={gutter}
                  onChange={(e) => setGutter(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '2px' }}>{isUr ? 'گٹر کی پوزیشن:' : 'Gutter Position:'}</label>
                <select
                  value={gutterPosition}
                  onChange={(e) => setGutterPosition(e.target.value as any)}
                  style={{ width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '5px' }}
                >
                  <option value="right">{isUr ? 'دائیں (Right - Urdu Book)' : 'Right'}</option>
                  <option value="left">{isUr ? 'بائیں (Left - English Book)' : 'Left'}</option>
                  <option value="top">{isUr ? 'اوپر (Top)' : 'Top'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Bleed & Print Safety */}
          <div style={{ marginBottom: '16px', backgroundColor: '#1e293b', padding: '12px 14px', borderRadius: '8px' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8', display: 'block', marginBottom: '8px' }}>
              {isUr ? 'پرنٹ کی حفاظت (Bleed & Appearance)' : 'Print Safety & Appearance'}
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '10px' }}>Bleed Top</label>
                <input
                  type="number"
                  step="0.1"
                  value={bleedTop}
                  onChange={(e) => setBleedTop(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '4px', fontSize: '11px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '10px' }}>Bleed Right</label>
                <input
                  type="number"
                  step="0.1"
                  value={bleedRight}
                  onChange={(e) => setBleedRight(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '4px', fontSize: '11px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '10px' }}>Bleed Bottom</label>
                <input
                  type="number"
                  step="0.1"
                  value={bleedBottom}
                  onChange={(e) => setBleedBottom(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '4px', fontSize: '11px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '10px' }}>Bleed Left</label>
                <input
                  type="number"
                  step="0.1"
                  value={bleedLeft}
                  onChange={(e) => setBleedLeft(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '4px', fontSize: '11px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ color: '#94a3b8' }}>{isUr ? 'صفحہ کا بیک گراؤنڈ:' : 'Background:'}</label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', width: '28px', height: '24px' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#94a3b8' }}>
                <input
                  type="checkbox"
                  checked={showPrintableArea}
                  onChange={(e) => setShowPrintableArea(e.target.checked)}
                />
                {isUr ? 'پرنٹ ایریا دکھائیں' : 'Show printable area preview'}
              </label>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isUr ? 'منسوخ کریں' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isUr ? 'اطلاق کریں' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
