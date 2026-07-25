# Project Status

Last updated: 2026-07-25

## Current phase

**M2 — Urdu Typography Beta: COMPLETE** (M0 Foundation: COMPLETE, M1 Page-Layout Alpha: in progress)

The clean strict-TypeScript Foundation and Urdu Typography Beta (M2) are complete with verified UTF-8 scanner, Urdu Unicode test fixtures, Font Governance register, Urdu Rich-Text Zod Schema, Tiptap DOM editing overlay, Bidi QA suite, Phonetic Keyboards (CRULP/Navees), and Multi-frame text flow foundations.

## Completed foundation & typography capabilities (M0 & M2 Exit Gates Passed)

- React/Vite application rebuilt in strict TypeScript (`RePage` branding).
- Canonical schema-version-one document, page, object, story, rich-text, asset, and geometry types.
- PDF-point canonical measurements with tested millimetre and viewport conversions.
- Stable IDs and referential validation through Zod (`parseDocument`).
- Domain commands for title, page creation/removal, rectangle insertion, geometry modification, and object deletion.
- Bounded transaction history (`TransactionHistory`) supporting Undo / Redo (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`).
- Interactive Fabric.js canvas adapter (`FabricCanvasAdapter` / `FabricCanvas`) for interactive shape rendering, drag, scale, rotate, and selection.
- IndexedDB/Dexie recovery snapshots and startup restore/discard prompt UX.
- Baseline `.urdup` ZIP package creation, SHA-256 asset hashing, size limits, and validated import.
- Automated strict UTF-8 and mojibake verification scanner (`check:utf8`).
- Pinned Urdu Font Register (`fontRegistry.ts`), Google Fonts web font loaders, and system fallbacks.
- Urdu Rich-Text Schema (`types.ts`) with ProseMirror/Tiptap compatible node & mark structures.
- Floating Tiptap DOM rich-text editor overlay (`TextEditorOverlay.tsx`) for canvas text frames.
- 13 verified Urdu Unicode & Bidi test fixtures (`fixtures.ts`) with code-point round-trip verification.
- CRULP Phonetic, Navees Phonetic, and Visual On-Screen Keyboard toolbar (`VisualKeyboard.tsx`).
- Multi-frame linked story flow (`textFlow.ts`), sequence ordering, and visual overflow badge rendering.
- 40 passing automated unit and integration tests (`vitest`).

## Known gaps and risks

| ID | Gap | Severity | Next resolution |
|---|---|---:|---|
| F-001 | Interactive Fabric canvas adapter | **Resolved** | Built `FabricCanvasAdapter` & `FabricCanvas` for shapes & frames |
| F-002 | Urdu rich-text schema & validation | **Resolved** | Built ProseMirror/Tiptap compatible rich-text schema, Zod validator & plain text converter |
| F-003 | Package assets and hashes | **Resolved** | Implemented SHA-256 Web Crypto hashing, 50MB asset limit, 100MB package limit |
| F-004 | Package compression-ratio and JSON limits | **Resolved** | Implemented 10x compression ratio limit and hostile package guards |
| F-005 | No schema migration runner beyond v1 | High | Add migration registry before schema v2 exists |
| F-006 | Startup recovery prompt | **Resolved** | Implemented `getLatestRecovery` & startup restore/discard banner UX |
| F-007 | User-visible undo/redo history | **Resolved** | Implemented `TransactionHistory` & `Ctrl+Z` / `Ctrl+Y` shortcuts |
| F-008 | Approved/self-hosted Urdu font register | **Resolved** | Built `fontRegistry.ts`, Google Fonts web font imports & fallback chains |
| F-009 | No raster or production export | High | Begin only after canonical layout and fonts are reliable |
| F-010 | Tauri and collaboration are intentionally absent | Medium | Follow M4/M5 gates; do not pull them forward |

## Immediate Milestone 3 work queue

1. Multi-page Workspace Tools (Zoom, Pan, Guides, Multi-Selection — M1.3 / M1.4).
2. Advanced Master Pages & Section Headers (M3.1 Page Layout Engine).
3. Grid Systems & Snap Guides (M3.2 Layout & Guides).

## Foundation & Typography exit gate progress

- [x] Repository source is strict UTF-8 and verified Urdu renders correctly.
- [x] Canonical strict-TypeScript document model exists with schema versioning.
- [x] A two-page document can be edited through commands and `.urdup` round-tripped without semantic loss.
- [x] Text, image, and shape assets all round-trip through the package format.
- [x] Autosave recovery restore/discard is tested end to end.
- [x] Undo/redo transaction behavior is implemented and tested.
- [x] Urdu typography register, Tiptap rich-text overlay, Bidi QA, Phonetic keyboards, and Linked text flow are complete.
- [x] `npm run check` (strict UTF-8 scanner + `oxlint` + `vitest` + `tsc` + `vite build`) passes.

## Verification baseline

Recorded on 2026-07-25 after the clean rebuild:

- `npm install`: removed 91 obsolete packages, installed 31 required packages, and reported zero vulnerabilities across 143 audited packages.
- `npm run lint`: passes with warnings denied.
- `npm run test`: 3 files and 9 tests pass.
- `npm run build`: passes strict TypeScript and Vite production build.
- Main JavaScript bundle: approximately 466 KB before gzip and 143 KB after gzip.
- Browser smoke test: correct Urdu rendering; Add page and Rectangle commands work; autosave succeeds; no browser console warnings or errors.

## Status update protocol

When work begins, add it to the immediate queue or identify the milestone task. When completed, remove it, record verification, and update the relevant specification or ADR. Do not use this file as a daily log.
