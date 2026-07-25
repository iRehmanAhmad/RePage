import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { App } from './App';

vi.mock('../ui/canvas/FabricCanvas', () => ({
  FabricCanvas: () => <div data-testid="fabric-canvas-mock" />,
}));

vi.mock('../persistence/autosave/database', () => ({
  getLatestRecovery: vi.fn().mockResolvedValue(null),
  clearRecovery: vi.fn().mockResolvedValue(undefined),
  saveRecovery: vi.fn().mockResolvedValue(undefined),
}));

describe('App Studio Layout with MS Word Ribbon Group Cards & Captions', () => {
  it('renders File menu button, MS Word Ribbon group cards, and captions', async () => {
    render(<App />);

    // Header & Brand
    expect(await screen.findByText('RePage Studio')).toBeInTheDocument();

    // MS Word File Button & Tabs
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Insert')).toBeInTheDocument();
    expect(screen.getByText('Urdu Tools')).toBeInTheDocument();

    // MS Word Home Ribbon Group Captions
    expect(screen.getByText('Clipboard')).toBeInTheDocument();
    expect(screen.getByText('Font')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
    expect(screen.getAllByText('Tools')[0]).toBeInTheDocument();

    // Click File menu button
    fireEvent.click(screen.getByText('File'));

    // Switch Menu Language to Urdu
    const langSelect = screen.getByTitle('Software Menu Language');
    fireEvent.change(langSelect, { target: { value: 'ur' } });

    // Verify translated Urdu tab titles & group captions
    expect(screen.getByText('فائل (File)')).toBeInTheDocument();
    expect(screen.getByText('اہم')).toBeInTheDocument();
  });
});
