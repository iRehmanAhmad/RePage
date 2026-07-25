# Urdu Typography Specification

Status: foundational quality specification

## 1. Purpose

Typography is the defining capability of UrduPage. Font installation alone is not sufficient. Editing, measurement, clipping, wrapping, bidi order, selection, and export must be verified as a single system.

## 2. Supported content classes

The fixture corpus must include:

- Urdu letters and common ligature sequences.
- Arabic and Persian variants used in pasted material.
- Urdu and Western digits.
- English words, URLs, email addresses, parentheses, quotation marks, dates, and currency inside RTL paragraphs.
- ZWNJ, ZWJ, RLM, LRM, and directional isolates.
- Combining marks, honorifics, Quranic marks used by supported fonts, and tatweel.
- Poetry lines, justified prose, newspaper columns, headings, and very long unbroken tokens.

## 3. Direction and alignment

Paragraph direction is stored separately from alignment. An RTL paragraph may be right, center, left, or justified. Inline bidi control follows Unicode semantics and is not inferred solely from alignment.

Avoid `unicode-bidi: isolate-override` as a blanket default; overriding bidi ordering can damage mixed-direction text. Use the least forceful CSS and explicit structured direction metadata required for the case.

## 4. Editing behavior

- Native OS Urdu keyboards and IMEs must continue to work.
- Phonetic mapping is an opt-in input mode.
- Keyboard interception respects composition, shortcuts, dead keys, accessibility tools, and modifier layers.
- Visual keyboard insertion acts at the actual caret/selection, not merely at the end of the frame.
- Copy/paste preserves Unicode text and allowed formatting.
- Undo groups composition and phonetic input into understandable steps.

## 5. Normalization policy

Source text is preserved by default. Any normalization command is explicit, previewable where destructive, and covered by fixtures. Joiners, bidi controls, presentation forms, and combining marks are never silently removed merely to make rendering easier.

## 6. Font policy

Initial candidates:

| Font | Intended role | Policy |
|---|---|---|
| Noto Nastaliq Urdu | Default body Nastaliq | Bundle only from verified OFL release |
| Gulzar | Display and alternate body | Pin version; repository maintenance status noted |
| BH Nastaliq | Experimental alternative | Do not default until performance/shaping QA passes |
| Noto Naskh Arabic or another OFL Naskh | Naskh fallback | Verify exact package and licence |

Jameel Noori and other commonly installed fonts may be selectable as local system fonts, but are not bundled or embedded without documented rights.

Each bundled font record includes upstream URL, version/hash, licence, reserved names, allowed embedding, and test results.

## 7. Measurement and clipping

- Wait for font loading before final measurement.
- Text frames account for Nastaliq ascenders, descenders, marks, and diagonal stacking.
- Zoom must not alter canonical wrapping.
- Layout and export use the same font files and compatible shaping behavior.
- Visual regressions detect clipped dots, changed line breaks, collisions, and fallback glyphs.

## 8. Justification

Version one may use conservative inter-word justification. Kashida insertion, glyph elongation, and advanced Nastaliq justification require a separate design and linguistic review. Automatic insertion must never mutate source text unless represented as explicit formatting metadata.

## 9. Acceptance gate

A font/editor combination is approved only when the fixture corpus passes in supported browser engines and export output. Screenshots are reviewed at normal size and magnified; logical text extraction is compared where the output format supports it.
