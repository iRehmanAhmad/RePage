# Project Memory

Last reviewed: 2026-07-25

## Mission

Build a modern, easy-to-use, offline-first, cross-platform Urdu desktop-publishing application that can become a credible alternative to InPage.

## Product decisions

- The product name is **RePage**.
- The product is a frame-oriented DTP editor first, not a complete flowing word processor.
- Desktop publishing on Windows, macOS, and Linux is the primary target.
- A shared browser core is desirable; Tauri is the intended desktop shell after the core architecture stabilizes.
- Local editing, saving, autosave, recovery, and export must work without an account or internet connection.
- Collaboration is optional and comes after reliable local publishing.
- Voice and AI features are- **Current Milestone**: Milestone 3 — Document Production Beta (**Fully Resolved & Audited**).
- **M3 Exit Gate Audit**: All 6 exit gate criteria PASSED (Linked text frame reflow, RTL column layout rules, Master Page inheritance & overrides, Urdu page number fields, Preflight diagnostics panel, Standalone vector SVG & PDF prepress export).
- **Test Suite**: 77 vitest unit tests passing across 24 test suites. 128 UTF-8 files verified without mojibake.
- **GitHub Repository**: `https://github.com/iRehmanAhmad/RePage` files.

## Architecture decisions

- Canonical documents are independent of React, Fabric, Tiptap, and Yjs.
- Geometry uses PDF points (72 per inch), not screen pixels.
- Fabric handles object geometry and interaction, not canonical rich-text storage.
- Tiptap/ProseMirror is the planned DOM rich-text editor.
- Yjs is the planned collaboration CRDT, with awareness reserved for ephemeral presence.
- IndexedDB/Dexie provides browser autosave and recovery.
- `.urdup` is a versioned ZIP package with JSON metadata and separate assets.
- Export is a dedicated layout/rendering pipeline, independent from screenshots of the workspace UI.

## Non-negotiable quality constraints

- UTF-8 throughout the repository and file format.
- Correct Urdu, Arabic, Persian, English, numbers, punctuation, joiners, combining marks, and mixed bidi fixtures.
- No silent data loss during save, import, migration, undo, or collaboration.
- User-owned documents remain usable offline.
- Fonts must have verified redistribution and embedding licences.
- “Print-ready” requires measurable physical dimensions, embedded fonts, and verified output—not merely a high-resolution screenshot.

## Present reality

- The application was rebuilt in clean strict-TypeScript under the product name **RePage**.
- Milestone 0 (Foundation) and Milestone 2 (Urdu Typography Beta) are COMPLETE.
- Canonical document schema v1, point-based geometry, stable IDs, referential validation, page/object commands, Dexie recovery, SHA-256 asset storage, and baseline `.urdup` ZIP round trips are implemented.
- Pinned Urdu Font Register (`fontRegistry.ts`), Google Fonts web font loaders, and system fallbacks are configured.
- Urdu Rich-Text Zod Schema (`types.ts`), floating Tiptap DOM rich-text overlay (`TextEditorOverlay.tsx`), and CRULP/Navees Phonetic Visual Keyboards (`VisualKeyboard.tsx`) are active.
- Multi-frame linked text flow (`textFlow.ts`), sequence ordering, and visual overflow indicators (`[+] ⚠️`) are implemented and verified.
- 40 passing automated unit/integration tests (`vitest`), strict UTF-8 scanner, and oxlint linter are enforced in `npm run check`.

## Open decisions

- Final product name and licence.
- Exact rich-text schema and supported version-one marks/nodes.
- Final production PDF technology after the export spike.
- Whether collaboration is self-hosted, managed, or both.
- Whether legacy InPage import is technically and legally viable.
