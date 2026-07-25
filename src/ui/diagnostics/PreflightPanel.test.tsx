import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PreflightPanel } from './PreflightPanel';
import type { PreflightResult } from '../../domain/diagnostics/preflightEngine';

afterEach(() => {
  cleanup();
});

describe('PreflightPanel (M3.6)', () => {
  it('renders preflight summary badge and list of issues', () => {
    const mockResult: PreflightResult = {
      passed: false,
      errorCount: 1,
      warningCount: 1,
      infoCount: 0,
      issues: [
        {
          id: '1',
          severity: 'error',
          category: 'image',
          message: 'تصویری ایسٹ غائب ہے',
        },
        {
          id: '2',
          severity: 'warning',
          category: 'text-overflow',
          message: 'ٹیکسٹ فریم میں متن زیادہ ہے',
        },
      ],
    };

    render(<PreflightPanel result={mockResult} />);

    expect(screen.getByTestId('preflight-panel')).toBeDefined();
    expect(screen.getByText(/پری فلائٹ رپورٹ/i)).toBeDefined();
    expect(screen.getByText(/تصویری ایسٹ غائب ہے/i)).toBeDefined();
    expect(screen.getByText(/ٹیکسٹ فریم میں متن زیادہ ہے/i)).toBeDefined();
  });
});
