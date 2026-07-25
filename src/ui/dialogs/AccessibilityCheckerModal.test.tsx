import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { AccessibilityCheckerModal } from './AccessibilityCheckerModal';

describe('AccessibilityCheckerModal (Phase UX-8)', () => {
  it('renders accessibility checker dialog when open', () => {
    const doc = createStarterDocument();

    render(
      <AccessibilityCheckerModal
        isOpen={true}
        onClose={vi.fn()}
        document={doc}
        lang="ur"
      />,
    );

    expect(screen.getByText(/رسائی چیکر/i)).toBeInTheDocument();
  });
});
