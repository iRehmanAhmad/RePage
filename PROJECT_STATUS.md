# Project Status

Last updated: 2026-07-25

## Current phase

**M1 — Local Page-Layout Alpha: in progress** (M0 Foundation & Risk Elimination: COMPLETE)

The clean strict-TypeScript Foundation is complete with verified UTF-8 scanner, Urdu Unicode test fixtures, Undo/Redo transaction stack, startup recovery UX, and interactive Fabric.js canvas adapter (`F-001`).

## Completed foundation capabilities (M0 Exit Gate Passed)

- React/Vite application rebuilt in strict TypeScript (`RePage` branding).
- Canonical schema-version-one document, page, object, story, rich-text, asset, and geometry types.
- PDF-point canonical measurements with tested millimetre and viewport conversions.
- Stable IDs and referential validation through Zod (`parseDocument`).
- Domain commands for title, page creation/removal, rectangle insertion, geometry modification, and object deletion.
- Bounded transaction history (`TransactionHistory`) supporting Undo / Redo (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`).
- Interactive Fabric.js canvas adapter (`FabricCanvasAdapter` / `FabricCanvas`) for interactive shape rendering, drag, scale, rotate, and selection.
- IndexedDB/Dexie recovery snapshots and startup restore/discard prompt UX.
- Baseline `.urdup` ZIP package creation and validated import.
- Automated strict UTF-8 and mojibake verification scanner (`check:utf8`).
- 20 passing automated unit and integration tests (`vitest`).

## Known gaps and risks

| ID | Gap | Severity | Next resolution |
|---|---|---:|---|
| F-001 | Interactive Fabric canvas adapter | **Resolved** | Built `FabricCanvasAdapter` & `FabricCanvas` for shapes & frames |
| F-002 | Text is displayed but not editable | High | Add constrained rich-text schema adapter and Tiptap overlay |
| F-003 | Package assets and hashes are specified but not written/read | Critical | Implement asset store, hash verification, decoded media limits |
| F-004 | Package compression-ratio and JSON complexity limits are incomplete | High | Add hostile package fixtures and bounded parsing policy |
| F-005 | No schema migration runner beyond v1 | High | Add migration registry before schema v2 exists |
| F-006 | Startup recovery prompt | **Resolved** | Implemented `getLatestRecovery` & startup restore/discard banner UX |
| F-007 | User-visible undo/redo history | **Resolved** | Implemented `TransactionHistory` & `Ctrl+Z` / `Ctrl+Y` shortcuts |
| F-008 | Approved/self-hosted Urdu font register | **Resolved** | Built `fontRegistry.ts`, Google Fonts web font imports & fallback chains |
| F-009 | No raster or production export | High | Begin only after canonical layout and fonts are reliable |
| F-010 | Tauri and collaboration are intentionally absent | Medium | Follow M4/M5 gates; do not pull them forward |

## Immediate Milestone 1 work queue

1. Implement Package Asset Storage, SHA-256 Hashing & Limits (F-003, F-004 / M1.6 Image-frame & Asset System).
2. Establish Pinned Urdu Font Register & Typography Fixture Corpus (F-008 / M2.1 Font Governance).
3. Begin Rich-Text Engine & Tiptap Overlay Editor (F-002 / M1.7 & M2.3 Tiptap Overlay).

## Foundation exit gate progress

- [x] Repository source is strict UTF-8 and verified Urdu renders correctly.
- [x] Canonical strict-TypeScript document model exists with schema versioning.
- [x] A two-page document can be edited through commands and `.urdup` round-tripped without semantic loss.
- [ ] Text, image, and shape assets all round-trip through the package format.
- [x] Autosave recovery restore/discard is tested end to end.
- [x] Undo/redo transaction behavior is implemented and tested.
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
