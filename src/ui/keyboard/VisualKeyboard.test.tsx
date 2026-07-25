import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { VisualKeyboard } from './VisualKeyboard';

describe('VisualKeyboard Component with Compact Single-Row Controls & Minimize Toggle', () => {
  it('renders consolidated top row controls, special marks, centered spacebar, and minimize toggle', () => {
    const handleInsert = vi.fn();
    const handleModeChange = vi.fn();

    render(
      <VisualKeyboard mode="crulp" onModeChange={handleModeChange} onInsertChar={handleInsert} />,
    );

    // Header & Mode Selector
    expect(screen.getByText(/اردو کی بورڈ/)).toBeInTheDocument();

    // Special marks in top row
    expect(screen.getByText('ZWNJ')).toBeInTheDocument();
    expect(screen.getByText('ZWJ')).toBeInTheDocument();

    // Centered Spacebar
    const spacebar = screen.getByText('Space (وقفہ)');
    expect(spacebar).toBeInTheDocument();
    fireEvent.click(spacebar);
    expect(handleInsert).toHaveBeenCalledWith(' ');

    // Minimize toggle
    const toggleBtn = screen.getByText('Minimize Keyboard ▼');
    expect(toggleBtn).toBeInTheDocument();

    // Minimize keyboard
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Expand Keyboard ▲')).toBeInTheDocument();
    expect(screen.queryByText('Space (وقفہ)')).not.toBeInTheDocument();
  });
});
