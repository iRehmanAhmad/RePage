import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { DocumentStatsModal } from './DocumentStatsModal';

describe('DocumentStatsModal (Phase UX-5)', () => {
  it('renders document statistics when open', () => {
    const doc = createStarterDocument();

    render(
      <DocumentStatsModal
        isOpen={true}
        onClose={vi.fn()}
        document={doc}
        lang="ur"
      />,
    );

    expect(screen.getByText(/دستاویز کے شماریات/i)).toBeInTheDocument();
    expect(screen.getByText(/صفحات/i)).toBeInTheDocument();
    expect(screen.getByText(/الفاظ/i)).toBeInTheDocument();
  });
});
