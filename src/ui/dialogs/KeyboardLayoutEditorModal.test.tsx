import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { KeyboardLayoutEditorModal } from './KeyboardLayoutEditorModal';

describe('KeyboardLayoutEditorModal (Phase UX-6)', () => {
  it('renders custom keyboard layout editor when open', () => {
    render(
      <KeyboardLayoutEditorModal
        isOpen={true}
        onClose={vi.fn()}
        lang="ur"
      />,
    );

    expect(screen.getByText(/کسٹم کی بورڈ لے آؤٹ ایڈیٹر/i)).toBeInTheDocument();
    expect(screen.getByText(/لے آؤٹ محفوظ کریں/i)).toBeInTheDocument();
  });
});
