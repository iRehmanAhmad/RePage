# ADR-0001: Framework-independent canonical document model

Status: Accepted  
Date: 2026-07-25

## Context

The prototype stores page data close to Fabric serialization and component state. Fabric, DOM editors, Yjs, and export renderers have different state requirements and release cycles. Treating any one of them as the document format creates lock-in and makes validation, migration, testing, and deterministic export difficult.

## Decision

Define a versioned TypeScript domain model that contains only validated serializable values. React, Fabric, Tiptap, Yjs, persistence, and export interact through adapters and commands. Canonical geometry uses physical document units rather than viewport pixels.

## Consequences

- Additional adapter code is required.
- Domain logic becomes testable without a browser.
- File migrations and collaboration mappings become explicit.
- Fabric or Tiptap can be upgraded or replaced without redefining user documents.

## Alternatives considered

- Persist Fabric JSON directly: rejected because it couples files to rendering internals.
- Use Yjs as the only model: rejected because offline non-collaborative documents and exports should not require CRDT internals.
- Store arbitrary HTML: rejected because it is hard to validate, migrate, secure, and render deterministically.

## Validation

Foundation requires semantic serialization round trips and domain tests that import no UI framework.
