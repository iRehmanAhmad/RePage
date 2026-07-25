import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ShareDialogModal } from './ShareDialogModal';

describe('ShareDialogModal (Phase UX-7)', () => {
  it('renders share dialog modal when open', () => {
    render(
      <ShareDialogModal
        isOpen={true}
        onClose={vi.fn()}
        documentTitle="Urdu Novel"
        lang="ur"
      />,
    );

    expect(screen.getByText(/دستاویز شیئر کریں/i)).toBeInTheDocument();
    expect(screen.getByText(/ایڈیٹر/i)).toBeInTheDocument();
  });
});
