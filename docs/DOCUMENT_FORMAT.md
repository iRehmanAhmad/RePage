# `.urdup` Document Format

Status: proposed version-one contract

## 1. Goals

The format must be portable, versioned, inspectable, safe to import, efficient with binary assets, and independent of the UI libraries used to edit it.

## 2. Container

An `.urdup` file is a ZIP container:

```text
manifest.json
document.json
assets/<sha256>.<extension>
thumbnails/page-<page-id>.webp       # optional
metadata/fonts.json                   # optional cache/preflight information
```

ZIP entry paths are normalized relative paths. Absolute paths, parent traversal, devices, links, and duplicate normalized paths are rejected.

## 3. Manifest

Required fields:

```json
{
  "format": "application/vnd.urdup+zip",
  "schemaVersion": 1,
  "documentId": "uuid",
  "createdBy": "UrduPage",
  "createdWithVersion": "0.1.0",
  "createdAt": "2026-07-25T00:00:00.000Z",
  "modifiedAt": "2026-07-25T00:00:00.000Z",
  "documentEntry": "document.json",
  "assetCount": 0
}
```

Timestamps are metadata, not conflict-resolution clocks.

## 4. Canonical document

`document.json` contains only schema-approved values. Coordinates and dimensions use points. IDs are stable strings. Object order is explicit.

Page records include page size, orientation-derived dimensions, margins, bleed, guides, background, and ordered object IDs. Document sections (`sections`) define anchored multi-page section ranges (`startPageId`), column layouts, RTL column ordering, section break types (`next-page` / `continuous` / `odd-page` / `even-page`), headers/footers, and page numbering rules. Object records include a discriminated type, geometry, common appearance, type-specific properties, lock/visibility state, and accessibility metadata where applicable.

Text is structured rich-text JSON with explicit paragraph direction. Arbitrary HTML is not accepted as canonical content.

### 4.1 Image crop (Phase 4 batch 8)

An `image-frame` object may carry an optional `crop` record of insets — `{ left, top, right, bottom }`, each a finite number in the range 0–0.45 expressing the fraction of the source image trimmed from that edge. The crop is non-destructive: the stored asset bytes are never modified, and every renderer (canvas, print/PDF, DOCX via `a:srcRect`) shows the source region that remains after trimming the insets, stretched into the frame. Absent or all-zero insets mean uncropped. No migration is needed: the field is optional, so older documents remain valid unchanged.

### 4.2 Explicit breaks and page-break-before (Phase 4 batch 10)

A story paragraph's inline content may contain a **break node**: `{ "type": "break", "breakType": "page" | "column" }` — a zero-width inline atom, sibling of `hardBreak`. It marks the point where layout leaves the current page (or column) while staying in the same section: no page setup, headers, or numbering change. Layout honors it in pagination, in linked-frame flow (page break → next frame on a later page, else overflow; column break → next frame), and in export (DOCX: `<w:br w:type="page|column"/>`). A paragraph may also carry **`pageBreakBefore`** (optional boolean; absent = false): the paragraph starts at the top of the next page (DOCX: `<w:pageBreakBefore/>`). Both fields are optional, so older documents remain valid unchanged — no migration.

Section `breakType` additionally accepts `odd-page` / `even-page`: the section starts on the next physical page with that parity. When parity requires it, layout inserts ONE implicit blank page before the section's first page. The blank is a layout artifact only — it is never stored as a page record; it prints as a genuinely blank page carrying the previous section's header/footer, and page numbering continues across it.

### 4.3 Per-document spellcheck ignore list (Phase 4 batch 8)

Document metadata may carry `spellcheckIgnoredWords`: an optional array of non-empty strings — the words the user chose to "ignore all" in THIS document only. It is distinct from the session ignore (never persisted) and the personal dictionary (global to the user, stored outside the document). Older documents without the field remain valid; clearing the list removes the field.

### 4.4 Kashida justification mode (Phase 4 batch 11)

A story paragraph may carry **`justificationMode`**: `"space"` or `"kashida"` (optional; absent = default — `"kashida"` for RTL paragraphs, `"space"` for LTR). It only takes effect when the paragraph's `alignment` is `"justify"`. `"space"` widens word gaps; `"kashida"` stretches joinable Arabic letters with tatweel (U+0640) inserted at valid joining points (never after right-joining letters, never across a ZWNJ, never between a base letter and its combining marks, capped per point). **Kashida is a layout/rendering effect only: the stored text NEVER contains inserted tatweels** — renderers compute stretch from the stored text at layout time, and the clipboard, spellcheck and exported text stay byte-identical. DOCX export maps the effective mode to Word's native kashida justification (`<w:jc w:val="mediumKashida"/>` vs `"both"`), and DOCX import maps `mediumKashida`/`highKashida`/`lowKashida` back to `"kashida"`. No migration: the field is optional.

### 4.5 Image adjustments (Phase 4 batch 11)

An `image-frame` object may carry an optional **`adjustments`** record: `{ brightness, contrast }` as percentages 0–200 (100 = untouched) plus mirror flags `{ flipH, flipV }` (booleans). Like crop (§4.1) the adjustment is non-destructive — asset bytes are never modified — and every renderer derives the same picture from the shared helpers: canvas (Fabric `Brightness`/`Contrast` filters + `flipX`/`flipY`), print (CSS `filter` + `scale()` transform), DOCX (DrawingML `flipH`/`flipV` on `a:xfrm`). Composition rule: flips mirror the CROPPED visible region as a whole. DOCX has no reliable brightness/contrast equivalent, so tone adjustments are counted in the export report instead of being exported; mirroring IS exported. Absent (or all-neutral) means unadjusted; setting neutral values removes the field. No migration.

### 4.6 Text on a circle (Phase 4 batch 11)

A `text-frame` object may carry an optional **`textOnPath`** record: `{ kind: "circle", startAngleDeg, flip }` — `startAngleDeg` rotates the ring anchor (0 = top, or bottom when `flip` is true) clockwise, normalized to [0, 360); `flip` renders the bottom-arc badge convention (text reads without turning the page). The record changes only how the frame's story text is RENDERED (canvas and print share one geometry helper in `domain/geometry/circleText.ts`): the story text itself is unchanged, and removing the record restores normal frame rendering. Ring layout splits text into shaping-safe segments — Arabic segments break only where letter joining itself breaks, so letter forms are preserved. The paged body editor does not render body stories on a path (frames only). No migration: the field is optional.

### 4.7 Page-number styles (Phase 4 batch 11)

Section `pageNumbering.style` accepts `"urdu"` (Urdu digits), `"western"` (Latin digits), `"abjad"`, `"roman"`, `"roman-upper"` and `"urdu-letters"`. **Abjad** is the proper additive Arabic abjad system (ا=1 … غ=1000; thousands are a coefficient letter followed by غ, e.g. 2024 = بغکد) — it replaces an earlier modulo placeholder that produced wrong values above 9. **Roman** covers 1–3999 (out-of-range values fall back to western digits). **Urdu-letters** is a bijective base-38 sequence over the Urdu alphabet (ا ب پ … ے, then اا, اب, …), like spreadsheet column letters. The styles apply everywhere a page number is rendered: section headers/footers, `{page}`/`{pages}` tokens (totals are formatted in the same style), and computed parity-blank pages.

### 4.8 Character styles (Phase 4 batch 12)

A text run may carry an optional **`characterStyleId`**: the id of a named character style in the document's style library, `styles.characterStyles` (a record of `{ id, name, fontFamily?, fontSize?, color?, bold?, italic?, underline?, language? }`, where `language` is `"ur"` or `"en"`). The reference is live: **effective formatting = the style's properties, overridden per-property by the run's own marks (direct formatting wins)** — the same precedence Word applies between a character style and direct run properties. Editing the style updates every run that references it; nothing about the style is ever copied into the run. Deleting a style is appearance-preserving: before the registry entry is removed, every referencing run's effective formatting is baked in as direct marks (only the properties a character style can carry).

Registry rule: a document whose `styles` has no `characterStyles` key reads as if it held the built-in set (`emphasis`, `title_lead`); the first mutating command materializes the full set into the document, after which the document's own registry is authoritative — including deletions of built-ins. Older documents therefore remain valid unchanged, and no migration is needed (both fields are optional).

Interchange: DOCX export emits a `w:style` definition of `w:type="character"` for every style the exported runs reference and points each run at it with `<w:rStyle>`; for style-covered properties the exporter does NOT bake frame defaults into the run's direct `w:rPr` (Word applies direct properties over the style, which would hide it). DOCX import parses character style definitions from `word/styles.xml` into the registry (the file's definition wins on id conflicts with the built-ins, since its runs were written against it) and restores `characterStyleId` on runs whose `w:rStyle` names a style the file actually defines. References to undefined styles are dropped on import rather than stored dangling.

## 5. Assets

- Each asset is addressed by SHA-256 digest.
- The document records media type, byte size, pixel dimensions when applicable, original filename, and package entry.
- Imported dimensions are decoded and verified rather than trusted from JSON.
- External linked assets may be supported later but must have an embedded fallback or a clear missing state.
- Font binaries are not embedded in editable packages by default; packaging fonts requires licence and product-policy review.

## 6. Import limits

Initial defensive limits should be constants with tests and user-friendly messages:

- Maximum total compressed and uncompressed package size.
- Maximum entry count.
- Maximum compression ratio.
- Maximum individual image dimensions and decoded pixel count.
- Maximum pages, objects, text length, and nesting depth.
- Maximum JSON depth and string lengths.

Exact defaults are chosen during Foundation using representative documents.

## 7. Validation and migrations

Import sequence:

1. Verify container and paths.
2. Enforce size/resource limits before full extraction.
3. Parse and validate manifest.
4. Reject unsupported future major schema versions without modification.
5. Parse and validate document JSON.
6. Run sequential pure migrations.
7. Verify referenced assets and hashes.
8. Produce canonical in-memory domain data.

Migrations are deterministic and never overwrite the original file automatically.

## 8. Save guarantees

- Explicit save produces a complete new package.
- Desktop saves use atomic replacement where possible.
- Autosave uses an internal recovery representation and does not repeatedly rewrite the user’s package.
- A failed save never clears the dirty flag.
- Round-trip tests compare semantic documents, allowing only documented metadata changes.

## 9. Compatibility

The `.urdup` extension does not claim compatibility with InPage `.inp` or other proprietary formats. Importers for foreign formats are independent adapters that produce validated canonical data.
