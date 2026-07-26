import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { App } from './App';

vi.mock('../ui/canvas/FabricCanvas', () => ({
  FabricCanvas: () => <div data-testid="fabric-canvas-mock" />,
}));

vi.mock('../ui/editor/TextEditorOverlay', () => ({
  TextEditorOverlay: () => <div data-testid="text-editor-overlay-mock" />,
}));

vi.mock('../ui/editor/DocumentBodyEditor', () => ({
  DocumentBodyEditor: () => <div data-testid="document-body-editor-mock" />,
}));

vi.mock('../persistence/autosave/database', () => ({
  getLatestRecovery: vi.fn().mockResolvedValue(null),
  clearRecovery: vi.fn().mockResolvedValue(undefined),
  saveRecovery: vi.fn().mockResolvedValue(undefined),
}));

describe('Streamlined Workspace Layout with MS Word Ribbon & Properties Inspector', () => {
  it('renders File menu button, MS Word Ribbon, centered title, and Properties inspector panel', async () => {
    render(<App />);

    // Header & Brand
    expect(screen.getAllByText('RePage Studio')[0]).toBeInTheDocument();

    // MS Word File Button & Ribbon Tabs
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Insert')).toBeInTheDocument();
    expect(screen.getByText('Urdu Tools')).toBeInTheDocument();

    // MS Word Home Ribbon Group Captions
    expect(screen.getByText('Urdu Input')).toBeInTheDocument();
    expect(screen.getByText('Clipboard')).toBeInTheDocument();
    expect(screen.getByText('Font')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
    expect(screen.getByText('Urdu Styles')).toBeInTheDocument();

    // Right Sidebar Properties Inspector Header
    expect(screen.getByText('⚙ Properties')).toBeInTheDocument();

    // Click File menu button
    fireEvent.click(screen.getByText('File'));

    // Switch Menu Language to Urdu
    const langSelect = screen.getByTitle('Software Menu Language');
    fireEvent.change(langSelect, { target: { value: 'ur' } });

    // Verify translated Urdu tab titles, group captions, and properties inspector header
    expect(screen.getAllByText('فائل (File)')[0]).toBeInTheDocument();
    expect(screen.getByText('ہوم')).toBeInTheDocument();
    expect(screen.getByText('اردو ان پٹ')).toBeInTheDocument();
    expect(screen.getByText('اردو اسٹائلز')).toBeInTheDocument();
    expect(screen.getByText('⚙ خواص')).toBeInTheDocument();
  }, 15000);
});
