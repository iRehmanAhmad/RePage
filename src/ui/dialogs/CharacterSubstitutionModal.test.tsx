import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { CharacterSubstitutionModal } from './CharacterSubstitutionModal';

describe('CharacterSubstitutionModal (Phase UX-6)', () => {
  it('renders character substitution dialog when open', () => {
    const doc = createStarterDocument();

    render(
      <CharacterSubstitutionModal
        isOpen={true}
        onClose={vi.fn()}
        document={doc}
        onCommitDocument={vi.fn()}
        lang="ur"
      />,
    );

    expect(screen.getByText(/حروف اور علامات کی اصلاح/i)).toBeInTheDocument();
    expect(screen.getByText(/عربی حروف کی اصلاحات/i)).toBeInTheDocument();
  });
});
