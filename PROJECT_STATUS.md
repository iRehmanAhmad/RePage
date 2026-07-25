# Project Status

Last updated: 2026-07-25

## Current phase

**M4 — Cross-Platform Desktop Release Candidate: in progress** (M0 Foundation, M2 Urdu Typography Beta, and M3 Document Production Beta: COMPLETE)

The clean strict-TypeScript Foundation, Urdu Typography Beta (M2), Milestone 3 Document Production Beta, and M4.1 Tauri 2 Desktop Shell are complete with verified UTF-8 scanner, Urdu Unicode test fixtures, Font Governance register, PlatformServices abstraction layer, Tauri 2 configuration (`src-tauri/`), and browser/desktop compatibility.

## Completed capabilities (M0, M2, & M3 Exit Gates Passed, M4.1 Active)

- React/Vite application rebuilt in strict TypeScript (`RePage` branding).
- Canonical schema-version-one document, page, object, story, rich-text, asset, and geometry types.
- PlatformServices abstraction layer (`platformServices.ts`, `browserPlatform.ts`, `tauriPlatform.ts`) supporting both web browser and Tauri 2 desktop runtime without coupling domain core.
- Tauri 2 desktop shell configuration (`src-tauri/tauri.conf.json`, `Cargo.toml`, `lib.rs`, `main.rs`) with least-privilege security capabilities.
- 80 passing automated unit and integration tests (`vitest`).

## Milestone 4 work queue (Cross-Platform Desktop Release Candidate)

1. Introduce Tauri 2 & PlatformServices Architecture (M4.1 — **Resolved**).
2. Desktop native file associations & IPC commands (M4.2).
3. System font enumerator & native font loader (M4.3).
4. Milestone 4 Exit Gate Audit (M4.4).

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
