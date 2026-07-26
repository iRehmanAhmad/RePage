import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import { MsWordRibbon } from '../ui/ribbon/MsWordRibbon';
import { LanguageToolsPanel } from '../ui/language/LanguageToolsPanel';
import { VisualKeyboard } from '../ui/keyboard/VisualKeyboard';
import { DICTIONARY } from '../ui/i18n/menuTranslation';

describe('Urdu Tools Phase 6 — Accessibility & Ribbon Organization', () => {
  it('1. MsWordRibbon renders Urdu Tools toolbar with ARIA roles and 4 structured groups', () => {
    render(
      <MsWordRibbon
        activeTab="urdu-tools"
        onTabChange={vi.fn()}
        activeTool="select"
        onSelectTool={vi.fn()}
        lang="ur"
        t={DICTIONARY.ur}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        canUndo={false}
        canRedo={false}
        onOpenDocument={vi.fn()}
        onSaveDocument={vi.fn()}
        onSaveAsDocument={vi.fn()}
        onShowRecentFiles={vi.fn()}
        activeFontFamily="Noto Nastaliq Urdu"
        onFontFamilyChange={vi.fn()}
        activeFontSize={16}
        onFontSizeChange={vi.fn()}
        isKashidaEnabled={true}
        onToggleKashida={vi.fn()}
        activeAlignment="start"
        onAlignmentChange={vi.fn()}
        onAddPage={vi.fn()}
        onRemovePage={vi.fn()}
        onAddFootnote={vi.fn()}
        onAddEndnote={vi.fn()}
        onOpenLanguageTools={vi.fn()}
        onOpenCharacterSubstitution={vi.fn()}
        onOpenKeyboardEditor={vi.fn()}
        onOpenOcr={vi.fn()}
        onExportPdf={vi.fn()}
        onExportEpub={vi.fn()}
        onRunPreflight={vi.fn()}
        onToggleCollab={vi.fn()}
        onOpenFileBackstage={vi.fn()}
      />,
    );

    const toolbar = screen.getByRole('toolbar', { name: /Urdu Authoring Tools Toolbar/i });
    expect(toolbar).toBeInTheDocument();

    const regions = screen.getAllByRole('region');
    expect(regions.length).toBeGreaterThanOrEqual(4);
  });

  it('2. LanguageToolsPanel renders ARIA tablist and tab roles', () => {
    const doc = createStarterDocument();

    render(
      <LanguageToolsPanel
        document={doc}
        initialTab="proofread"
        onClose={vi.fn()}
      />,
    );

    const tablist = screen.getByRole('tablist', { name: /Language Tools Tabs/i });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(4);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('3. VisualKeyboard buttons have explicit title and key mappings', () => {
    render(
      <VisualKeyboard
        mode="crulp"
        onModeChange={vi.fn()}
        onInsertChar={vi.fn()}
      />,
    );

    expect(screen.getByText(/Space \(وقفہ\)/i)).toBeInTheDocument();
  });
});
