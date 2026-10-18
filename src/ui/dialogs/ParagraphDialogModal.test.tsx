import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ParagraphDialogModal } from './ParagraphDialogModal';
import { DICTIONARY } from '../i18n/menuTranslation';

describe('ParagraphDialogModal', () => {
  it('renders MS Word Paragraph dialog when open and triggers onApply', () => {
    const handleApply = vi.fn();
    const handleClose = vi.fn();

    render(
      <ParagraphDialogModal
        isOpen={true}
        currentProps={{
          alignment: 'start',
          direction: 'rtl',
          lineHeight: 1.5,
          spaceBefore: 0,
          spaceAfter: 6,
          indentLevel: 0,
          firstLineIndent: 0,
        }}
        onApply={handleApply}
        onClose={handleClose}
        t={DICTIONARY.en}
      />,
    );

    expect(screen.getByText('Paragraph Formatting')).toBeTruthy();
    expect(screen.getByText('Indents and Spacing')).toBeTruthy();
    expect(screen.getByText('Line and Page Breaks')).toBeTruthy();

    const okButton = screen.getByText('OK');
    fireEvent.click(okButton);

    expect(handleApply).toHaveBeenCalled();
  });
});
