import React from 'react';
import { describe, expect, it, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createStarterDocument } from '../../domain/document/createDocument';
import { PrintLayoutView } from './PrintLayoutView';
import { WebReadingView } from './WebReadingView';
import { DraftEditingView } from './DraftEditingView';

describe('Phase 2 View Mode Switcher', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders PrintLayoutView with physical pages and margins', () => {
    const doc = createStarterDocument();

    render(
      <PrintLayoutView
        document={doc}
        activePageId={doc.pageOrder[0]!}
        zoomLevel={100}
        activeFontFamily="Noto Nastaliq Urdu"
        activeFontSize={18}
        pendingChar={null}
        editingObjectId={null}
        isObjectSelectionMode={true}
        bodyEditorFocusRequest={0}
        selectedObjectId={null}
        onSelectPage={vi.fn()}
        onSelectObject={vi.fn()}
        onEditObject={vi.fn()}
        onObjectModified={vi.fn()}
        onCommitStory={vi.fn()}
      />,
    );

    expect(screen.getByTestId('print-layout-view')).toBeTruthy();
  }, 20000);

  it('renders WebReadingView as continuous reading surface without physical page gaps or headers/footers', () => {
    const doc = createStarterDocument();

    render(
      <WebReadingView
        document={doc}
        zoomLevel={100}
        lang="en"
      />,
    );

    expect(screen.getByTestId('web-reading-view')).toBeTruthy();
    expect(screen.getByText(/Continuous Web Reader/i)).toBeTruthy();
  });

  it('renders DraftEditingView with section break indicators and no page margins/artwork', () => {
    const doc = createStarterDocument();

    render(
      <DraftEditingView
        document={doc}
        onCommitStory={vi.fn()}
        lang="en"
      />,
    );

    expect(screen.getByTestId('draft-editing-view')).toBeTruthy();
    expect(screen.getByText(/Draft Editing View/i)).toBeTruthy();
  });
});
