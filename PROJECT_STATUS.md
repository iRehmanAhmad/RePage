# Project Status

Last updated: 2026-10-18

> Note (2026-10-18): this repository has been inactive since 2026-07-27. The milestone claims below describe the state at that time and have not been re-verified since.

## Current phase

**Phase 1 — Stable Core (Windows Desktop & Zero Data-Loss Publishing Core)**

- **Workstream A — Tauri v2 Desktop Shell**: Fully configured `@tauri-apps/cli@^2`, `@tauri-apps/api@^2`, `@tauri-apps/plugin-dialog@^2`, `@tauri-apps/plugin-fs@^2`, `src-tauri/capabilities/default.json` (least-privilege permissions scoped to documents/desktop), `build.rs`, Rust plugins registration in `src/lib.rs`, and generated multi-resolution icon assets in `src-tauri/icons/`. Verified via `cargo check` and compilation.
- **Workstream B — Real Vector PDF Export**: Integrated dedicated `@media print` stylesheet in `src/ui/themes/global.css` that suppresses application UI chrome and outputs clean, unclipped vector pages with selectable Urdu Nastaleeq text and page-break enforcement. A dedicated exporter module `src/export/pdfPrintExporter.ts` (`vector-pdf` format, `file.exportPdf` command) renders editor-independent static print pages with per-document `@page` sizing and a suggested file name. Documented font licensing policy (Noto Nastaliq Urdu / Gulzar under SIL OFL; Jameel Noori Nastaleeq as system font). Press-grade prepress PDF (crop marks, bleed boxes, font-embedding guarantees) remains future work.
- **Workstream C — Guaranteed Zero Data-Loss Engine**: Implemented genuine atomic save (temporary file write then atomic rename), automatic corrupt package backup to `.corrupt.<timestamp>`, in-memory IndexedDB fallback in `database.ts`, debounced auto-save on document modification, and startup crash recovery modal prompt in `App.tsx`. Verified via `tauriStableCore.test.ts`.
- **Workstream D — CI Stabilization**: Aligned test assertions for `AppLayout.test.tsx` and `VisualKeyboard.test.tsx`, added automated tests for atomic save and recovery, verified clean lint, strict UTF-8 scan, and build.

## Completed capabilities (M0–M7 Exit Gates Passed, M8 Phase 0 Complete)

- React/Vite application rebuilt in strict TypeScript (`RePage` branding).
- Canonical schema-version-one document, page, object, story, rich-text, asset, and geometry types.
- PlatformServices abstraction layer (`platformServices.ts`, `browserPlatform.ts`, `tauriPlatform.ts`) supporting both web browser and Tauri 2 desktop runtime without coupling domain core.
- Native file workflow engine (`fileWorkflowEngine.ts`, `recentFiles.ts`, `conflictDetector.ts`) supporting Open, Save, Save As, atomic file replacement, recent files history, file associations for `.urdup`, drag-and-drop document opening (`DragAndDropOverlay.tsx`), and external file modification conflict detection.
- **Urdu Tools System (M7)**:
  - Document-connected proofing, personal dictionary, and grammar checking.
  - Safe transliteration preserving Latin abbreviations and bidi controls.
  - Character normalization converting non-standard Arabic glyphs (ك, ي, ۃ) to native Urdu (ک, ی, ہ) with Quranic/honorific protection.
  - Custom keyboard layout editor with JSON import/export and honest Native OS mode.
  - OCR provider architecture with `getConfiguredOcrProvider()`, honest Preview/Demo labelling, source asset persistence, and canonical command placement.
  - Responsive ribbon organization across 1024px–1920px viewports with ARIA accessibility.
- **Preflight & Print Production Engine (M8 Phase 0)**:
  - Multi-axis preflight diagnostics (image DPI calculation, boundary checks, overset text detection, font license compliance).
  - Target-specific preflight options (`targetDpi: 300`, `pressReady: true`).
- 115 test files (~367 test cases by grep count) of automated unit and integration tests (`vitest`).
- **Linked text-frame flow (Phase 2)**: text frames can be linked into flow chains from the ribbon (Shape Format → Text Flow → "Link frame…", target picker by page; "Unlink" breaks the chain). Story text is distributed across chained frames at word boundaries (`computeChainTextSlices` in `domain/document/textFlow.ts`, estimation-based like the existing overflow heuristics) and rendered per-frame on the canvas; sequence badges `[#1]`, `[#2]` and the `[+]` overflow badge reflect the chain. Commands: `linkTextFramesCommand` / `unlinkTextFrameCommand` in `editor/commands/documentCommands.ts`. Known v1 limitation: unlinking does not fork the story (the unlinked frame keeps sharing the story text).

## Verification baseline

Recorded on 2026-07-26 after M8 Phase 0 completion:

- `npm run check:utf8`: 331 files verified as valid UTF-8 without corrupt mojibake.
- `npm run lint`: oxlint passes with 0 warnings and 0 errors across 231 files.
- `npm run build`: passes strict TypeScript compilation (`tsc -b`) and Vite production bundle.
- `npm run test`: vitest covers 115 test files (~367 test cases by grep count).
- Production build: compiles cleanly with 0 TypeScript errors.

## Status update protocol

When work begins, add it to the immediate queue or identify the milestone task. When completed, remove it, record verification, and update the relevant specification or ADR. Do not use this file as a daily log.
