import React from 'react';
import { pointsToMillimetres } from '../../domain/geometry/units';
import type { Page } from '../../domain/document/types';

export interface DocumentRulersProps {
  page: Page;
  scale?: number;
  unit?: 'pt' | 'mm' | 'in';
  _unit?: 'pt' | 'mm' | 'in';
  onMarginChange?: (newMargins: { top: number; right: number; bottom: number; left: number }) => void;
  _onMarginChange?: (newMargins: { top: number; right: number; bottom: number; left: number }) => void;
}

export function DocumentRulers({
  page,
  scale = 1,
  _unit = 'mm',
  _onMarginChange,
}: DocumentRulersProps) {
  if (!page || !page.margins) return null;
  const widthMm = Math.round(pointsToMillimetres(page.width));
  const leftMarginMm = Math.round(pointsToMillimetres(page.margins.left));
  const rightMarginMm = Math.round(pointsToMillimetres(page.margins.right));

  // Generate tick marks across width
  const ticks = [];
  const stepMm = 10;
  for (let mm = 0; mm <= widthMm; mm += stepMm) {
    ticks.push(mm);
  }

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '6px' }}>
      {/* Top Horizontal Ruler */}
      <div
        style={{
          width: `${page.width * scale}pt`,
          height: '24px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          borderRadius: '4px 4px 0 0',
          position: 'relative',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {/* Left Margin Shade */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${page.margins.left * scale}pt`,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRight: '2px solid #38bdf8',
          }}
          title={`Left Margin: ${leftMarginMm} mm`}
        />

        {/* Right Margin Shade */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: `${page.margins.right * scale}pt`,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderLeft: '2px solid #38bdf8',
          }}
          title={`Right Margin: ${rightMarginMm} mm`}
        />

        {/* Tick Marks & Measurement Numbers */}
        {ticks.map((val) => {
          const posPercent = (val / widthMm) * 100;
          return (
            <div
              key={val}
              style={{
                position: 'absolute',
                left: `${posPercent}%`,
                top: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{ height: '8px', width: '1px', backgroundColor: '#64748b' }} />
              <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
