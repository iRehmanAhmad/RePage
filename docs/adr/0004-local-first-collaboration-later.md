# ADR-0004: Local-first publishing precedes collaboration

Status: Accepted  
Date: 2026-07-25

## Context

The original prototype combines publishing, P2P collaboration, and audio. Reliable cross-network WebRTC still requires signaling and often TURN, while collaboration adds identity, authorization, persistence, conflict, and asset-transfer requirements. InPage users primarily need dependable typography, files, layout, and export.

## Decision

Ship and validate local offline authoring before production collaboration. Keep Yjs as the preferred future CRDT but behind an optional adapter. Do not make accounts, servers, or peers necessary to create, save, reopen, recover, or export a document.

## Consequences

- Collaboration and audio arrive later than the original concept suggested.
- The core product becomes useful without operating infrastructure.
- The canonical model must still be designed with stable IDs and future concurrent edits in mind.
- Production networking receives its own threat model and reliability gate.

## Alternatives considered

- P2P-first document storage: rejected because documents become unavailable when peers are offline and network traversal is unreliable.
- Server-authoritative editor from the beginning: rejected because it conflicts with local ownership and offline operation.

## Validation

The collaboration preview must demonstrate convergence and network failure recovery without weakening local autosave or package ownership.
