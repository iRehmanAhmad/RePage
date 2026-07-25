# Quality and Verification Strategy

## 1. Quality model

Quality is evaluated across correctness, document safety, typography, visual fidelity, accessibility, performance, security, and cross-platform behavior. A successful production build alone is not a release signal.

## 2. Test layers

### Static checks

- Strict TypeScript for migrated code.
- Linting and formatting.
- UTF-8/mojibake detector.
- Dependency and licence checks.

### Unit tests

- Domain commands and invariants.
- Unit conversions and geometry.
- Rich-text schema transformations.
- Keyboard layouts and input grouping.
- Package validation and migrations.
- Asset hashing and metadata.

### Integration tests

- Canonical model ↔ Fabric adapter.
- Canonical story ↔ Tiptap adapter.
- Autosave and recovery.
- `.urdup` round trips.
- Export layout and resource resolution.
- Collaboration convergence when introduced.

### End-to-end tests

- Create reference document.
- Save, close, reopen, and compare.
- Crash and recover.
- Import images and relink missing assets.
- Export selected pages.
- Keyboard-only core workflow.
- Desktop native dialogs once Tauri exists.

### Visual tests

Reference documents:

1. Urdu newspaper front page.
2. Poetry/Ghazal page.
3. Bilingual official letterhead.
4. Poster with rotated text and transparency.
5. Multi-page linked story when supported.

Capture supported fonts, zoom-independent editor rendering, and export rendering. Review both pixel differences and semantic changes such as line breaks or clipping.

## 3. Typography corpus

Fixtures are immutable verified UTF-8 text with provenance. Expected content is tested by code-point sequences in addition to visual rendering. The corpus includes mixed bidi, joiners, marks, punctuation, numerals, URLs, poetry, justified prose, and edge-case clusters.

## 4. Package robustness

Maintain malformed fixtures for traversal paths, duplicate entries, corrupt manifests, invalid IDs, missing assets, hash mismatches, oversized dimensions, deep JSON, excessive objects, high compression ratio, unsupported versions, and interrupted migration.

## 5. Performance practice

Define a repeatable reference machine and documents. Measure startup, open, save, autosave, typing latency, drag frame time, memory, thumbnail generation, and export. Performance regressions become release blockers when they exceed agreed budgets.

## 6. Browser and platform matrix

During browser-core development, test current Chrome/Edge, Firefox, and Safari. Desktop release candidates test clean supported Windows, macOS, and selected Linux packaging environments, including display scaling and offline operation.

## 7. Release gates

### Alpha

- No known critical data-loss defect.
- Reference documents complete locally.
- All output limitations labelled.

### Beta

- Format migrations tested.
- Typography corpus passes supported configurations.
- Accessibility and security reviews completed for shipped scope.
- Crash recovery and corrupt-import behavior verified.

### Stable

- Signed desktop packages.
- Production PDF criteria met or the capability is explicitly excluded.
- Upgrade and rollback procedures tested.
- Dependency notices and privacy documentation available.

## 8. Defect severity

- **Critical:** data loss, document corruption, code execution, secret exposure, or widespread unusable Urdu.
- **High:** incorrect export, broken save/recovery, major layout drift, inaccessible core workflow.
- **Medium:** significant feature malfunction with workaround.
- **Low:** cosmetic or minor usability problem.
