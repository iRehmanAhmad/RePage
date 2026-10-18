import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { addTextFrame } from '../../editor/commands/documentCommands';
import { mergePaginatedPageContent, PaginatedPrintLayout } from './PaginatedPrintLayout';

vi.mock('../canvas/FabricCanvas', () => ({
  FabricCanvas: ({ onBlankCanvasClick }: { onBlankCanvasClick?: () => void }) => (
    <button type="button" data-testid="floating-object-canvas" onClick={onBlankCanvasClick}>
      Floating object canvas
    </button>
  ),
}));

vi.mock('./DocumentBodyEditor', () => ({
  DocumentBodyEditor: ({ pageLayout }: { pageLayout?: unknown }) => (
    <div data-testid="document-body-editor" data-paged={pageLayout ? 'true' : 'false'} />
  ),
}));

vi.mock('./TextEditorOverlay', () => ({
  TextEditorOverlay: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="text-box-editor">
      <button type="button" onClick={onClose}>Close text box</button>
    </div>
  ),
}));

describe('PaginatedPrintLayout', () => {
  it('uses one page-aware document editor for normal Print Layout typing', () => {
    const document = createStarterDocument();
    const pageId = document.pageOrder[0]!;

    render(
      <PaginatedPrintLayout
        document={document}
        activePageId={pageId}
        zoomLevel={100}
        activeFontFamily="Noto Nastaliq Urdu"
        activeFontSize={16}
        pendingChar={null}
        editingObjectId={null}
        onSelectPage={vi.fn()}
        onSelectObject={vi.fn()}
        onEditObject={vi.fn()}
        onObjectModified={vi.fn()}
        onCommitStory={vi.fn()}
      />,
    );

    expect(screen.getByTestId('paginated-document-editor')).toBeInTheDocument();
    expect(screen.getByTestId('document-body-editor')).toHaveAttribute('data-paged', 'true');
  });

  it('merges an edited second-page fragment without replacing the surrounding story', () => {
    const firstPage = { type: 'paragraph' as const, direction: 'rtl' as const, content: [{ type: 'text' as const, text: 'Page one' }] };
    const secondPage = { type: 'paragraph' as const, direction: 'rtl' as const, content: [{ type: 'text' as const, text: 'Page two' }] };
    const thirdPage = { type: 'paragraph' as const, direction: 'rtl' as const, content: [{ type: 'text' as const, text: 'Page three' }] };
    const replacement = { type: 'paragraph' as const, direction: 'rtl' as const, content: [{ type: 'text' as const, text: 'Edited page two' }] };

    const result = mergePaginatedPageContent(
      { type: 'doc', content: [firstPage, secondPage, thirdPage] },
      [0, 1, 2],
      1,
      { type: 'doc', content: [replacement] },
    );

    expect(result.content).toEqual([firstPage, replacement, thirdPage]);
  });

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
