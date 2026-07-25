# ADR-0002: Hybrid canvas geometry and DOM rich-text editing

Status: Accepted  
Date: 2026-07-25

## Context

Fabric provides mature object selection and transformation, but professional Urdu editing requires browser selection, composition, clipboard, accessibility, structured rich text, and complex bidi behavior. Implementing all of those directly in canvas would duplicate mature editor work.

## Decision

Use Fabric for page-object geometry and interaction. Edit text in a precisely aligned DOM overlay using Tiptap/ProseMirror. Store structured text in the canonical domain model. Non-editing rendering and export must be checked against the editing view.

## Consequences

- Overlay transforms, rotation, clipping, and zoom synchronization are technically demanding.
- Native text editing behavior and Yjs bindings become available.
- Fabric remains focused on what it does well.
- A typography spike must validate editing/display layout parity.

## Alternatives considered

- Fabric `IText`/`Textbox` for all text: rejected as the default until it can meet the Urdu editing corpus.
- Entire editor in DOM/CSS: retained as a possible future alternative, but object manipulation and pagination would require significant custom work.
- Custom shaping/caret engine: rejected as unnecessary reinvention for the initial product.

## Validation

The Urdu rich-text phase cannot exit until verified mixed-bidi fixtures edit and render within documented tolerance.
