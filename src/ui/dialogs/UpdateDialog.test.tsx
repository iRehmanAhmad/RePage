import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { UpdateDialog } from './UpdateDialog';
import { DICTIONARY } from '../i18n/menuTranslation';

describe('UpdateDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<UpdateDialog isOpen={false} onClose={vi.fn()} lang="en" />);
    expect(container.firstChild).toBeNull();
  });

  it('honestly reports desktop-only updates in a plain browser (en)', async () => {
    render(<UpdateDialog isOpen onClose={vi.fn()} lang="en" />);
    expect(screen.getByText(DICTIONARY.en.updTitle)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(DICTIONARY.en.updDesktopOnly)).toBeInTheDocument(),
    );
  });

  it('honestly reports desktop-only updates in a plain browser (ur)', async () => {
    render(<UpdateDialog isOpen onClose={vi.fn()} lang="ur" />);
    expect(screen.getByText(DICTIONARY.ur.updTitle)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(DICTIONARY.ur.updDesktopOnly)).toBeInTheDocument(),
    );
  });
});
