import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { recordRevision } from '../../domain/document/trackChangesEngine';
import { ReviewingPane } from './ReviewingPane';

describe('ReviewingPane (Phase UX-7)', () => {
  it('renders reviewing pane with revisions list when open', () => {
    let doc = createStarterDocument();
    doc = recordRevision(doc, {
      type: 'insert',
      author: 'Tester',
      text: 'تجرباتی ترمیم',
      paragraphIndex: 0,
    });

    render(
      <ReviewingPane
        isOpen={true}
        onClose={vi.fn()}
        document={doc}
        onCommitDocument={vi.fn()}
        lang="ur"
      />,
    );

    expect(screen.getByText(/نظر ثانی پینل/i)).toBeInTheDocument();
    expect(screen.getByText(/تجرباتی ترمیم/i)).toBeInTheDocument();
  });
});
