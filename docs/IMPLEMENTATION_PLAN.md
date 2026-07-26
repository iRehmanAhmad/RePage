# Detailed Implementation Plan

Status: Approved sequencing baseline (M0 through M5 COMPLETE; Milestone M6 — Urdu-first Home Ribbon IN PROGRESS)

The plan is gate-driven. A later phase may be researched early, but production feature work must not bypass unresolved data-loss, typography, or export gates.

## Active Workstream — Milestone M6: Urdu-first Home Ribbon

Duration: 8–10 weeks for one developer. Focus: making Home ribbon controls real and safe through canonical commands, Urdu-native authoring ergonomics, and strict button discipline.

### M6 Phase 0 — Confirm product direction and scope (COMPLETE)

- Resolve conflict between frame-first DTP and Word-style authoring: RePage is a Word-style Urdu word processor first, professional layout second.
- Home is optimized for ordinary Urdu writing first, then professional layout.
- Urdu Tools remains the home for advanced features: OCR, dictionary, character correction, keyboard editor, and normalization.
- Home contains only frequent, working actions.
- Every Home action must update the canonical document through commands; no UI-only state or direct browser editing shortcuts.
- Add-ins are deferred until a genuine plugin model exists.
- Deliverables: updated `PRODUCT_REQUIREMENTS.md`, `IMPLEMENTATION_PLAN.md`, `ADR-0005: Urdu-first Home-ribbon design`, and `HOME_RIBBON_INVENTORY.md`.

### M6 Phase 1 — Remove misleading and incomplete controls

- Reduce Home tab to controls that genuinely work.
- Remove or hide until implemented: Add-ins, Text Effects, Change Case, Sort A–Z, Multilevel List, Format Painter, Paragraph borders and shading, Advanced underline styles, Paste Special variants that do not behave differently, Quick Styles that only show a message.
- Keep initially: Paste, Cut, Copy, Font family and size, Bold, Italic, Underline, Font color and clear formatting, RTL/LTR direction, Alignment, Kashida justification, Bullets, numbering, indent, line spacing, Find, Replace, Select.
- Exit gate: no visible button can merely display a message while claiming to edit the document.

### M6 Phase 2 — Build the new Urdu-first Home layout

- Information structure: `Urdu Input | Clipboard | Font | Paragraph | Urdu Styles | Editing`.
- Urdu UI: groups begin from right side (RTL order). English UI retains LTR ordering.
- Urdu Input group: Navees / CRULP / English mode selector, Roman Urdu transliteration switch, Visual keyboard show/hide, Urdu vs Western numerals, Quick Urdu paragraph preset.
- Clipboard group: Paste, Cut, Copy, Paste clean Unicode.
- Font group: Installed Urdu font selector, Font size, Grow/shrink font, Bold, Italic, Underline, Highlight and font color, Clear formatting.
- Paragraph group: RTL/LTR direction, Right, centre, left, justify, Kashida justify, Bullets and numbering, Indent, Line spacing.
- Urdu Styles group: عام متن, عنوان ۱, عنوان ۲, شاعری, اقتباس.
- Editing group: Find, Replace, Select.
- Exit gate: fits clearly at 1280px width, defined overflow strategy at 1024px, no clipped style cards.

### M6 Phase 3 — Connect Home controls to real document commands

- Mutation flow: Home control → command registry → canonical document update → undo/redo → autosave → editor refresh.
- Selection-aware font and paragraph commands.
- Caret state detection.
- Undoable formatting transactions and save/reopen persistence.
- No direct `document.execCommand()` as normal mutation mechanism.
- Disabled controls when no text/compatible object selected.
- Special Urdu requirements: RTL direction separate from alignment; Kashida explicit formatting metadata (no destructive tatweel insertion); non-destructive mark preservation; visual order preserved on save/reopen.
- Exit gate: formatting selected Urdu paragraph, undoing, saving, reopening, and exporting produces identical result.

### M6 Phase 4 — Urdu input, fonts and safe paste

- Urdu input: Home-level mode selector for Navees, CRULP phonetic, English, Roman Urdu transliteration. Visual keyboard toggle.
- Fonts: Categories for Bundled verified fonts, Installed local fonts, Unavailable fonts (clearly marked), Manage fonts. No proprietary fonts presented as included.
- Safe paste: Keep formatting, Match document formatting, Plain Unicode text, Inspect character variants (preview + confirmation).
- Exit gate: pasted Urdu retains correct joining, mixed-direction text, Urdu punctuation, numerals, ZWNJ, ZWJ, RLM and LRM.

### M6 Phase 5 — Real Urdu styles and editing tools

- Canonical paragraph/character styles (Stable ID, Font reference, Size, Direction, Alignment, Spacing, Line height, Kashida behaviour, Save/export support).
- Initial Urdu style set: عام متن, عنوان ۱, عنوان ۲, شاعری, اقتباس. Real Nastaliq previews instead of `AaBb`.
- Find & Replace: Diacritic-aware matching, optional character-variant matching, clear search scope, safe Replace All preview.
- Exit gate: styles apply to real selected text, persist in `.urdup`, and appear correctly after reopen.

### M6 Phase 6 — Full Urdu localization and RTL interface

- Rename `اہم` to `ہوم`.
- Complete Urdu translations for ribbons, dialogs, menus, tooltips, ARIA labels.
- Mirror ribbon group order and dropdown placement in Urdu mode.
- Default to Urdu locale when OS locale is Urdu/Pakistan.
- Exit gate: Urdu mode has no unexplained English labels in Home experience.

### M6 Phase 7 — Accessibility, responsive behaviour and QA

- Resolution testing (1024×768, 1280×720, 1366×768, 1920×1080, 200% scale, light/dark/high-contrast themes).
- Scenario matrix: Urdu-only, English-only, Mixed Urdu/English, URLs/dates/currency, Poetry, Quranic marks/honorifics, copy/paste across sources, keyboard-only, screen readers, undo/redo/autosave/recovery.
- Validation: `npm run check:utf8`, `npm run lint`, `npm run build`, `npm run test`.
- Exit gate: all automated tests pass, zero regressions across resolution matrix.

### M6 Phase 8 — Small user validation release

- User panel: 5 InPage users, 5 Urdu writers/teachers/students, 3 publishing operators.
- 4 key tasks: type letter, paste/clean Urdu, format poetry page, bilingual heading.
- Success targets: 80% basic completion, 90% keyboard switch discovery, 0 Unicode corruption, 70% preference over current workflow.
- Exit gate: user validation metrics met.

---

## Phase 0 — Baseline and prototype quarantine

### Objective

Understand and preserve the prototype while establishing a reproducible baseline.

### Work

1. Record Node/npm versions and supported developer environment.
2. Run and record lint and production build results.
3. Add a minimal test runner and one smoke test.
4. Inventory all source files, dependencies, fonts, object types, save fields, and experimental features.
5. Scan for mojibake using known byte-pattern detection and manually verify representative Urdu literals.
6. If corruption is found later, recover from trusted source text; do not attempt repeated blind encoding conversion.
7. Move experimental WebRTC and audio entry points behind a disabled feature flag if they interfere with Foundation work.
8. Add a prototype-to-target mapping showing which current code is reusable, adaptable, or replaceable.

### Deliverables

- Reproducible build.
- Prototype inventory.
- UTF-8 fixture file containing verified Urdu samples.
- First automated test script.
- Updated `PROJECT_STATUS.md`.

### Exit criteria

- Current behavior can be started and built by a new contributor.
- No new architecture is based on assumptions about unread prototype code.

## Phase 1 — Canonical document foundation

### Objective

Make document data explicit, typed, testable, and independent of Fabric.

### Workstream 1A: TypeScript migration boundary

1. Add TypeScript configuration with strict settings.
2. Permit temporary JavaScript coexistence.
3. Create `src/domain/` in TypeScript.
4. Convert application code incrementally; avoid a large mechanical rewrite before domain tests exist.

### Workstream 1B: Domain model

1. Define branded IDs and schema version.
2. Define document metadata and settings.
3. Define page size, margins, bleed, guides, and backgrounds.
4. Define discriminated object types for text frame, image frame, rectangle, ellipse, and line.
5. Define stories separately from text frames.
6. Define style catalog and asset references.
7. Centralize point/pixel/mm/inch conversion.
8. Define invariants: referential integrity, finite geometry, minimum dimensions, page/object ownership, and order uniqueness.

### Workstream 1C: Commands and history

1. Implement create document/page/object commands.
2. Implement update geometry/style and delete commands.
3. Implement batch commands for drag and multi-selection.
4. Add local undo/redo with transaction grouping.
5. Ensure commands return validation failures without partially mutating state.

### Workstream 1D: Tests

- Unit conversion tests.
- Command/reducer tests.
- Invariant violation tests.
- Randomized serialization round trips.
- Stable ID and ordering tests.

### Exit criteria

- Two-page canonical documents support add, move, style, delete, undo, redo, serialize, and deserialize.
- Domain tests do not import Fabric, React, DOM, or Yjs.

## Phase 2 — Persistence, assets, and recovery

### Objective

Make user work durable before expanding editor features.

### Workstream 2A: `.urdup` package

1. Implement manifest and schema validation.
2. Replace arbitrary HTML and prototype-only fields with canonical structures.
3. Store assets as separate hash-addressed entries.
4. Verify asset hashes, media types, sizes, and dimensions.
5. Enforce ZIP and document resource limits.
6. Add schema migrations and future-version handling.
7. Add package inspection tests containing malicious paths, high compression ratios, missing assets, corrupt JSON, and unsupported versions.

### Workstream 2B: autosave and recovery

1. Define document revision IDs and dirty state.
2. Debounce snapshots without blocking interactions.
3. Store recovery documents and assets transactionally in IndexedDB.
4. Retain explicit-save metadata separately from recovery state.
5. Offer restore/discard after unclean shutdown.
6. Test quota failure, database failure, and interrupted writes.

### Workstream 2C: platform save abstraction

1. Define browser download/upload implementation.
2. Define future Tauri filesystem contract.
3. Implement filename sanitization and extension handling.

### Exit criteria

- A representative two-page document and assets round-trip semantically.
- Import failures do not destroy the open document.
- Recovery is demonstrated after forced close.

## Phase 3 — Canvas editor reconstruction

### Objective

Reconnect the interface to canonical commands while keeping Fabric replaceable.

### Workstream 3A: adapter

1. Build canonical-to-Fabric object factories.
2. Maintain ID mapping without storing live Fabric objects in the domain.
3. Translate selection, transform, and modification events into commands.
4. Separate transient drag state from durable commits.
5. Reconcile external document changes back into Fabric.

### Workstream 3B: workspace

1. Implement multi-page navigation and page lifecycle.
2. Implement zoom, pan, fit page, fit width, and page centering.
3. Add rulers, margins, guides, and optional grid.
4. Implement snapping priorities and visible snap indicators.
5. Add multi-selection, alignment, distribution, grouping, lock, hide, and layer ordering.
6. Make inspector values display user-selected units while storing points.

### Workstream 3C: performance

1. Profile pointer interaction and render invalidation.
2. Virtualize page thumbnails and non-visible pages as needed.
3. Avoid serializing entire documents during every pointer move.

### Exit criteria

- Common object operations mutate canonical state through commands.
- Changing zoom does not change saved geometry or wrapping.
- Undo/redo behaves predictably across inspector and pointer changes.

## Phase 4 — Urdu rich-text engine

### Objective

Deliver reliable text editing inside positioned frames.

### Workstream 4A: schema

1. Define allowed block nodes and marks.
2. Represent paragraph direction separately from alignment.
3. Represent font references through stable style IDs or controlled attributes.
4. Write safe paste conversion from plain text and sanitized HTML.

### Workstream 4B: overlay editor

1. Activate a Tiptap overlay over the selected Fabric text frame.
2. Keep scale, rotation, clipping, scroll, and zoom transforms synchronized.
3. Preserve caret/selection when inspector formatting changes.
4. Commit structured content through commands.
5. Render non-editing text consistently with the editing view.

### Workstream 4C: Urdu input

1. Implement native input and IME-safe events.
2. Implement verified CRULP/Navees modes as separate layouts.
3. Insert virtual-keyboard characters at the selection.
4. Add Urdu/English toggle and shortcut policy.
5. Add explicit normalization tools only after linguistic review.

### Workstream 4D: font and bidi QA

1. Pin verified font binaries.
2. Test load timing, fallback, clipping, line height, mixed bidi selection, copy/paste, and export.
3. Create visual snapshots for the corpus in each supported font.

### Exit criteria

- Verified fixtures edit, save, reopen, and export without character mutation.
- Editing and non-editing frame layouts meet documented visual tolerances.
- No blanket bidi override is required for ordinary paragraphs.

## Phase 5 — Local page-layout alpha

### Objective

Produce the first useful offline application for real documents.

### Work

1. Complete File, Edit, Insert, Text, Object, View, and Help command surfaces.
2. Add page presets and custom dimensions.
3. Add image crop/fit/fill and asset relinking.
4. Implement template instantiation with fresh IDs.
5. Add keyboard shortcut map and command palette if useful.
6. Add dirty indicators, recent recovery, and error notifications.
7. Conduct task-based usability sessions for poster, poetry, letterhead, and newspaper-page workflows.
8. Fix issues that prevent completion without developer assistance.

### Exit criteria

- Representative users complete all four reference documents offline.
- No critical data-loss or Unicode-corruption defects remain.
- Alpha limitations are visible and honest.

## Phase 6 — Export and preflight

### Objective

Separate convenient sharing output from professional print output.

### Workstream 6A: raster output

1. Render from canonical page bounds, not the workspace screenshot.
2. Support selected DPI and page ranges.
3. Enforce memory budgets and warn about oversized exports.
4. Label raster PDFs and images accurately.

### Workstream 6B: production PDF spike

Evaluate candidate renderers with the same corpus:

- Browser print/headless Chromium route.
- SVG per page converted to PDF.
- PDFKit/fontkit or another permissively licensed PDF stack.
- A limited native/server renderer only if cross-platform determinism cannot be achieved locally.

Measure font embedding/subsetting, Nastaliq shaping, selectable text, vector preservation, transparency, clipping, color handling, file size, performance, and platform consistency.

### Workstream 6C: preflight

Detect missing assets, unlicensed/unembeddable fonts, fallback glyphs where detectable, overflow, low-resolution images, out-of-page objects, transparency limitations, and unsupported effects.

### Exit criteria

- The selected PDF path is recorded in an ADR.
- Physical page sizes and embedded font behavior pass automated inspection.
- Reference exports pass visual comparison and printer review.

## Phase 7 — Professional DTP features

### Objective

Cross the line from a page-design tool into a credible publishing application.

### Ordered capabilities

1. Character and paragraph styles.
2. Master pages and page numbering.
3. Columns within frames.
4. Linked text stories and overflow indicators.
5. Advanced find/replace.
6. Bleed, crop marks, and print presets.
7. Package-for-print and asset/font report.
8. Tables only after the text-layout model supports them safely.

Each capability needs document-schema design, command behavior, undo/redo, package migration, collaboration mapping considerations, and export tests before UI polish.

### Exit criteria

- A multi-page newspaper or booklet can be produced with reusable styles and linked stories.
- Overflow and missing resources cannot remain invisible during final export.

## Phase 8 — Tauri desktop applications

### Objective

Ship native-feeling offline applications from the stable shared core.

### Work

1. Add Tauri 2 configuration and least-privilege capabilities.
2. Implement native open/save dialogs and atomic save.
3. Implement recent files without exposing unnecessary paths.
4. Integrate OS menus, shortcuts, drag/drop, clipboard, and print where useful.
5. Define signed installer and updater strategy for each platform.
6. Test Windows display scaling, macOS permissions/notarization, and Linux packaging targets.
7. Add crash reporting only after privacy policy and explicit decision.

### Exit criteria

- Clean machines on all target platforms install, open, edit, save, recover, export, update, and uninstall successfully.
- Capabilities grant no unnecessary filesystem or shell access.

## Phase 9 — Collaboration preview

### Objective

Add optional, safe, small-room collaboration without compromising offline authoring.

### Work

1. Map canonical pages, objects, stories, and styles to Yjs structures.
2. Define conflict behavior for object fields and deletions.
3. Use awareness for cursors, selection, active page, and presence only.
4. Keep asset binaries outside normal CRDT maps.
5. Add identity, high-entropy invitations, roles, revocation, and room lifecycle.
6. Select WebSocket/signaling provider and TURN strategy.
7. Define encryption and storage claims precisely.
8. Test concurrent edits, offline divergence, reconnect, peer loss, hostile input, and version mismatch.
9. Limit preview rooms to two to four active editors.

### Exit criteria

- Deterministic convergence tests pass.
- Local recovery remains available when the network fails.
- A security review approves invitation and authorization flows.

## Phase 10 — Ecosystem and differentiated features

Candidates are prioritized using user evidence:

- Comments and version history.
- DOCX, RTF, TXT, and HTML import adapters.
- Legacy InPage format research.
- Urdu dictionary, spellcheck, and text analysis.
- OCR and transliteration.
- Organisational templates.
- Plugin or automation APIs.
- Voice calling only if collaboration users demonstrate demand.

Every external-format importer is isolated, fuzzed, resource-limited, and unable to inject arbitrary executable markup.

## Cross-cutting definition of done

Every feature includes:

- Domain/data design.
- Undo/redo behavior.
- Save/migration behavior.
- Urdu and mixed-bidi impact.
- Keyboard and accessibility behavior.
- Export behavior.
- Error/recovery behavior.
- Automated tests.
- Documentation/status updates.
