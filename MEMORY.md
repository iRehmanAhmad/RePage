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
- **Current Milestone**: Phase 1 — Stable Core (Windows Desktop & Zero Data-Loss Publishing Core).
  - **Tauri v2 Shell**: `@tauri-apps/cli@^2`, `@tauri-apps/api@^2`, `@tauri-apps/plugin-dialog@^2`, `@tauri-apps/plugin-fs@^2`, capabilities least-privilege scoping, and verified `cargo check` and compilation.
  - **Vector Print-to-PDF**: dedicated `@media print` rules in `global.css` suppressing application chrome and producing clean vector pages with selectable Urdu typography; plus `src/export/pdfPrintExporter.ts` (`vector-pdf` format, `file.exportPdf` command) rendering editor-independent static print pages with per-document `@page` sizing and a suggested file name.
  - **Zero Data-Loss Persistence**: atomic file save (`.tmp` -> atomic rename), safety backup on corrupted package (`.corrupt`), in-memory IndexedDB fallback, 2.5s debounced autosave, and startup crash recovery modal.
  - **CI & Test Suite**: 100% green local checks (`npm run check:utf8`, `npm run lint`, `npm run test`, `npm run build`).
  - **Prior Page Layout & Section Model Architecture**: ADR-0008 physical page geometry, section engine, page setup modal, RTL multi-column layout, localized Urdu page numbering, and preflight print safety.
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
