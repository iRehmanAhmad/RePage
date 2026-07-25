# Architecture Decision Records

ADRs record decisions that are expensive to reverse or affect multiple subsystems.

## Status values

- Proposed
- Accepted
- Superseded
- Rejected

## Required sections

Each ADR includes context, decision, consequences, alternatives, validation, and status. A later ADR supersedes an earlier one; do not rewrite accepted history merely because the decision changed.

## Index

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-canonical-document-model.md) | Framework-independent canonical document model | Accepted |
| [0002](0002-hybrid-canvas-dom-editor.md) | Fabric geometry with DOM rich-text editing | Accepted |
| [0003](0003-desktop-shell-strategy.md) | Shared web core with gated Tauri desktop shell | Accepted |
| [0004](0004-local-first-collaboration-later.md) | Offline local publishing precedes collaboration | Accepted |

## Template

```markdown
# ADR-NNNN: Title

Status: Proposed
Date: YYYY-MM-DD

## Context

## Decision

## Consequences

## Alternatives considered

## Validation
```
