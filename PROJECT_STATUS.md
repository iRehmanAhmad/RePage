# Project Status

Last updated: 2026-07-25

## Current phase

**M3 — Document Production Beta: in progress** (M0 Foundation & M2 Urdu Typography Beta: COMPLETE)

The clean strict-TypeScript Foundation, Urdu Typography Beta (M2), and M3.1 Linked Text Frames Engine are complete with verified UTF-8 scanner, Urdu Unicode test fixtures, Font Governance register, Urdu Rich-Text Zod Schema, Tiptap DOM editing overlay, Bidi QA suite, Phonetic Keyboards (CRULP/Navees), Multi-frame story flow, circular-link prevention, and document templates.

## Completed capabilities (M0 & M2 Exit Gates Passed, M3.1 Active)

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
- Multi-frame linked story flow engine (`textFlowEngine.ts`), circular-link prevention, frame deletion story retention, and visual sequence badges.
- Urdu paragraph styles (`styles.ts`), multi-column text frames, and Aerab-aware Find & Replace engine (`findReplace.ts`).
- Urdu document template engine (`documentTemplates.ts`) with Newspaper and Poetry Book presets.
- 53 passing automated unit and integration tests (`vitest`).

## Immediate Milestone 3 work queue

1. Linked text frames, circular link prevention & multi-page reflow (M3.1 — **Resolved**).
2. Multi-column text frames & RTL column layout engine (M3.2 — **Resolved**).
3. Advanced Master Pages & Running Elements Engine (M3.3 — **Resolved**).
4. Automatic Page Numbering Fields & Urdu Numerals (M3.4 — **Resolved**).
5. Character & Paragraph Object Style Libraries (M3.5 — **Resolved**).
6. Pre-flight Verification & Urdu Document Diagnostics (M3.6).

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
