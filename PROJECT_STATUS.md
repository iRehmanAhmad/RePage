# Project Status

Last updated: 2026-07-26

## Current phase

**Export Engine & Vector PDF Print Production Milestone (M8) — Phase 0 Complete & Verified**

Milestone 8 (Export Engine & Print Production) Phase 0 has been implemented, verified, and release-gated:
- **M8 Phase 0 — Preflight Diagnostic Engine Expansion**: Expanded preflight diagnostics in `preflightEngine.ts` with `ImageDpiRule` (calculates effective image resolution against frame width; flags images below 300 DPI for press or below 150 DPI for web), `OutofPageBoundaryRule` (flags objects extending beyond printable page margins), `TextOverflowRule` (detects un-rendered story overflow), and `FontEmbeddingRule` (verifies OFL/embedding permissions). Added `PreflightOptions` (`targetDpi`, `pressReady`), severity levels, and interactive preflight panel UI with jump-to-object triggers.
- **M7 Urdu Tools Milestone**: Fully implemented and release-gated across all 7 phases (Safe Mutation Foundation, Scope Resolution, Proofing & Personal Dictionary, Safe Transliteration & Bidi Preservation, Custom Keyboard Layout System, Extensible OcrProvider Architecture, Ribbon Reorganization & ARIA Accessibility).

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
  - Scanned image and PDF page OCR recognition with side-by-side low-confidence review and package asset storage.
  - Responsive ribbon organization across 1024px–1920px viewports with ARIA accessibility.
- **Preflight & Print Production Engine (M8 Phase 0)**:
  - Multi-axis preflight diagnostics (image DPI calculation, boundary checks, overset text detection, font license compliance).
  - Target-specific preflight options (`targetDpi: 300`, `pressReady: true`).
- 254 passing automated unit and integration tests across 96 test suites (`vitest`).

## Verification baseline

Recorded on 2026-07-26 after M8 Phase 0 completion:

- `npm run check:utf8`: 331 files verified as valid UTF-8 without corrupt mojibake.
- `npm run lint`: oxlint passes with 0 warnings and 0 errors across 231 files.
- `npm run build`: passes strict TypeScript compilation (`tsc -b`) and Vite production bundle.
- `npm run test`: vitest passes 254 unit/integration tests across 96 test suites.
- Production build: compiles cleanly with 0 TypeScript errors.

## Status update protocol

When work begins, add it to the immediate queue or identify the milestone task. When completed, remove it, record verification, and update the relevant specification or ADR. Do not use this file as a daily log.
