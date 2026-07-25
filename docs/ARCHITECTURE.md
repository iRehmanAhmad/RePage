# System Architecture

Status: target architecture; current Foundation implements the domain, command, persistence, browser-platform, and UI-shell boundaries

## 1. Architectural shape

UrduPage uses a shared React/TypeScript editor core and an optional Tauri desktop shell. The canonical document domain remains independent of browser rendering, native packaging, collaboration, and export technologies.

```text
Desktop shell / Browser host
          │
Application services and command bus
          │
Canonical document domain
   ┌──────┼──────────┬────────────┐
   │      │          │            │
Canvas  Rich text  Persistence  Export layout
adapter adapter     and assets   and renderer
   │      │          │            │
Fabric  Tiptap    Dexie/Tauri   selected PDF stack
          │
Optional collaboration adapter
          │
Yjs + transport/provider
```

## 2. Target repository structure

The migration should converge on this structure without a disruptive all-at-once rewrite:

```text
/
├── AGENTS.md
├── MEMORY.md
├── PROJECT_STATUS.md
├── ROADMAP.md
├── README.md
├── CHANGELOG.md
├── docs/
│   ├── PRODUCT_REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── DOCUMENT_FORMAT.md
│   ├── TYPOGRAPHY.md
│   ├── DEPENDENCIES.md
│   ├── QUALITY.md
│   ├── SECURITY.md
│   ├── WORKFLOW.md
│   └── adr/
├── public/
│   ├── fonts/
│   ├── icons/
│   └── templates/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes/
│   │   ├── providers/
│   │   └── commands/
│   ├── domain/
│   │   ├── document/
│   │   ├── geometry/
│   │   ├── rich-text/
│   │   ├── assets/
│   │   └── validation/
│   ├── editor/
│   │   ├── canvas/
│   │   ├── text/
│   │   ├── selection/
│   │   ├── snapping/
│   │   ├── history/
│   │   └── commands/
│   ├── persistence/
│   │   ├── autosave/
│   │   ├── indexeddb/
│   │   ├── package/
│   │   └── migrations/
│   ├── export/
│   │   ├── layout/
│   │   ├── raster/
│   │   ├── pdf/
│   │   └── preflight/
│   ├── collaboration/
│   │   ├── model/
│   │   ├── awareness/
│   │   ├── providers/
│   │   └── identity/
│   ├── typography/
│   ├── keyboard/
│   ├── templates/
│   ├── ui/
│   │   ├── components/
│   │   ├── panels/
│   │   ├── dialogs/
│   │   └── themes/
│   ├── platform/
│   │   ├── browser/
│   │   └── desktop/
│   └── test/
│       ├── fixtures/
│       ├── integration/
│       └── visual/
├── src-tauri/                 # introduced at desktop milestone
├── scripts/
│   ├── verify-utf8.*
│   ├── inspect-package.*
│   └── build-font-fixtures.*
└── tests/
    ├── e2e/
    ├── packages/
    └── exports/
```

## 3. Canonical document domain

The canonical document is plain, validated, serializable domain data. It must not contain live Fabric objects, DOM nodes, object URLs, React state, Yjs instances, functions, or arbitrary HTML.

Suggested top-level types:

```ts
type UrduPageDocument = {
  schemaVersion: number
  id: string
  metadata: DocumentMetadata
  settings: DocumentSettings
  pageOrder: string[]
  pages: Record<string, Page>
  objects: Record<string, PageObject>
  stories: Record<string, TextStory>
  styles: StyleCatalog
  assets: Record<string, AssetReference>
}
```

Text frames refer to a story ID. A story may initially belong to one frame; linked frame flow can later reference the same story with ordered frame links.

## 4. Units and transforms

- Canonical geometry uses PDF points: 72 points per inch.
- A4 is approximately 595.276 × 841.89 points.
- Viewport pixels are derived using zoom and device scale.
- Export uses canonical dimensions directly.
- Store full numeric precision; round only for inspector display.
- Every conversion is centralized and unit-tested.

## 5. Mutation and history

All ordinary document mutations travel through commands:

```text
UI intent → validated command → domain reducer/service → new document/revision
                                      ├→ local history
                                      ├→ autosave scheduler
                                      └→ collaboration adapter
```

Examples include `AddPage`, `MoveObjects`, `SetObjectStyle`, `ReplaceStoryContent`, and `RelinkAsset`.

Pointer dragging may use transient viewport state. Durable state should be committed at controlled intervals and at gesture completion. This prevents excessive autosave and CRDT traffic.

## 6. Canvas adapter

Fabric is an interaction and rendering adapter:

- Canonical objects produce Fabric objects.
- Fabric events produce domain commands.
- Fabric-specific properties remain in the adapter.
- Unknown Fabric fields are never silently persisted.
- Text frame borders/handles may be Fabric objects while actual text editing occurs in a DOM overlay.

## 7. Rich-text adapter

Tiptap/ProseMirror edits a constrained rich-text schema. Version one should support paragraphs, hard breaks, direction, alignment, font family, font size, color, bold, italic where meaningful, underline, and tracking only after typography verification.

Arbitrary pasted HTML must be sanitized and converted into the constrained schema. The canonical file contains structured rich-text JSON, not HTML strings.

## 8. Persistence

### Browser host

- Dexie/IndexedDB stores autosave snapshots, assets, thumbnails, recovery metadata, and document indexes.
- Autosave is debounced, revisioned, and performed off the interaction hot path.

### Desktop host

- Tauri provides native dialogs and atomic file replacement.
- Save writes a temporary sibling file, flushes it, then replaces the target where platform semantics allow.
- Recovery remains separate from the user’s last explicit save.

## 9. Export

Export consumes canonical document data, resolved assets, and pinned font resources. It does not capture toolbars, selection boxes, or the current zoomed viewport.

The export subsystem has four stages:

1. Preflight and resource resolution.
2. Deterministic page layout.
3. Raster or vector rendering.
4. Output validation and download/save.

## 10. Collaboration

Collaboration is an adapter, not the domain model. Yjs shared structures mirror stable domain concepts. Awareness contains only ephemeral cursor, selection, active page, display name, and color.

Images use a dedicated asset channel or durable object storage; they are referenced by content hash in the CRDT. Production collaboration requires signaling, TURN fallback, identity, invitations, roles, revocation, and a durable-storage decision.

## 11. Platform boundary

Application code calls a `PlatformServices` interface for dialogs, filesystem, clipboard, printing, updates, and recent files. Browser and Tauri implementations sit behind that interface to avoid desktop checks scattered through UI code.

## 12. Error model

Expected failures use typed results or domain errors. User-facing errors state what failed, whether data remains safe, and what action is possible. Unexpected errors enter an error boundary and preserve the latest recovery snapshot whenever safe.
