import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ReadAloudToolbar } from './ReadAloudToolbar';

describe('ReadAloudToolbar (Phase UX-8)', () => {
  it('renders read aloud floating player when open', () => {
    render(
      <ReadAloudToolbar
        isOpen={true}
        onClose={vi.fn()}
        textToRead="یہ اردو متن کی تلاوت ہے"
        lang="ur"
      />,
    );

    expect(screen.getByText(/متن کی پڑھائی/i)).toBeInTheDocument();
    expect(screen.getByText(/Play/i)).toBeInTheDocument();
  });
});
