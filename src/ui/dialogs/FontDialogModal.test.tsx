import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FontDialogModal } from './FontDialogModal';

describe('FontDialogModal', () => {
  it('renders MS Word Font dialog when open and triggers onApply', () => {
    const handleApply = vi.fn();
    const handleClose = vi.fn();

    render(
      <FontDialogModal
        isOpen={true}
        currentProps={{
          fontFamily: 'Noto Nastaliq Urdu',
          fontSize: 24,
          color: '#172119',
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isStrikethrough: false,
          isSubscript: false,
          isSuperscript: false,
        }}
        onApply={handleApply}
        onClose={handleClose}
      />,
    );

    expect(screen.getByText('Font Formatting')).toBeTruthy();
    expect(screen.getByText('Advanced Character Spacing')).toBeTruthy();

    const okButton = screen.getByText('OK');
    fireEvent.click(okButton);

    expect(handleApply).toHaveBeenCalled();
  });
});
