# Changelog

All notable released changes are documented in this file.

## [v0.1.0-M5] - 2026-07-25

### M5 — Collaboration Preview
- **Yjs CRDT Document Binding**: Mapped canonical page order, pages, objects, stories, styles, and comments to Yjs shared maps with binary asset isolation (`crdtDoc.ts`).
- **Ephemeral Awareness**: Isolated live user presence (cursor, selection, active page, display name, user color) inside Awareness protocol (`awareness.ts`).
- **Collaborative Conflict Engine**: Last-Writer-Wins movement/resize resolution, delete-over-edit precedence, cascading page deletion, default style fallback, linked-story reflow recomputation, and scoped local `Y.UndoManager` (`Ctrl+Z`).
- **Resumable Asset Transfer**: Content-addressed SHA-256 binary hashing, separate 64 KB chunked transfer path outside Yjs maps, 50 MB size limit, 5 MB/s rate limit, and missing-asset status tracking.
- **WebRTC Networking**: Production signaling (`wss://signaling.repage.org`), WebRTC STUN/TURN ICE configurations, forced-relay policy for enterprise firewalls, auto-reconnection backoff, small-room editor limits (Max 4 editors), and connectivity diagnostics (`networkProvider.ts`).
- **Identity & Authorization**: Owner/editor/viewer roles, 256-bit cryptographically secure high-entropy tokens, expiring invitations, token revocation, participant removal, room state machine, document version compatibility checks, and append-only audit trail logging (`authEngine.ts`).
- **Collaboration UX**: Live remote cursor/selection overlays (`RemoteCollaboratorOverlay.tsx`), topbar status & participant list (`CollaborationBar.tsx`), and threaded comments/replies panel (`CommentsPanel.tsx`).

## [v0.1.0-M4] - 2026-07-25

### M4 — Cross-Platform Desktop Release Candidate
- **Tauri 2 Desktop Shell**: Cross-platform desktop shell integration with least-privilege security policy (`src-tauri/`).
- **PlatformServices Abstraction**: Platform service provider supporting browser DOM fallback and Tauri 2 native desktop IPC.
- **Native File Workflows**: Open, Save, Save As, atomic file write (`.urdup.tmp` -> target), recent files history, `.urdup` file associations, drag-and-drop file opening (`DragAndDropOverlay.tsx`), and conflict detection.
- **Desktop OS Integration**: Window title dirty indicator (`*`), native menu keyboard shortcuts (`Ctrl+S`, `Ctrl+O`, `Ctrl+P`), system print dialog launcher, OS dark/light theme listeners, High-DPI backing scale, and ARIA screen reader announcer.
- **Multi-Platform Installers**: Windows NSIS (`.exe`), macOS DMG (`.dmg`), and Linux AppImage/DEB/RPM targets with explicit `webkit2gtk-4.1` and `fontconfig` system dependencies.
- **Signed Application Updates**: Signed update manifest verification, `stable`/`beta` release channels, failed-update rollback recovery policy, and explicit user-driven document migration policy (`updateManager.ts`).

## [v0.1.0-M3] - 2026-07-25

### M3 — Document Production Beta
- **Linked Text Frames**: Story overflow reflow across multiple linked text frames.
- **Master Pages**: Inheritance, headers, footers, margins, and page object overrides.
- **Page Numbering**: Automatic page numbering fields in East Arabic ( Urdu / 1، 2، 3 ), Roman, and Abjad numeration.
- **Preflight Diagnostics**: Panel detecting missing fonts, low-res images, overflowing text, and unlinked stories.
- **Prepress Vector Export**: Standalone vector SVG and PDF export engine with embedded fonts and crop marks.

## [v0.1.0-M2] - 2026-07-25

### M2 — Urdu Typography Beta
- **Urdu Typography Engine**: HarfBuzz Nastaliq shaping, Unicode Bidirectional Algorithm (UBA) support, bidi overrides, and glyph-clipping prevention.
- **Visual Keyboard**: On-screen phonetic Urdu visual keyboard overlay (`VisualKeyboard.tsx`).
- **Text Editor**: Tiptap DOM rich-text overlay supporting character/paragraph styles and find/replace.

## [v0.1.0-M1] - 2026-07-25

### M1 — Local Page-Layout Alpha
- **Fabric Canvas Adapter**: Bi-directional adapter mapping canonical page objects to Fabric objects (`fabricAdapter.ts`).
- **Command History**: Undo/redo transaction history engine (`transactionHistory.ts`).

## [v0.1.0-M0] - 2026-07-25

### M0 — Foundation
- Rebuilt prototype in strict TypeScript (`RePage` branding).
- Canonical schema version 1 document types and referential validators.
- IndexedDB recovery snapshots and `.urdup` package zip persistence.
