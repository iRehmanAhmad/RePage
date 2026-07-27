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

Page records include page size, orientation-derived dimensions, margins, bleed, guides, background, and ordered object IDs. Document sections (`sections`) define anchored multi-page section ranges (`startPageId`), column layouts, RTL column ordering, section break types (`next-page` / `continuous`), headers/footers, and page numbering rules. Object records include a discriminated type, geometry, common appearance, type-specific properties, lock/visibility state, and accessibility metadata where applicable.

Text is structured rich-text JSON with explicit paragraph direction. Arbitrary HTML is not accepted as canonical content.

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
