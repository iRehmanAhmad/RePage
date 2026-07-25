# Repository Instructions

These instructions apply to every human or automated contributor working in this repository.

## Read order

Before meaningful work, read:

1. `MEMORY.md`
2. `PROJECT_STATUS.md`
3. The relevant specification under `docs/`
4. The active milestone in `docs/IMPLEMENTATION_PLAN.md`
5. Any applicable ADR under `docs/adr/`

## Sources of truth

When documents disagree, use this precedence:

1. Accepted ADRs for architectural decisions
2. `docs/PRODUCT_REQUIREMENTS.md` for product scope
3. `docs/ARCHITECTURE.md` for system boundaries
4. Specialized specifications under `docs/`
5. `docs/IMPLEMENTATION_PLAN.md` and `ROADMAP.md` for sequencing
6. `PROJECT_STATUS.md` for present state
7. `MEMORY.md` for concise durable context
8. Code and comments for implementation detail

If code disagrees with an accepted specification, do not silently redefine the specification. Fix the code or propose an ADR/specification update.

## Change discipline

- Preserve unrelated and uncommitted user changes.
- Treat the current application as a prototype until the Foundation milestone is complete.
- Do not make Fabric JSON the permanent document format.
- Do not store viewport pixels as canonical physical page measurements.
- Do not place large image binaries directly into Yjs shared maps.
- Do not call screenshot-based PDF output “print-ready” or “vector PDF.”
- Do not bundle a font without confirmed redistribution and embedding rights.
- Do not enable network collaboration without a defined identity, invitation, persistence, and abuse model.
- Do not normalize Urdu text destructively. Preserve intentional joiners, bidi controls, and combining marks unless the user explicitly requests normalization.
- All source and documentation files must be valid UTF-8.

## Architecture boundaries

- `domain/` owns canonical document types and invariants.
- `editor/commands/` is the only normal mutation path for canonical documents.
- `editor/canvas/` adapts canonical objects to Fabric and back; Fabric remains replaceable.
- `editor/text/` owns DOM rich-text editing and must not expose arbitrary HTML as canonical content.
- `persistence/` owns autosave, package import/export, validation, migrations, and asset storage.
- `export/` is independent of the interactive viewport.
- `collaboration/` translates domain operations to shared state and is optional at runtime.
- UI components may issue commands but must not become the document database.

## Required validation

Run the narrowest relevant checks while iterating and all applicable checks before handoff:

```powershell
npm run lint
npm run build
```

As test scripts are added, also run unit, integration, visual, and package-format tests relevant to the change. Never report a check as passed unless it was actually executed.

## Documentation maintenance

Update documentation in the same change when any of these occur:

- A decision changes a system boundary: add or supersede an ADR.
- A file-format field changes: update `docs/DOCUMENT_FORMAT.md` and add a migration.
- A milestone begins or ends: update `PROJECT_STATUS.md`.
- A durable fact or constraint changes: update `MEMORY.md`.
- A dependency is introduced or replaced: update `docs/DEPENDENCIES.md`.
- A new risk is accepted: document the owner, mitigation, and exit criteria.

`MEMORY.md` is not a diary. Keep it short, current, and factual. Historical details belong in Git history, ADRs, or release notes.

## Definition of done

A task is complete only when:

- The requested behavior is implemented.
- Appropriate tests or reproducible verification exist.
- Urdu and mixed-direction behavior has been considered where relevant.
- Failure and recovery behavior has been considered.
- Documentation and status are current.
- No new unexplained warnings, mojibake, or unvalidated input paths are introduced.
