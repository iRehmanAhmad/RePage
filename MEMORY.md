# Project Memory

Last reviewed: 2026-07-25

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
- **Current Milestone**: RePage UX/UI Modernization (Phases UX-0 through UX-8 **Complete**).
- **M5 Exit Gate Audit**: All 6 exit gate criteria PASSED.
- **MS Word–Style UI**: Quick Access Toolbar (QAT), centered document title, Backstage File menu (`FileBackstageOverlay.tsx`), left Navigation Pane (`NavigationPane.tsx`, `Ctrl+F`), Selection Pane (`SelectionPane.tsx`), statusbar with centered keyboard toggle & zoom slider, 7-tab MS Word ribbon with dynamic Contextual Tabs (Shape Format 🎨, Picture Format 🖼️, Table Design 📊).
- **Word-Style Authoring Surface & Automatic Pagination (Phases UX-2 & UX-3)**: Continuous document story typing with `DocumentBodyEditor.tsx`, Tiptap converter (`tiptapConverter.ts`), automatic paper sheet pagination engine (`paginationEngine.ts`), section breaks (`sectionEngine.ts`), multi-page print layout (`PaginatedPrintLayout.tsx`), and document rulers (`DocumentRulers.tsx`).
- **Inserted Objects, Text Boxes & Wrapping (Phase UX-4)**: Text wrapping engine (`textWrapEngine.ts`), Z-order layer reordering, single/multi-object alignments, table object insertion (`addTableObject`), image crop bounds, and Selection & Layers side pane (`SelectionPane.tsx`).
- **Long-Document Features (Phase UX-5)**: Heading navigation & section reordering (`headingNavigationEngine.ts`), Table of Contents (`tocEngine.ts`), page-anchored footnotes (`longDocumentCommands.ts`), figure/table/equation captions (`captionEngine.ts`), subject index generator (`indexEngine.ts`), styles manager (`StylesManagerModal.tsx`), and document statistics (`DocumentStatsModal.tsx`).
- **Urdu-Native Authoring Excellence (Phase UX-6)**: Character & punctuation substitution engine (`characterSubstitutionEngine.ts`), Arabic to native Urdu letter conversion modal (`CharacterSubstitutionModal.tsx`), diacritic-aware search (`findReplace.ts`), custom keyboard layout editor (`customKeyboardEngine.ts`, `KeyboardLayoutEditorModal.tsx`), and redesigned visual keyboard with diacritic modifier row.
- **Review and Collaboration UX (Phase UX-7)**: Track Changes engine (`trackChangesEngine.ts`), Reviewing Pane (`ReviewingPane.tsx`), Accept/Reject revisions, Document Compare engine (`documentCompareEngine.ts`), Version History snapshots (`versionHistoryEngine.ts`, `VersionHistoryModal.tsx`), Share & Permissions dialog (`ShareDialogModal.tsx`), and Editing/Reviewing/Viewing mode switcher.
- **Accessibility and Customization (Phase UX-8)**: Accessibility checker (`accessibilityChecker.ts`), Read Aloud text-to-speech (`readAloudEngine.ts`, `ReadAloudToolbar.tsx`), Focus Mode, Touch Mode, High-Contrast themes, 200% UI scaling (`accessibilitySettings.ts`), and Ribbon Key Tips (`Alt` navigation badges).
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
- Milestones M0 (Foundation), M1 (Page Layout), M2 (Urdu Typography Beta), M3 (Document Production Beta), M4 (Desktop Release Candidate), and M5 (Collaboration Preview) are COMPLETE.
- Interactive canvas editing is wired: double-click text frame opens Tiptap overlay, Visual Keyboard types into active story, Ribbon Text Frame tool auto-creates and activates text frames.
- MS Word–style UI shell: QAT with 11 configurable tools, 7-tab ribbon with grouped cards and bottom captions, centered document title, dark/light/system themes, English/Urdu menu language toggle.
- Visual Keyboard: 3-row QWERTY layout, CRULP/Navees/English/Native modes, Shift toggle, special marks (ZWNJ, ZWJ, RLM, LRM, ﷺ, ؒ, ؓ), centered spacebar, minimize/expand toggle.
- 158 passing automated unit/integration tests (`vitest`), strict UTF-8 scanner (228 files), and oxlint linter are enforced in `npm run check`.

## Open decisions

- Final product name and licence.
- Exact rich-text schema and supported version-one marks/nodes.
- Final production PDF technology after the export spike.
- Whether collaboration is self-hosted, managed, or both.
- Whether legacy InPage import is technically and legally viable.
