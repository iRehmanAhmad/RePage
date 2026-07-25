import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TextEditorOverlay } from './TextEditorOverlay';

if (typeof window !== 'undefined') {
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  }
  if (!Element.prototype.getClientRects) {
    Element.prototype.getClientRects = () => [] as unknown as DOMRectList;
  }
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () => ({
      x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON: () => {},
    } as DOMRect);
  }
  if (!Element.prototype.getBoundingClientRect) {
    Element.prototype.getBoundingClientRect = () => ({
      x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON: () => {},
    } as DOMRect);
  }
}
import type { Rect, TextStory } from '../../domain/document/types';
import { paragraph } from '../../domain/rich-text/types';

describe('TextEditorOverlay', () => {
  const sampleFrame: Rect = { x: 100, y: 100, width: 300, height: 150, rotation: 0 };
  const sampleStory: TextStory = {
    id: 'story_1',
    name: 'Test Story',
    content: {
      type: 'doc',
      content: [paragraph('اردو ٹیسٹ متن')],
    },
  };

  it('renders Tiptap editor overlay with Urdu title and close button', () => {
    const handleCommit = vi.fn();
    const handleClose = vi.fn();

    render(
      <TextEditorOverlay
        frame={sampleFrame}
        story={sampleStory}
        onCommit={handleCommit}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('اردو متن ایڈیٹر (Text Editor Overlay)')).toBeInTheDocument();
    expect(screen.getByText('✕ بند کریں')).toBeInTheDocument();
  });
});
