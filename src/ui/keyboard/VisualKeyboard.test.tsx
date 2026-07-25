import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { VisualKeyboard } from './VisualKeyboard';

describe('VisualKeyboard Component with 3 QWERTY Rows & Dynamic Mode Resolver', () => {
  it('renders 3 QWERTY rows, dual keycap hints, and toggles shift', () => {
    const handleInsert = vi.fn();
    const handleModeChange = vi.fn();

    render(
      <VisualKeyboard mode="crulp" onModeChange={handleModeChange} onInsertChar={handleInsert} />,
    );

    // Header & Mode Selector
    expect(screen.getByText(/اردو کی بورڈ/)).toBeInTheDocument();

    // Verify key 'A' renders Latin label 'a' and Urdu character 'ا'
    const keyA = screen.getByTitle("Key 'A' ➔ ا");
    expect(keyA).toBeInTheDocument();

    // Click Key 'A'
    fireEvent.click(keyA);
    expect(handleInsert).toHaveBeenCalledWith('ا');

    // Toggle Shift ON
    const shiftBtn = screen.getByText('Shift OFF ▼');
    fireEvent.click(shiftBtn);

    // Verify Key 'A' with Shift ON renders 'آ'
    const keyAWithShift = screen.getByTitle("Key 'A' ➔ آ");
    expect(keyAWithShift).toBeInTheDocument();

    // Click Key 'A' with Shift ON
    fireEvent.click(keyAWithShift);
    expect(handleInsert).toHaveBeenCalledWith('آ');
  });

  it('updates layout mapping when switching mode to Navees or English', () => {
    const handleInsert = vi.fn();
    const handleModeChange = vi.fn();

    const { rerender } = render(
      <VisualKeyboard mode="crulp" onModeChange={handleModeChange} onInsertChar={handleInsert} />,
    );

    // CRULP layout key 'E' shift is 'ۓ'
    const shiftBtn = screen.getByText('Shift OFF ▼');
    fireEvent.click(shiftBtn);
    expect(screen.getByTitle("Key 'E' ➔ ۓ")).toBeInTheDocument();

    // Rerender with Navees mode where Shift+E is 'ٍ'
    rerender(
      <VisualKeyboard mode="navees" onModeChange={handleModeChange} onInsertChar={handleInsert} />,
    );
    expect(screen.getByTitle("Key 'E' ➔ ٍ")).toBeInTheDocument();

    // Rerender with English mode where key 'E' is 'E'
    rerender(
      <VisualKeyboard mode="english" onModeChange={handleModeChange} onInsertChar={handleInsert} />,
    );
    expect(screen.getByTitle("Key 'E' ➔ E")).toBeInTheDocument();
  });
});
