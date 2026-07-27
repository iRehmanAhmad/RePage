# ADR-0008: Page Layout & Section Model Architecture

- **Status**: Accepted
- **Date**: 2026-07-27
- **Context**: RePage requires a robust, anchored section architecture for long documents (books, multi-section reports, bilingual manuals) without corrupting physical page geometry or losing data on save/reopen.

## Decision

1. **Page Geometry Invariants**:
   - `Page.width`, `Page.height`, `Page.margins`, `Page.bleed`, and `Page.background` remain the canonical realized physical geometry of each page.
   - All measurements are stored strictly in PDF points (72 points per inch), never viewport pixels.

2. **Section Model & Boundary Rules**:
   - `DocumentSection` records define section-wide properties:
     - `startPageId`: Explicit page anchor marking where the section begins.
     - `breakType`: `'next-page'` or `'continuous'`.
     - `columns`: Section body columns (1–4) with `columnGap` and `rtlColumnOrder`.
     - `headerStoryId` & `footerStoryId`: Anchored running header/footer text stories.
     - `pageNumbering`: Localized page numbering settings (`urdu` | `western` | `abjad`, `startAt`, `restartAtSection`, `prefix`, `suffix`).
   - The first page of the document (`pageOrder[0]`) always belongs to a default section.
   - Section ranges are derived deterministically from `startPageId` and `pageOrder`.
   - Applying page setup to a section updates all pages within that section range.

3. **Schema Validation & Package Integrity**:
   - `sections` is validated by `documentSchema` in Zod (`sectionSchema`).
   - `validateDocumentReferences` enforces:
     - All `startPageId`s exist in `pages`.
     - Section `startPageId`s are unique.
     - Section `startPageId`s appear in `pageOrder` sequence.
     - Referenced header/footer stories exist in `stories`.
   - `.urdup` package import/export preserves `sections` completely without data loss.

4. **Change Discipline**:
   - Section creation and modifications must be pure functions returning a new `RePageDocument` and executing through `updateDocument()` to participate in undo/redo history.

## Consequences

- No silent stripping of section metadata during package serialization or Zod parsing.
- Deleting a page automatically cleans up or re-anchors any section that started on that page.
- Clear separation between canonical physical measurements (points) and display units (mm/in/pt).
