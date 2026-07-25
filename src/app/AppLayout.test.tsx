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

describe('App Studio Layout with MS Word Ribbon & Theme Engine', () => {
  it('renders MS Word ribbon tabs in English by default and toggles to Urdu', async () => {
    render(<App />);

    // Header & Brand
    expect(await screen.findByText('RePage Studio')).toBeInTheDocument();

    // Default English MS Word Ribbon Tabs
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Insert')).toBeInTheDocument();
    expect(screen.getByText('Urdu Tools')).toBeInTheDocument();
    expect(screen.getByText('Page Layout')).toBeInTheDocument();
    expect(screen.getByText('Collaboration')).toBeInTheDocument();
    expect(screen.getByText('Export & View')).toBeInTheDocument();

    // Switch Ribbon Tab to Insert
    fireEvent.click(screen.getByText('Insert'));
    expect(screen.getByText('+ Footnote')).toBeInTheDocument();

    // Switch Menu Language to Urdu
    const langSelect = screen.getByTitle('Software Menu Language');
    fireEvent.change(langSelect, { target: { value: 'ur' } });

    // Verify translated Urdu tab titles
    expect(screen.getByText('اہم')).toBeInTheDocument();
    expect(screen.getByText('درج کریں')).toBeInTheDocument();
    expect(screen.getByText('اردو آلات')).toBeInTheDocument();
  });
});
