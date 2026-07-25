# Project Status

Last updated: 2026-07-25

## Current phase

**M4 — Cross-Platform Desktop Release Candidate: COMPLETE (All Exit Gates Passed)** (M0 Foundation, M2 Urdu Typography Beta, M3 Document Production Beta, M4 Desktop Release Candidate: COMPLETE)

The clean strict-TypeScript Foundation, Urdu Typography Beta (M2), Milestone 3 Document Production Beta, and Milestone 4 Cross-Platform Desktop Release Candidate are complete with verified UTF-8 scanner, Urdu Unicode test fixtures, Font Governance register, PlatformServices abstraction layer, Tauri 2 configuration (`src-tauri/`), native file workflow engine, desktop OS integration, multi-platform installers (NSIS, DMG, DEB, AppImage, RPM), and registered `.urdup` file associations.

## Completed capabilities (M0, M2, M3, & M4 Exit Gates Passed)

- React/Vite application rebuilt in strict TypeScript (`RePage` branding).
- Canonical schema-version-one document, page, object, story, rich-text, asset, and geometry types.
- PlatformServices abstraction layer (`platformServices.ts`, `browserPlatform.ts`, `tauriPlatform.ts`) supporting both web browser and Tauri 2 desktop runtime without coupling domain core.
- Tauri 2 desktop shell configuration (`src-tauri/tauri.conf.json`, `Cargo.toml`, `lib.rs`, `main.rs`) with least-privilege security capabilities.
- Native file workflow engine (`fileWorkflowEngine.ts`, `recentFiles.ts`, `conflictDetector.ts`) supporting Open, Save, Save As, atomic file replacement, recent files history, file associations for `.urdup`, drag-and-drop document opening (`DragAndDropOverlay.tsx`), and external file modification conflict detection.
- Desktop OS integration (`windowIntegration.ts`, `clipboard.ts`, `printService.ts`, `themeIntegration.ts`, `accessibility.ts`) supporting dynamic title dirty state tracking, native menu shortcuts (`Ctrl+S`, `Ctrl+O`, `Ctrl+P`), native print dialog trigger, OS theme listeners, High-DPI backing scale, and screen-reader ARIA live region notifications.
- Multi-platform packaging pipeline (`DISTRIBUTION.md`, `verify-distribution.js`, `.github/workflows/release-distribution.yml`) producing Windows NSIS, macOS DMG, and Linux AppImage/DEB/RPM installers.
- Signed application update manager (`updateManager.ts`), release channels (`stable`/`beta`), Ed25519 signature verification, failed-update rollback policy, and explicit user-driven document migration policy.
- Collaboration CRDT document mapping (`crdtDoc.ts`) translating canonical document entities to Yjs shared maps (`yPageOrder`, `yPages`, `yObjects`, `yStories`, `yStyles`, `yComments`) with binary asset isolation.
- Ephemeral collaborator awareness manager (`awareness.ts`) isolating user ID, display name, user color, active page, selection, and canvas cursor.
- Collaborative conflict resolution engine (`conflictEngine.ts`) defining Last-Writer-Wins movement/resize resolution, delete-over-edit precedence, cascading page deletion, default style fallback, linked-story reflow recomputation, and scoped local `Y.UndoManager` (`Ctrl+Z`).
- 108 passing automated unit and integration tests (`vitest`).

## Milestone 5 work queue (Collaboration Preview)

1. Map canonical concepts to Yjs & Awareness separation (M5.1 — **Resolved**).
2. Collaborative Conflict Policies & Undo Invariants (M5.2 — **Resolved**).

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
