import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { VersionHistoryModal } from './VersionHistoryModal';

describe('VersionHistoryModal (Phase UX-7)', () => {
  it('renders version history dialog when open', () => {
    const doc = createStarterDocument();

    render(
      <VersionHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        document={doc}
        onRestoreSnapshot={vi.fn()}
        lang="ur"
      />,
    );

    expect(screen.getByText(/ورژن ہسٹری/i)).toBeInTheDocument();
    expect(screen.getByText(/موجودہ نسخہ محفوظ کریں/i)).toBeInTheDocument();
  });
});
