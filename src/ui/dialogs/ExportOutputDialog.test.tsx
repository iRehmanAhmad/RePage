import React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { createStarterDocument } from '../../domain/document/createDocument';
import { ExportOutputDialog } from './ExportOutputDialog';

describe('ExportOutputDialog Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders output format selection and honest capabilities', () => {
    const doc = createStarterDocument();
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ExportOutputDialog
        isOpen={true}
        onClose={handleClose}
        document={doc}
        activePageId={doc.pageOrder[0]!}
        onConfirmExport={handleConfirm}
        lang="en"
      />,
    );

    expect(screen.getByText(/Export & Print Output Setup/i)).toBeTruthy();
    expect(screen.getByText(/Opens your browser\/system print dialog/i)).toBeTruthy();
  });

  it('validates page range and disables export button on invalid custom page range', () => {
    const doc = createStarterDocument();
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ExportOutputDialog
        isOpen={true}
        onClose={handleClose}
        document={doc}
        activePageId={doc.pageOrder[0]!}
        onConfirmExport={handleConfirm}
        lang="en"
      />,
    );

    // Select Custom Range
    const customRadio = screen.getByRole('radio', { name: /Custom Range/i });
    fireEvent.click(customRadio);

    // Set invalid range (from 2 to 1)
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0]!, { target: { value: '2' } });
    fireEvent.change(inputs[1]!, { target: { value: '1' } });

    expect(screen.getByText(/Start page \(2\) cannot exceed end page \(1\)/i)).toBeTruthy();
    const confirmButton = screen.getByTestId('confirm-export-button');
    expect(confirmButton.hasAttribute('disabled')).toBe(true);
  });

  it('triggers onConfirmExport with valid options when Browser Print is selected', () => {
    const doc = createStarterDocument();
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ExportOutputDialog
        isOpen={true}
        onClose={handleClose}
        document={doc}
        activePageId={doc.pageOrder[0]!}
        onConfirmExport={handleConfirm}
        lang="en"
      />,
    );

    const confirmButton = screen.getByTestId('confirm-export-button');
    expect(confirmButton.hasAttribute('disabled')).toBe(false);
    fireEvent.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'browser-print',
        pageRange: { kind: 'all' },
      }),
    );
  });
});
