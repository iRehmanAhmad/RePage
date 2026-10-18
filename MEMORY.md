# Project Memory

Last reviewed: 2026-10-18 (repository inactive since 2026-07-27; status below reflects the July state and a 2026-10-18 code audit)

## Mission

Build a modern, easy-to-use, offline-first, cross-platform Urdu desktop-publishing application that can become a credible alternative to InPage.

## Product decisions

- The product name is **RePage**.
- **Product Direction**: Word-style Urdu word processor first, InPage-style professional layout second. Blank documents open with immediate document body typing; text boxes are inserted deliberately for floating text.
- Desktop publishing on Windows, macOS, and Linux is the primary target.
- A shared browser core is desirable; Tauri is the intended desktop shell after the core architecture stabilizes.
- Local editing, saving, autosave, recovery, and export must work without an account or internet connection.
- Collaboration is optional and comes after reliable local publishing.
- Voice and AI features are optional plugins, not dependencies for basic layout and editing.
- **Current Milestone**: Page Layout & Section Model Architecture — claimed complete (Phases 0–8) in July 2026; not re-verified since. 2026-10-18 code audit found the Tauri desktop shell, PDF exporter, and WebRTC networking listed as complete are in fact stubs/planned (desktop shell not buildable, PDF export produces metadata only, no WebRTC transport).
  - **ADR-0008 Page Layout & Section Model**: Realized physical page geometry (`width`, `height`, `margins`, `bleed`, `background`) stored in PDF points. Section breaks (`next-page`, `continuous`) anchored to `startPageId` in `doc.sections`.
  - **Phase 0 (Model Repair)**: Defined `DocumentSection` schema & reference validation; section boundary engine with page slice querying & dangling section cleanup.
  - **Phase 1 (Commands & Transactions)**: Canonical `pageLayoutCommands.ts` routed through `updateDocument()` for full undo/redo transaction history.
  - **Phase 2 (Page Setup Modal & Ribbon UI)**: Built `PageSetupModal.tsx` with size presets (A4, A5, A3, Letter, Legal, 6×9 Book, Custom), inside/outside mirror margins, gutter positioning, bleed/background controls, validation, and object overflow warnings. Updated `MsWordRibbon.tsx` with 5 structured ribbon groups.
  - **Phase 3 (Breaks & Backgrounds)**: Section break visual badges in viewport (`PaginatedPrintLayout.tsx`), realized custom page background color rendering (`page.background`), section anchor re-anchoring on page addition/deletion (`documentCommands.ts`).
  - **Phase 4 (Urdu Multi-Column Layout)**: RTL column flow (`direction: rtl`, `column-count`, `column-gap`), visual column separator guide lines (gutter rules in `PaginatedPrintLayout.tsx`), and column geometry calculation (`columnEngine.ts`).
  - **Phase 5 (Headers, Footers, Master Pages & Urdu Numbering)**: Master page object compositing (`resolvePageCompositeObjects`), running section header & footer stories, localized section page numbers (`getSectionPageNumberString` supporting Urdu `۰, ۱, ۲`, Abjad `ا, ب, ج`, and Western styles with `restartAtSection`).
  - **Phase 6 (Professional Layout Aids)**: Interactive rulers, guide creation/dragging (`updateGuidesCommand`), snap-to-guides toggle (`toggleSnapToGuidesCommand`), bleed frame overlays (`page.bleed`), and guide persistence in `.urdup` packages.
  - **Phase 7 (Preflight & Print Safety)**: Text-overflow detection, font license checking, low DPI image asset warnings, bleed boundary violation checks, and `getExportReadinessReport()` with PDF Readiness tab in `PreflightPanel.tsx`.
  - **Phase 8 (Milestone Exit Gate & Verification)**: Exit gate verification suite in `m8ExitGate.test.ts`. Test counts in this document are stale (July 2026); measured 2026-10-18: 109 test files, ~306 test cases by grep count.
- **M7 Urdu Tools System (ADR-0007)**:
  - Canonical language mutation command `applyLanguageChangesCommand` operating in reverse offset order to preserve offsets.
  - Scope isolation (`selection`, `story`, `document`).
  - Personal dictionary local storage persistence (`repage_personal_dictionary`).
  - Transliteration guards (protecting Latin abbreviations like `HTTP`, `PDF`, `URL`, `e.g.`, `P.S.`, URLs, emails, dates, and numbers).
  - Preservation of ZWNJ (`\u200C`), ZWJ (`\u200D`), RLM (`\u200F`), LRM (`\u200E`), Aerab, and honorific glyphs (`ﷺ`).
  - Extensible `OcrProvider` hierarchy with `getConfiguredOcrProvider()` for production (returns `UnavailableOcrProvider` when no real engine exists), honest Preview/Demo labelling, source asset persistence in `document.assets`, and canonical `addOcrResultCommand` routing through `updateDocument` for undo/redo.
- **GitHub Repository**: `https://github.com/iRehmanAhmad/RePage`

## Architecture decisions

- Canonical documents are independent of React, Fabric, Tiptap, and Yjs.
- Geometry uses PDF points (72 per inch), not screen pixels.
- Fabric handles object geometry and interaction, not canonical rich-text storage.
- Tiptap/ProseMirror is the planned DOM rich-text editor.
- Yjs is the planned collaboration CRDT, with awareness reserved for ephemeral presence.
- IndexedDB/Dexie provides browser autosave and recovery.
- `.urdup` is a versioned ZIP package with JSON metadata and separate assets.
- Export is a dedicated layout/rendering pipeline, independent from screenshots of the workspace UI.
- Left sidebar removed; Properties inspector is the sole right-side dock.
- `FabricCanvasAdapter` fires `onObjectDoubleClicked` for text frame editing; `TextEditorOverlay` receives `pendingChar` from `VisualKeyboard`.

## Non-negotiable quality constraints

- UTF-8 throughout the repository and file format.
- Correct Urdu, Arabic, Persian, English, numbers, punctuation, joiners, combining marks, and mixed bidi fixtures.
- No silent data loss during save, import, migration, undo, or collaboration.
- User-owned documents remain usable offline.
- Fonts must have verified redistribution and embedding licences.
- "Print-ready" requires measurable physical dimensions, embedded fonts, and verified output—not merely a high-resolution screenshot.

## Present reality

- The application was rebuilt in clean strict-TypeScript under the product name **RePage**.
- Milestones M0 (Foundation), M1 (Page Layout), M2 (Urdu Typography Beta), M3 (Document Production Beta) have working code (document engine, Fabric adapter, Tiptap editor, master pages, preflight, SVG/EPUB export). M4 (Desktop Release Candidate), M5 (Collaboration Preview), and the PDF/WebRTC/signed-update portions of M7/M8 were claimed complete but are stubs or planned, not functional (see 2026-10-18 code audit).
- MS Word–style UI shell: QAT with 11 configurable tools, 7-tab ribbon with grouped cards and bottom captions, centered document title, dark/light/system themes, English/Urdu menu language toggle.
- Visual Keyboard: 3-row QWERTY layout, CRULP/Navees/English/Native/Custom modes, Shift toggle, special marks (ZWNJ, ZWJ, RLM, LRM, ﷺ, ؒ, ؓ), centered spacebar, minimize/expand toggle.
- 109 test files (~306 test cases by grep count; a live vitest run is needed to confirm the exact total — node_modules is not installed in this checkout), strict UTF-8 scanner, and oxlint linter are enforced in `npm run check`.

## Open decisions

- Final product name and licence.
- Exact rich-text schema and supported version-one marks/nodes.
- Final production PDF technology after the export spike.
- Whether collaboration is self-hosted, managed, or both.
- Whether legacy InPage import is technically and legally viable.
