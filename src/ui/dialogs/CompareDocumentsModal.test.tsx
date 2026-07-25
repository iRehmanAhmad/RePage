import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { CompareDocumentsModal } from './CompareDocumentsModal';

describe('CompareDocumentsModal (Phase UX-7)', () => {
  it('renders compare documents dialog when open', () => {
    const doc = createStarterDocument();

    render(
      <CompareDocumentsModal
        isOpen={true}
        onClose={vi.fn()}
        document={doc}
        onCommitDocument={vi.fn()}
        lang="ur"
      />,
    );

    expect(screen.getByText(/دستاویزات کا موازنہ/i)).toBeInTheDocument();
    expect(screen.getByText(/موازنہ شروع کریں/i)).toBeInTheDocument();
  });
});
