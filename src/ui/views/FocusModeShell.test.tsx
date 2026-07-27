import React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { createStarterDocument } from '../../domain/document/createDocument';
import { FocusModeShell } from './FocusModeShell';

describe('FocusModeShell Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders FocusModeShell overlay when active', () => {
    const doc = createStarterDocument();
    const handleExit = vi.fn();

    render(
      <FocusModeShell
        isActive={true}
        onExit={handleExit}
        document={doc}
        activePageId={doc.pageOrder[0]!}
        onSelectPage={vi.fn()}
        lang="en"
      >
        <div>Focused Content Test</div>
      </FocusModeShell>,
    );

    expect(screen.getByTestId('focus-mode-shell')).toBeTruthy();
    expect(screen.getByText('Focused Content Test')).toBeTruthy();
  });

  it('triggers onExit when ESC key is pressed', () => {
    const doc = createStarterDocument();
    const handleExit = vi.fn();

    render(
      <FocusModeShell
        isActive={true}
        onExit={handleExit}
        document={doc}
        activePageId={doc.pageOrder[0]!}
        onSelectPage={vi.fn()}
        lang="en"
      >
        <div>Content</div>
      </FocusModeShell>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleExit).toHaveBeenCalledTimes(1);
  });
});
