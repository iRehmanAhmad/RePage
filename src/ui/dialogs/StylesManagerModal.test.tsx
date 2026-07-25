import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { StylesManagerModal } from './StylesManagerModal';

describe('StylesManagerModal (Phase UX-5)', () => {
  it('renders styles manager modal when open', () => {
    const doc = createStarterDocument();

    render(
      <StylesManagerModal
        isOpen={true}
        onClose={vi.fn()}
        document={doc}
        lang="ur"
      />,
    );

    expect(screen.getByText(/اسٹائلز منیجر/i)).toBeInTheDocument();
    expect(screen.getByText(/Heading 1/i)).toBeInTheDocument();
  });
});
