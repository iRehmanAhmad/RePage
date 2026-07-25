import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('../ui/canvas/FabricCanvas', () => ({
  FabricCanvas: () => <div data-testid="fabric-canvas-mock" />,
}));

vi.mock('../persistence/autosave/database', () => ({
  getLatestRecovery: vi.fn().mockResolvedValue(null),
  clearRecovery: vi.fn().mockResolvedValue(undefined),
  saveRecovery: vi.fn().mockResolvedValue(undefined),
}));

describe('App Studio Layout', () => {
  it('renders flagship studio header, ribbon bar, page sidebar, and right inspector dock', async () => {
    render(<App />);

    // Header & Brand
    expect(await screen.findByText('RePage Studio')).toBeInTheDocument();
    expect(screen.getByText('Urdu Publishing 1.0')).toBeInTheDocument();

    // Studio Ribbon Tools
    expect(screen.getByTitle('انتخاب آلہ (Select Tool)')).toBeInTheDocument();
    expect(screen.getByTitle('متن فریم (Text Frame Tool)')).toBeInTheDocument();

    // Page Sidebar
    expect(screen.getByText('+ نیا صفحہ')).toBeInTheDocument();
    expect(screen.getByText('صفحہ نمبر 1')).toBeInTheDocument();

    // Inspector Tabs
    expect(screen.getByText('خواص (Props)')).toBeInTheDocument();
    expect(screen.getByText('خطاطی (Type)')).toBeInTheDocument();
    expect(screen.getByText('آلات (Tools)')).toBeInTheDocument();
    expect(screen.getByText('حواشی/برآمد')).toBeInTheDocument();
  });
});
