# ADR-0005: Urdu-first Home-ribbon design and command scope

Status: Accepted  
Date: 2026-07-26  

## Context

The repository had a structural conflict between formal requirements (which described a frame-first DTP editor) and the live project direction (Word-style Urdu word processing first, frame-based DTP second). Additionally, the initial MS Word 365 Home ribbon contained controls that were UI-only placeholders or English-centric actions (such as Change Case, Text Effects, and generic Add-ins) that did not connect to canonical document commands or serve primary Urdu authoring tasks.

## Decision

1. **Product Direction Alignment**: RePage is explicitly defined as a **Word-style Urdu word processor first**, with InPage-style professional page layout second. Blank documents open ready for immediate body typing; text boxes are inserted explicitly for floating/framing layouts.
2. **Home Ribbon Ergonomics**: The Home tab is optimized for ordinary Urdu writing first. Its canonical group structure is:
   ```text
   Urdu Input | Clipboard | Font | Paragraph | Urdu Styles | Editing
   ```
   In Urdu UI mode (RTL), these groups start from the right edge.
3. **Advanced Tool Location**: Specialized, complex, or low-frequency features (OCR, dictionary, character substitution, keyboard layout editor, text normalization) remain located under **Urdu Tools** (`🌐`) rather than cluttering Home.
4. **Command Discipline**: Every control on the Home ribbon MUST update the canonical document model via the command registry (`editor/commands/`). Direct DOM mutation shortcuts or UI-only state without canonical undo/redo persistence are strictly forbidden.
5. **No Fake Controls**: Buttons that merely pop up a message or do not edit document state will be removed or hidden until fully implemented via real commands.
6. **Deferred Extensions**: The Add-ins extension launcher is deferred until a formal plugin runtime model exists.

## Consequences

- The Home ribbon will be significantly simplified, reliable, and responsive across all screen sizes (1024px to 1920px).
- Users writing Urdu will have direct, immediate access to keyboard modes, Nastaliq font controls, direction switches, Kashida formatting, and native Urdu styles (عام متن, عنوان ۱, عنوان ۲, شاعری, اقتباس).
- Code complexity decreases as incomplete placeholder popups are removed in Phase 1.
- All formatting edits will round-trip predictably in `.urdup` packages and undo/redo histories.

## Alternatives Considered

- **Keep MS Word 365 exact layout (including Add-ins and Text Effects)**: Rejected because placeholder controls degrade user trust, and English-centric controls add clutter without aiding Urdu composition.
- **DTP Frame-first Home Tab**: Rejected because primary target users expect immediate document typing upon launch.

## Validation

- Automated unit/integration tests for every Home command.
- Verification that formatting actions update canonical document state and persist across save/reopen cycles.
- Responsive layout verification at 1024px, 1280px, 1366px, and 1920px without button clipping.
