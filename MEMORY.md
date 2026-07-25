# Project Memory

Last reviewed: 2026-07-25

## Mission

Build a modern, easy-to-use, offline-first, cross-platform Urdu desktop-publishing application that can become a credible alternative to InPage.

## Product decisions

- The product name is **RePage**.
- The product is a frame-oriented DTP editor first, not a complete flowing word processor.
- Desktop publishing on Windows, macOS, and Linux is the primary target.
- A shared browser core is desirable; Tauri is the intended desktop shell after the core architecture stabilizes.
- Local editing, saving, autosave, recovery, and export must work without an account or internet connection.
- Collaboration is optional and comes after reliable local publishing.
- Voice and AI features are differentiators, not foundational requirements.
- The portable document extension is `.urdup`; it must not imply compatibility with proprietary InPage files.

## Architecture decisions

- Canonical documents are independent of React, Fabric, Tiptap, and Yjs.
- Geometry uses PDF points (72 per inch), not screen pixels.
- Fabric handles object geometry and interaction, not canonical rich-text storage.
- Tiptap/ProseMirror is the planned DOM rich-text editor.
- Yjs is the planned collaboration CRDT, with awareness reserved for ephemeral presence.
- IndexedDB/Dexie provides browser autosave and recovery.
- `.urdup` is a versioned ZIP package with JSON metadata and separate assets.
- Export is a dedicated layout/rendering pipeline, independent from screenshots of the workspace UI.

## Non-negotiable quality constraints

- UTF-8 throughout the repository and file format.
- Correct Urdu, Arabic, Persian, English, numbers, punctuation, joiners, combining marks, and mixed bidi fixtures.
- No silent data loss during save, import, migration, undo, or collaboration.
- User-owned documents remain usable offline.
- Fonts must have verified redistribution and embedding licences.
- “Print-ready” requires measurable physical dimensions, embedded fonts, and verified output—not merely a high-resolution screenshot.

## Present reality

- The old JavaScript prototype was removed on 2026-07-25 and replaced with a clean strict-TypeScript Foundation.
- Canonical document schema v1, point-based geometry, stable IDs, referential validation, page/object commands, Dexie recovery, and baseline `.urdup` ZIP round trips are implemented.
- The application shell can add/remove pages, add a canonical rectangle, open validated packages, download packages, and display verified Urdu.
- Fabric is installed for the next canvas-adapter phase but is not allowed to own canonical state.
- Tiptap, Yjs, WebRTC, jsPDF, and html2canvas are not installed in the clean Foundation.
- The next implementation work is to complete Foundation persistence defenses and build the Fabric canvas adapter.

## Open decisions

- Final product name and licence.
- Exact rich-text schema and supported version-one marks/nodes.
- Final production PDF technology after the export spike.
- Whether collaboration is self-hosted, managed, or both.
- Whether legacy InPage import is technically and legally viable.
