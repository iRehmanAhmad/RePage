import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { addRectangle } from '../../editor/commands/documentCommands';
import { SelectionPane } from './SelectionPane';

describe('SelectionPane (Phase UX-4)', () => {
  it('renders selection pane layers and action buttons when open', () => {
    let doc = createStarterDocument();
    const pageId = doc.pageOrder[0]!;
    doc = addRectangle(doc, pageId);

    const onSelectObject = vi.fn();
    const onToggleVisibility = vi.fn();
    const onToggleLock = vi.fn();
    const onReorderObject = vi.fn();
    const onClose = vi.fn();

    render(
      <SelectionPane
        isOpen={true}
        onClose={onClose}
        document={doc}
        activePageId={pageId}
        selectedObjectId={doc.pages[pageId]!.objectOrder[0]!}
        onSelectObject={onSelectObject}
        onToggleVisibility={onToggleVisibility}
        onToggleLock={onToggleLock}
        onReorderObject={onReorderObject}
      />,
    );

    expect(screen.getByText(/Selection & Layers/i)).toBeInTheDocument();
    expect(screen.getByTitle('Bring to Front')).toBeInTheDocument();
  });
});
