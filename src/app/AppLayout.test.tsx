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
  it('renders MS Word ribbon tabs, theme dropdown, and language selector', async () => {
    render(<App />);

    // Header & Brand
    expect(await screen.findByText('RePage Studio')).toBeInTheDocument();

    // MS Word Ribbon Tabs
    expect(screen.getByText('اہم (Home)')).toBeInTheDocument();
    expect(screen.getByText('درج کریں (Insert)')).toBeInTheDocument();
    expect(screen.getByText('اردو آلات (Urdu Tools)')).toBeInTheDocument();
    expect(screen.getByText('صفحہ بندی (Layout)')).toBeInTheDocument();
    expect(screen.getByText('باہمی تعاون (Collab)')).toBeInTheDocument();
    expect(screen.getByText('برآمد و منظر (Export)')).toBeInTheDocument();

    // Switch Ribbon Tab to Insert
    fireEvent.click(screen.getByText('درج کریں (Insert)'));
    expect(screen.getByText('+ ذیلی حاشیہ')).toBeInTheDocument();

    // Switch Menu Language to English
    const langSelect = screen.getByTitle('Software Menu Language');
    fireEvent.change(langSelect, { target: { value: 'en' } });

    // Verify translated tab titles
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Insert')).toBeInTheDocument();
    expect(screen.getByText('Urdu Tools')).toBeInTheDocument();
  });
});
