import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AccessibilitySettingsModal } from './AccessibilitySettingsModal';

describe('AccessibilitySettingsModal (Phase UX-8)', () => {
  it('renders accessibility settings dialog when open', () => {
    render(
      <AccessibilitySettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onApplySettings={vi.fn()}
        lang="ur"
      />,
    );

    expect(screen.getByText(/رسائی اور کسٹمائزیشن/i)).toBeInTheDocument();
    expect(screen.getByText(/ترتیبات محفوظ کریں/i)).toBeInTheDocument();
  });
});
