# Project Status

Last updated: 2026-07-25

## Current phase

**M0 — Foundation and risk elimination: in progress**

The old JavaScript prototype has been removed. The repository now starts from the planned canonical architecture rather than attempting to migrate live Fabric/component state in place.

## Completed foundation capabilities

- React/Vite application rebuilt in strict TypeScript.
- Canonical schema-version-one document, page, object, story, rich-text, asset, and geometry types.
- PDF-point canonical measurements with tested millimetre and viewport conversions.
- Stable IDs and referential validation through Zod.
- Domain commands for title, page creation/removal, rectangle insertion, and object movement.
- Multi-page workspace shell that reads canonical state.
- IndexedDB/Dexie recovery snapshots after document changes.
- Baseline `.urdup` ZIP creation and validated import.
- Package limits for total input bytes, entry count, required entries, and unsafe paths.
- Browser platform download boundary.
- Nine passing automated tests covering units, Unicode content, commands, references, and package round trips.
- Successful visual smoke test for Urdu rendering, page creation, rectangle insertion, and autosave.

## Known gaps and risks

| ID | Gap | Severity | Next resolution |
|---|---|---:|---|
| F-001 | No interactive Fabric canvas adapter | High | Build canonical-to-Fabric factories and event/command bridge |
| F-002 | Text is displayed but not editable | High | Add constrained rich-text schema adapter and Tiptap overlay spike |
| F-003 | Package assets and hashes are specified but not written/read | Critical | Implement asset store, hash verification, decoded media limits |
| F-004 | Package compression-ratio and JSON complexity limits are incomplete | High | Add hostile package fixtures and bounded parsing policy |
| F-005 | No schema migration runner beyond v1 | High | Add migration registry before schema v2 exists |
| F-006 | Recovery is saved but not offered on startup | High | Add recovery index, restore/discard screen, failure tests |
| F-007 | No user-visible undo/redo history | High | Add transaction history around commands |
| F-008 | No approved/self-hosted Urdu font artifact | High | Complete font register and typography corpus before bundling |
| F-009 | No raster or production export | High | Begin only after canonical layout and fonts are reliable |
| F-010 | Tauri and collaboration are intentionally absent | Medium | Follow M4/M5 gates; do not pull them forward |

## Immediate work queue

1. Complete package asset hashing, limits, and hostile fixtures (F-003, F-004).
2. Create the Fabric adapter without placing Fabric data in canonical documents (F-001).
3. Establish the pinned-font register and typography fixture corpus (F-008).

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
