import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { VisualKeyboard } from './VisualKeyboard';

afterEach(() => {
  cleanup();
});

describe('VisualKeyboard', () => {
  it('renders Urdu visual keyboard with mode selector and shift toggle', () => {
    const handleModeChange = vi.fn();
    const handleInsertChar = vi.fn();

    render(
      <VisualKeyboard
        mode="crulp"
        onModeChange={handleModeChange}
        onInsertChar={handleInsertChar}
      />
    );

    expect(screen.getByText('اردو کی بورڈ (Keyboard Mode):')).toBeInTheDocument();
    expect(screen.getByText('ZWNJ')).toBeInTheDocument();
    expect(screen.getByText('RLM')).toBeInTheDocument();
  });

  it('triggers char insertion when a key or special character is clicked', () => {
    const handleModeChange = vi.fn();
    const handleInsertChar = vi.fn();

    render(
      <VisualKeyboard
        mode="crulp"
        onModeChange={handleModeChange}
        onInsertChar={handleInsertChar}
      />
    );

    const aKeyBtn = screen.getByTitle("Key 'A'");
    fireEvent.click(aKeyBtn);
    expect(handleInsertChar).toHaveBeenCalledWith('ا');
  });
});
