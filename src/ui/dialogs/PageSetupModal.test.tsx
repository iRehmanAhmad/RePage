import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageSetupModal } from './PageSetupModal';
import { createStarterDocument } from '../../domain/document/createDocument';

describe('PageSetupModal Component', () => {
  it('renders PageSetupModal fields when open', () => {
    const doc = createStarterDocument();
    const activePageId = doc.pageOrder[0]!;

    render(
      <PageSetupModal
        isOpen={true}
        onClose={vi.fn()}
        document={doc}
        activePageId={activePageId}
        lang="en"
        onApply={vi.fn()}
      />,
    );

    expect(screen.getByText(/Page Setup/i)).toBeDefined();
    expect(screen.getByText(/Apply to:/i)).toBeDefined();
    expect(screen.getByText(/Page Size & Orientation/i)).toBeDefined();
    expect(screen.getByText(/Margins & Gutter/i)).toBeDefined();
  });

  it('triggers onApply with valid setup when Apply button is clicked', () => {
    const doc = createStarterDocument();
    const activePageId = doc.pageOrder[0]!;
    const handleApply = vi.fn();

    render(
      <PageSetupModal
        isOpen={true}
        onClose={vi.fn()}
        document={doc}
        activePageId={activePageId}
        lang="en"
        onApply={handleApply}
      />,
    );

    const applyButtons = screen.getAllByRole('button', { name: 'Apply' });
    const applyButton = applyButtons[applyButtons.length - 1]!;
    fireEvent.click(applyButton);

    expect(handleApply).toHaveBeenCalledTimes(1);
    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'current-section' }),
      expect.objectContaining({
        width: expect.any(Number),
        height: expect.any(Number),
        margins: expect.any(Object),
      }),
    );
  });
});
