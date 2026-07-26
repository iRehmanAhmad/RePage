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
- **MS Word 365 Home & Insert Tabs Reorganization**:
  - **Home Tab Groups**: Complete official MS Word 365 layout: `Clipboard` | `Font` | `Paragraph` | `Styles` | `Editing` | `Add-ins`.
    - **Styles Group**: Quick Styles gallery cards (*Normal*, *No Spacing*, *Heading 1*, *Heading 2*, *Title*), up/down scroll controls, and bottom-right ↘️ Styles launcher (`StylesManagerModal.tsx`).
    - **Editing Group**: **Find (`🔍 Find ▼`)** (`Ctrl+F`), **Replace (`c🔁b Replace`)** (`Ctrl+H`), **Select (`↖️ Select ▼`)** (*Select All*, *Select Objects*).
    - **Add-ins Group**: **Add-ins (`▦ Add-ins`)** extension launcher.
  - **Insert Tab Reorganization**: Moved Tools (Text Box 📝, Shapes/Rectangle 📐, Picture 🖼️) into the **Insert Tab** under Illustrations & Text Boxes, alongside Pages, Tables, Footnotes, and References.
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
