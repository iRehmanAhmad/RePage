# RePage

RePage is a modern, offline-first, cross-platform Urdu desktop-publishing application. Its purpose is to offer a simpler and more dependable alternative to legacy Urdu publishing tools while preserving professional page-layout capabilities.

The repository contains a clean, strict TypeScript implementation featuring a canonical schema version 1 document engine, Fabric canvas adapter, DOM rich-text editor, master pages, linked text frames, preflight diagnostics panel, standalone vector SVG/PDF prepress exporter, Tauri 2 cross-platform desktop shell (Windows NSIS, macOS DMG, Linux AppImage/DEB/RPM), signed update manager, Yjs CRDT real-time multi-user collaboration engine, WebRTC networking, and identity authorization.

## Product priorities

1. Correct Urdu and mixed-direction typography.
2. Safe documents, autosave, recovery, and forward-compatible files.
3. Easy professional page layout.
4. Predictable screen and print output.
5. Offline Windows, macOS, and Linux applications.
6. Real-time collaboration and cloud services.

## Verification & development commands

```powershell
npm install
npm run dev
npm run lint
npm run check
npm run build
```

## Project documentation

Read these files in order before changing architecture or scope:

1. [MEMORY.md](MEMORY.md)
2. [PROJECT_STATUS.md](PROJECT_STATUS.md)
3. [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md)
4. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
5. [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
6. [ROADMAP.md](ROADMAP.md)
7. [docs/DISTRIBUTION.md](docs/DISTRIBUTION.md)

Specialized specifications:

- [Document format](docs/DOCUMENT_FORMAT.md)
- [Typography](docs/TYPOGRAPHY.md)
- [Dependencies](docs/DEPENDENCIES.md)
- [Quality strategy](docs/QUALITY.md)
- [Security model](docs/SECURITY.md)
- [Risk register](docs/RISK_REGISTER.md)
- [Development workflow](docs/WORKFLOW.md)
- [Contributing guide](CONTRIBUTING.md)
- [Architecture decisions](docs/adr/README.md)

## Repository status

- **Product name**: RePage
- **Application type**: Desktop-first DTP editor with browser core
- **Frontend stack**: React 19, strict TypeScript, Tailwind CSS, Vite
- **Canvas adapter**: Fabric canvas geometry adapter
- **Text editor**: Tiptap / ProseMirror DOM rich-text adapter
- **Desktop shell**: Tauri 2 (`src-tauri/`) with least-privilege security
- **Package extension**: `.urdup` (`application/vnd.urdup+zip`)
- **Completed Milestones**: M0 Foundation, M1 Page Layout, M2 Urdu Typography, M3 Document Production, M4 Desktop RC, M5 Collaboration Preview (100% Verified)

