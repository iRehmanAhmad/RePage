# Dependency Policy and Register

Status: initial review; versions in `package-lock.json` remain authoritative for the prototype

## 1. Admission criteria

Before a production dependency is adopted, record:

- Exact purpose and owning subsystem.
- Licence and compatibility with the project’s eventual licence.
- Release/activity history and maintainership.
- Documentation, tests, and security posture.
- Bundle/runtime cost.
- Data-format or API lock-in.
- Exit strategy or adapter boundary.
- Whether essential capabilities require a paid extension or service.

GitHub popularity is supporting evidence, not proof of correctness.

## 2. Planned core dependencies

| Dependency | Role | Current disposition | Boundary/concern |
|---|---|---|---|
| React | UI composition | Keep | Domain remains React-independent |
| Vite | Development/build | Keep | Pin supported Node version |
| TypeScript | Domain and application types | Add | Strict incremental migration |
| Fabric.js | Canvas interaction | Keep behind adapter | Not canonical rich-text or file model |
| Tiptap/ProseMirror | Structured DOM text editing | Keep/evaluate extensions | Open-source core only by default |
| Dexie | IndexedDB persistence | Keep | Browser recovery adapter |
| JSZip | Package container | Keep with hardening | ZIP bomb/path/resource protections required |
| Zod or JSON Schema validator | Runtime validation | Select during Foundation | Avoid duplicating schema truth manually |
| Yjs | Optional collaboration | Keep, later phase | Domain remains usable without it |
| Tauri 2 | Desktop packaging | Add at desktop gate | Least-privilege capability design |

## 3. Prototype dependencies requiring qualification

| Dependency | Issue | Policy |
|---|---|---|
| html2canvas | Rasterizes a DOM representation | Allow for preview/raster output only |
| jsPDF | Current use inserts a screenshot | Do not designate current output production-ready |
| y-webrtc | Public signaling/reliability and full-mesh limitations | Experimental only until collaboration design |
| core-js | Need and target-browser impact unclear | Remove if build targets do not require it |
| lucide-react | Legacy UI icons | Do not extend | Retain only while existing usages are migrated |
| @fluentui/react-icons | Shared Fluent command icon set | Keep | MIT-licensed UI-only dependency; imported through `src/ui/icons/AppIcon.tsx` so icon names and sizing remain consistent |

## 4. Referenced repositories that are not application dependencies

- Navees/CRULP: keyboard-layout specification reference.
- Gulzar/Noto/BH repositories: pinned font artifacts and test sources, not runtime code APIs.
- Nastaliq engineering repositories: research and fixture guidance.
- UrduHack: linguistic reference; its Python runtime is not automatically suitable for the application.
- `malisubhani/inpage`: not considered a reusable implementation engine.

## 5. Versioning and supply chain

- Commit lockfiles.
- Avoid unpinned CDN runtime dependencies.
- Self-host approved production fonts and critical static assets.
- Review major upgrades separately and run visual typography/export regression tests.
- Generate dependency notices before distribution.
- Establish vulnerability scanning and a response policy before public release.
- Do not run install scripts from unknown packages without review.

## 6. Font register requirements

Every packaged font needs its own record with upstream source, artifact hash, version, OFL reserved font names if any, licence file, redistribution permission, document/PDF embedding permission, and QA corpus result.
