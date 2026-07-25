# Development and Delivery Workflow

## 1. Starting work

1. Read `MEMORY.md` and `PROJECT_STATUS.md`.
2. Identify the active milestone and applicable specification.
3. Check the working tree and preserve unrelated changes.
4. Define acceptance criteria before implementation.
5. Create an ADR first if the work changes a major boundary or long-lived format.

## 2. Change size

Prefer vertical, reviewable slices. A useful slice includes model, command, adapter/UI, tests, and documentation for one behavior. Do not combine broad formatting, dependency upgrades, architecture changes, and new features without necessity.

## 3. Branch and commit conventions

- Default branch prefix: `codex/` for Codex-created branches.
- Suggested commit types: `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `chore`.
- Commits state the user-visible or architectural outcome, not merely the files touched.
- Do not commit generated packages, local recovery databases, or unlicensed font binaries.

## 4. Review checklist

- Does the change preserve canonical/domain boundaries?
- Can it lose or mutate document data?
- Is undo/redo defined?
- Is save/migration compatibility handled?
- Does it affect Urdu, bidi, keyboard, or font layout?
- Does it affect export?
- Is untrusted input involved?
- Are error and recovery paths understandable?
- Are tests and documentation sufficient?

## 5. Status and memory

Update `PROJECT_STATUS.md` when the active queue or milestone state changes. Update `MEMORY.md` only for durable facts. Use ADRs for decisions and `CHANGELOG.md` for released user-visible changes.

## 6. Release procedure outline

1. Freeze the intended scope.
2. Pass static, unit, integration, package, visual, accessibility, and platform checks.
3. Audit fonts, dependencies, notices, and licences.
4. Verify migrations from all supported document versions.
5. Produce signed artifacts and checksums.
6. Test install/update/uninstall on clean systems.
7. Publish known limitations and recovery guidance.
8. Tag and update changelog only after artifacts are verified.
