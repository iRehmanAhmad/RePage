# ADR-0007: Safe Document-Connected Urdu Language Authoring Tools Architecture

* **Status:** Accepted
* **Date:** 2026-07-26
* **Authors:** AI Coding Assistant & RePage Core Team

---

## Context

The RePage desktop application requires safe, document-connected Urdu language authoring tools including:
1. Proofing and dictionary (spellchecker, grammar, style rules, personal dictionary).
2. Transliteration (Roman-to-Urdu, Urdu-to-Roman).
3. Character correction and normalization (Arabic Kaf `ك` to Urdu Kaf `ک`, Arabic/Farsi Yaa `ي`/`ى` to Urdu Yaa `ی`, Teh Marbuta `ۃ` to Goal Heh `ہ`).
4. Keyboard layout system (`crulp`, `navees`, `english`, `native`, and custom user layouts).
5. Image & scanned document OCR recognition with side-by-side verification and low-confidence correction.

---

## Decisions

### 1. Canonical Language Mutation Layer
- All language tools UI panels generate proposal preview objects (`LanguageChange[]`).
- Mutations pass through `applyLanguageChangesCommand(doc, changes)` in `src/editor/commands/languageCommands.ts`.
- Multi-change batches are sorted in reverse document offset order (`storyId` descending, `from` descending) to ensure prior replacements do not invalidate character offsets of subsequent replacements in the batch.
- `validateLanguageChange` checks that target story text has not drifted prior to applying changes.

### 2. Scope Isolation Model
- `LanguageToolScope` supports three scopes:
  - `{ kind: 'selection', storyId, from, to }`: Mutates active selection range only.
  - `{ kind: 'story', storyId }`: Mutates active text container/story only.
  - `{ kind: 'document' }`: Mutates all stories in document.
- Scope selection prevents accidental out-of-scope text mutations.

### 3. Joiner, Bidi, and Combining Marks Preservation
- All language operations preserve Zero-Width Non-Joiner (`\u200C`), Zero-Width Joiner (`\u200D`), Right-to-Left Mark (`\u200F`), Left-to-Right Mark (`\u200E`), Aerab combining marks (`\u064B-\u065F`), and sacred honorific glyphs (`ﷺ`, `رضی اللہ عنہ`) byte-for-byte unless explicitly targeted for substitution.
- Transliteration preserves Latin abbreviations (`HTTP`, `PDF`, `URL`, `e.g.`, `P.S.`), URLs, emails, dates, and numbers.

### 4. Custom Keyboard Persistence
- Custom keyboard mappings are persisted in local storage key `repage_custom_keyboards`.
- Visual keyboard layout mode supports `custom:<id>`, resolving key mappings with full fallback to CRULP phonetic layout.
- Native OS mode (`'native'`) displays an honest banner and disables key grid simulation.

### 5. Extensible OcrProvider Architecture
- OCR recognition operates via `OcrProvider` interface (`recognize(input, options)`).
- `MockOcrProvider`: Used for unit testing and offline development fallback.
- `UnavailableOcrProvider`: Throws explicit, helpful offline error messages when no provider is connected, preventing silent dummy results.

---

## Consequences

- Document text mutations remain 100% atomic, undoable/redoable, and fully compliant with `.urdup` package serialization.
- Rich-text formatting marks (bold, italic, font family, color) are preserved during replacements.
- All 251 test suites continue to pass with 0 warnings or errors.
