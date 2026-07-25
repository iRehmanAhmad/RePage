# Changelog

All notable released changes will be documented here. The project has not made its first release.

## Unreleased

### Documentation

- Established product requirements, target architecture, detailed implementation phases, document-format specification, typography policy, quality strategy, security model, dependency policy, workflow, roadmap, project memory, status, and architecture decision records.

### Foundation

- Removed the original JavaScript prototype and rebuilt the application in strict TypeScript.
- Added canonical document schema v1 with point-based geometry and referential validation.
- Added command-based page/object mutations and verified Urdu starter content.
- Added Dexie recovery snapshots and baseline validated `.urdup` ZIP import/export.
- Added Vitest with nine passing domain, unit-conversion, and package tests.
- Added a responsive multi-page Foundation workspace and browser smoke test.

### Known foundation limitations

- Interactive canvas manipulation, rich-text editing, asset packaging, migrations, recovery startup UX, export, desktop packaging, and collaboration are not yet implemented.
