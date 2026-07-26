# Project Memory

Last reviewed: 2026-07-26

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
- **Current Milestone**: Export Engine & Vector PDF Print Production Milestone — **M8 Phase 0 COMPLETE & VERIFIED** (Expanded preflight diagnostic rules for image DPI calculation against physical frame width, page boundary overflow detection, overset text checks, and font license compliance).
- **M7 Urdu Tools System (ADR-0007)**:
  - Canonical language mutation command `applyLanguageChangesCommand` operating in reverse offset order to preserve offsets.
  - Scope isolation (`selection`, `story`, `document`).
  - Personal dictionary local storage persistence (`repage_personal_dictionary`).
  - Transliteration guards (protecting Latin abbreviations like `HTTP`, `PDF`, `URL`, `e.g.`, `P.S.`, URLs, emails, dates, and numbers).
  - Preservation of ZWNJ (`\u200C`), ZWJ (`\u200D`), RLM (`\u200F`), LRM (`\u200E`), Aerab, and honorific glyphs (`ﷺ`).
  - Extensible `OcrProvider` hierarchy (`MockOcrProvider`, `UnavailableOcrProvider`).
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
- Milestones M0 (Foundation), M1 (Page Layout), M2 (Urdu Typography Beta), M3 (Document Production Beta), M4 (Desktop Release Candidate), M5 (Collaboration Preview), M6 (Ribbon & Canvas Object Systems), and M7 (Urdu Tools) are COMPLETE.
- Milestone M8 Phase 0 (Preflight Expansion & Print Production Diagnostics) is COMPLETE.
- MS Word–style UI shell: QAT with 11 configurable tools, 7-tab ribbon with grouped cards and bottom captions, centered document title, dark/light/system themes, English/Urdu menu language toggle.
- Visual Keyboard: 3-row QWERTY layout, CRULP/Navees/English/Native/Custom modes, Shift toggle, special marks (ZWNJ, ZWJ, RLM, LRM, ﷺ, ؒ, ؓ), centered spacebar, minimize/expand toggle.
- 254 passing automated unit/integration tests (`vitest`), strict UTF-8 scanner (331 files), and oxlint linter are enforced in `npm run check`.

## Open decisions

- Final product name and licence.
- Exact rich-text schema and supported version-one marks/nodes.
- Final production PDF technology after the export spike.
- Whether collaboration is self-hosted, managed, or both.
- Whether legacy InPage import is technically and legally viable.
