# Product Requirements

Status: baseline specification

## 1. Product definition

RePage is a desktop-first word-processing and page-publishing application optimized for Urdu Nastaliq and mixed RTL/LTR documents. It should feel approachable to a first-time user writing ordinary text while retaining the precision needed by publishers, newspaper staff, teachers, poets, offices, and designers.

The primary product direction is a **Word-style Urdu word processor first**, with InPage-style professional frame layout second. Blank documents open ready for immediate document body typing; text frames and text boxes are inserted deliberately for floating or constrained layout objects.

## 2. Target users

### Primary users

- Urdu newspaper and magazine layout operators.
- Authors and poets preparing print or social-media publications.
- Schools, publishers, mosques, nonprofits, and offices producing Urdu material.
- Existing InPage users seeking a modern interface and cross-platform support.

### Secondary users

- Designers creating bilingual Urdu/English material.
- Students and casual users without an OS-level Urdu keyboard.
- Distributed teams that may later use review and collaboration.

## 3. Core jobs to be done

1. Create a correctly sized page or choose a template.
2. Type or paste Unicode Urdu immediately into document body text or positioned frames without damaged joining or bidi behavior.
3. Place and precisely arrange Urdu text, images, and decorative elements.
4. Save work safely and recover from an accidental close or crash.
5. Reopen the document on another supported platform without layout drift.
6. Export predictable images and PDFs for sharing and printing.
7. Reuse styles and templates rather than repeatedly formatting objects.
8. Eventually invite others to review or co-edit without surrendering local document ownership.

## 4. Product principles

- **Urdu first:** Urdu is a primary design input, not an RTL checkbox added later. Home is optimized for ordinary Urdu writing first, then professional layout.
- **Home tab scope:** Home contains only frequent, fully working actions. Advanced features (OCR, dictionary, character correction, keyboard editor, and normalization) remain under **Urdu Tools** (`🌐`).
- **Command discipline:** Every Home action must update the canonical document through commands (`editor/commands/`); UI-only state or direct browser editing shortcuts are prohibited.
- **Deferred extensions:** Add-ins are deferred until a genuine plugin runtime model exists.
- **Local first:** core authoring works offline and without registration.
- **Safe by default:** autosave, recovery, validation, migrations, and clear destructive-action warnings.
- **Progressive complexity:** common actions are obvious; precision tools remain available.
- **Deterministic documents:** canonical data is independent of viewport, zoom, and UI framework.
- **Honest output:** export labels state whether output is raster, vector, or production-ready.
- **Portable ownership:** users can save and move complete document packages.

## 5. Version-one functional requirements

### Documents and pages

- Create, open, save, Save As, duplicate, and recover documents.
- A4, A3, Letter, Legal, common Pakistani publication presets, landscape, and custom dimensions.
- Multiple pages with reorder, duplicate, insert, and delete.
- Page margins, bleed metadata, background, guides, and optional grid.
- Zoom, fit page, fit width, pan, rulers, and coordinates.

### Objects

- Text, image, rectangle, ellipse, line, and simple decorative objects.
- Select, multi-select, move, resize, rotate, lock, hide, duplicate, delete, group, and layer ordering.
- Numeric position and size editing.
- Alignment and distribution commands.
- Snapping to page, margins, guides, grid, and peer objects.

### Text

- Unicode Urdu input and paste.
- Mixed Urdu, Arabic, Persian, English, numerals, and punctuation.
- RTL/LTR paragraph direction independent from alignment.
- Font family, size, color, line height, paragraph spacing, alignment, and basic inline emphasis.
- Character and paragraph styles by the professional beta.
- Non-destructive handling of ZWNJ, ZWJ, bidi marks, and combining marks.
- Visual keyboard and clearly separated phonetic-layout modes.

### Images and assets

- PNG, JPEG, WebP, and SVG import subject to safe validation.
- Fit, fill, crop, rotate, opacity, border, corner radius, and relink.
- Asset manifest with hash, MIME type, dimensions, and original filename.
- Missing-asset and unsupported-format warnings.

### Persistence

- Continuous local autosave.
- Recovery session after crash or forced close.
- Portable `.urdup` file.
- Versioned migrations.
- Clear dirty/saved state.
- Safe atomic save behavior in the desktop application.

### Export

- PNG and JPEG at selected dimensions/DPI.
- Raster PDF in alpha, labelled as raster.
- Production PDF before stable professional release.
- Page ranges, bleed/crop controls, background handling, and font warnings where applicable.

### Usability and accessibility

- Complete keyboard access for common commands.
- Familiar platform shortcuts.
- Visible focus and sufficient contrast.
- Light and dark application themes; page appearance remains document-controlled.
- Reduced-motion support.
- Urdu and English UI localization architecture, even if the first build ships one complete locale.

## 6. Non-functional requirements

### Reliability

- No acknowledged user edit may be silently discarded.
- Save/import errors must retain the in-memory document and explain recovery options.
- Corrupt or future-version packages must fail safely without executing embedded content.

### Performance targets

Initial targets, to be validated during Foundation:

- Cold local editor launch under 3 seconds on the reference Windows machine.
- Common pointer interactions maintain a perceived 60 FPS on a typical one-page design.
- Typing latency under 50 ms for ordinary text frames.
- Open a 20-page, 100-object document in under 5 seconds on the reference machine.
- Autosave must not block typing or dragging.

### Compatibility

- Desktop: current supported Windows, macOS, and mainstream Linux distributions at release time.
- Browser core: current Chrome/Edge, Firefox, and Safari versions used for development and preview.
- Document packages must be platform-neutral.

### Privacy

- Local documents remain local unless the user explicitly enables a network feature.
- Microphone permission is requested only after a direct user action.
- Telemetry, if ever introduced, is opt-in until a separate decision states otherwise.

## 7. Out of scope for the initial stable release

- Perfect import/export compatibility with proprietary InPage formats.
- Full word-processor pagination and references.
- Large multiplayer collaboration rooms.
- Built-in video conferencing.
- Server-required authoring.
- Proprietary font redistribution.

## 8. Success criteria

The product is credible when representative users can reproduce a newspaper page, poetry page, letterhead, and poster; reopen them on supported platforms; and export them without broken Urdu shaping, clipped glyphs, missing assets, or unexplained layout changes.
