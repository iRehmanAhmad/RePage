import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { addTextFrame } from '../../editor/commands/documentCommands';
import { PaginatedPrintLayout } from './PaginatedPrintLayout';

vi.mock('../canvas/FabricCanvas', () => ({
  FabricCanvas: ({ onBlankCanvasClick }: { onBlankCanvasClick?: () => void }) => (
    <button type="button" data-testid="floating-object-canvas" onClick={onBlankCanvasClick}>
      Floating object canvas
    </button>
  ),
}));

vi.mock('./DocumentBodyEditor', () => ({
  DocumentBodyEditor: () => <div data-testid="document-body-editor" />,
}));

vi.mock('./TextEditorOverlay', () => ({
  TextEditorOverlay: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="text-box-editor">
      <button type="button" onClick={onClose}>Close text box</button>
    </div>
  ),
}));

describe('PaginatedPrintLayout', () => {
  it('renders the text-box editor in Print Layout and forwards blank canvas clicks to the document body', () => {
    const baseDocument = createStarterDocument();
    const pageId = baseDocument.pageOrder[0]!;
    const document = addTextFrame(baseDocument, pageId);
    const textBoxId = document.pages[pageId]!.objectOrder[0]!;
    const onRequestBodyFocus = vi.fn();
    const onEditObject = vi.fn();

    render(
      <PaginatedPrintLayout
        document={document}
        activePageId={pageId}
        zoomLevel={100}
        activeFontFamily="Noto Nastaliq Urdu"
        activeFontSize={16}
        pendingChar={null}
        editingObjectId={textBoxId}
        onSelectPage={vi.fn()}
        onSelectObject={vi.fn()}
        onEditObject={onEditObject}
        onObjectModified={vi.fn()}
        onCommitStory={vi.fn()}
        onRequestBodyFocus={onRequestBodyFocus}
      />,
    );

    expect(screen.getByTestId('text-box-editor')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('floating-object-canvas'));
    expect(onRequestBodyFocus).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Close text box' }));
    expect(onEditObject).toHaveBeenCalledWith(null);
  });
});
