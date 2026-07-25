# RePage

RePage is a modern, offline-first, cross-platform Urdu desktop-publishing application. Its purpose is to offer a simpler and more dependable alternative to legacy Urdu publishing tools while preserving professional page-layout capabilities.

The repository contains a clean Foundation implementation built around a strict TypeScript canonical document model. It currently supports validated multi-page state, domain commands, IndexedDB recovery, safe baseline `.urdup` packaging, and a browser workspace shell. Canvas manipulation, rich-text editing, professional export, Tauri packaging, and collaboration remain later milestones.

## Product priorities

1. Correct Urdu and mixed-direction typography.
2. Safe documents, autosave, recovery, and forward-compatible files.
3. Easy professional page layout.
4. Predictable screen and print output.
5. Offline Windows, macOS, and Linux applications.
6. Optional collaboration and cloud services.

Voice calling and AI features are later differentiators. They must not delay the publishing foundation.

## Current commands

```powershell
npm install
npm run dev
npm run lint
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

- Product name: RePage
- Application type: desktop-first DTP editor with a shared web core
- Current frontend: React 19, strict TypeScript, and Vite
- Planned adapters: Fabric geometry layer and Tiptap/ProseMirror DOM rich-text layer
- Intended desktop shell: Tauri 2, after the browser core reaches its desktop-shell gate
- Primary document extension: `.urdup`
- Licence: not yet selected; do not publish or redistribute until decided

## Important limitations in the current foundation

- The workspace renders canonical objects but does not yet provide Fabric selection, dragging, or resizing.
- The starter Urdu story is displayed but not yet editable through the planned DOM rich-text adapter.
- `.urdup` import validates schema, references, entry count, size, and paths; assets, hashes, migrations, and compression-ratio defenses are still incomplete.
- Autosave writes recovery snapshots, but startup restore/discard UX is not yet implemented.
- No PDF or image exporter is present in the clean foundation.
- Tauri, collaboration, audio, templates, keyboard layouts, and professional DTP features are intentionally not yet installed.

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the actively maintained status.
