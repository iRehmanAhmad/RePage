# Home Ribbon Button Inventory & Disposition Matrix

Status: Accepted (Phase 0 Deliverable)  
Date: 2026-07-26  

This document inventories all existing and proposed controls on the RePage Home ribbon. Each control is assigned a disposition status:
- `keep`: Retain in Home tab (working core functionality).
- `implement`: Build or upgrade canonical command wiring and real document engine backing.
- `move`: Relocate to another tab (e.g. **Urdu Tools** `🌐` or **Insert** `➕`).
- `remove`: Remove/hide from Home tab until a complete canonical implementation exists (eliminates misleading placeholders).
- `defer`: Postpone until a prerequisite subsystem exists (e.g. plugin engine).

---

## 1. Information Structure Overview

The redesigned Urdu-first Home ribbon consists of 6 core groups:

```text
Urdu Input | Clipboard | Font | Paragraph | Urdu Styles | Editing
```

In Urdu interface mode (RTL), these groups start from the **right edge** of the ribbon header.

---

## 2. Detailed Inventory by Group

### Group 1: Urdu Input (اردو ان پٹ)

| Control Label | Description | Disposition | Target Phase / Notes |
|---|---|---|---|
| **Input Engine Mode** | Selector for Navees, CRULP Phonetic, English | `implement` | Phase 4 — Home-level input mode selector |
| **Roman Urdu Transliteration** | Toggle Roman-to-Urdu transliteration engine | `implement` | Phase 4 — Quick toggle for phonetic typing |
| **Visual Keyboard Toggle** | Show/hide virtual onscreen keyboard overlay | `keep` | Phase 4 — Connects to existing keyboard overlay |
| **Urdu vs Western Numerals** | Switch between Urdu digits (۱۲۳) and Western (123) | `implement` | Phase 4 — Canonical numeral setting |
| **Quick Urdu Paragraph Preset** | One-click Urdu paragraph defaults (Nastaliq, 14pt, RTL, 1.5 line height) | `implement` | Phase 2 — Quick setup preset |

---

### Group 2: Clipboard (کلپ بورڈ)

| Control Label | Description | Disposition | Target Phase / Notes |
|---|---|---|---|
| **Paste (Main Button)** | Standard paste clipboard content | `keep` | Phase 3 — Connected to document paste command |
| **Paste Clean Unicode** | Paste plain text, stripping harmful HTML formatting | `implement` | Phase 4 — Preserves bidi/ZWNJ, strips HTML |
| **Inspect Character Variants** | Inspect Arabic-to-Urdu character variants during paste | `implement` | Phase 4 — Preview and variant replacement |
| **Paste Special Variants** | Minor/redundant paste options that do not behave differently | `remove` | Phase 1 — Remove redundant dropdown noise |
| **Cut** | Cut selected text or object to clipboard | `keep` | Phase 3 — Connected to document cut command |
| **Copy** | Copy selected text or object to clipboard | `keep` | Phase 3 — Connected to document copy command |
| **Format Painter** | Copy/apply formatting across selections | `remove` | Phase 1 — Hide placeholder until range stroke command exists |

---

### Group 3: Font (فونٹ)

| Control Label | Description | Disposition | Target Phase / Notes |
|---|---|---|---|
| **Urdu Font Family** | Select installed/bundled Urdu fonts (Noto Nastaliq, Jameel, etc.) | `implement` | Phase 4 — Categorized list (Bundled, Local, Unavailable) |
| **Font Size** | Set point size for selected text | `keep` | Phase 3 — Real canonical font size command |
| **Grow Font Size (A^)** | Increment font size | `keep` | Phase 3 — Increments to next standard point step |
| **Shrink Font Size (A_v)** | Decrement font size | `keep` | Phase 3 — Decrements to previous point step |
| **Bold (B)** | Toggle bold weight | `keep` | Phase 3 — Selection-aware bold command |
| **Italic (I)** | Toggle italic style | `keep` | Phase 3 — Selection-aware italic command |
| **Underline (U)** | Toggle standard single underline | `keep` | Phase 3 — Selection-aware underline command |
| **Advanced Underline Styles** | Double, Wavy, Dotted, and Underline Color menus | `remove` | Phase 1 — Hide placeholder options until rich stroke schema exists |
| **Font Color (A)** | Set text foreground color | `keep` | Phase 3 — Connected to text color command |
| **Highlight Color (🖊️)** | Set text background highlight color | `keep` | Phase 3 — Connected to highlight mark command |
| **Clear Formatting (A🧹)** | Reset text formatting to style default | `keep` | Phase 3 — Reverts inline marks to canonical default |
| **Text Effects (A▼)** | Word-style shadow, reflection, and glow text effects | `remove` | Phase 1 — Irrelevant for Urdu Nastaliq body text |
| **Change Case (Aa)** | Uppercase, Lowercase, Title Case dropdown | `remove` | Phase 1 — Irrelevant for non-cased Urdu script |
| **Subscript (x₂)** | Inline subscript toggle | `remove` | Phase 1 — Available via Font Dialog launcher |
| **Superscript (x²)** | Inline superscript toggle | `remove` | Phase 1 — Available via Font Dialog launcher |
| **Strikethrough (ab)** | Inline strikethrough toggle | `remove` | Phase 1 — Available via Font Dialog launcher |
| **Font Dialog Launcher (↗️)** | Open complete Font property modal | `keep` | Launches detailed font options modal |

---

### Group 4: Paragraph (پیراگراف)

| Control Label | Description | Disposition | Target Phase / Notes |
|---|---|---|---|
| **Text Direction RTL (¶<)** | Set paragraph text direction to Right-to-Left | `keep` | Phase 3 — RTL direction stored separately from alignment |
| **Text Direction LTR (>¶)** | Set paragraph text direction to Left-to-Right | `keep` | Phase 3 — LTR direction stored separately from alignment |
| **Align Right** | Align paragraph text to right margin | `keep` | Phase 3 — Real paragraph alignment command |
| **Align Center** | Center paragraph text | `keep` | Phase 3 — Real paragraph alignment command |
| **Align Left** | Align paragraph text to left margin | `keep` | Phase 3 — Real paragraph alignment command |
| **Justify** | Standard block justification | `keep` | Phase 3 — Real paragraph alignment command |
| **Kashida Justification (کشیدہ)** | Urdu Nastaliq stretch justification | `implement` | Phase 3 — Stored as metadata (no destructive tatweel insertion) |
| **Bullets List** | Toggle bulleted list formatting | `keep` | Phase 3 — Selection-aware list command |
| **Numbering List** | Toggle numbered list formatting | `keep` | Phase 3 — Selection-aware list command |
| **Multilevel List** | Complex nested outline numbering | `remove` | Phase 1 — Hide placeholder until multi-level schema is ready |
| **Decrease Indent** | Shift paragraph margin inward | `keep` | Phase 3 — Decrements paragraph indent |
| **Increase Indent** | Shift paragraph margin outward | `keep` | Phase 3 — Increments paragraph indent |
| **Line Spacing** | Set line height multiplier (1.0, 1.15, 1.5, 2.0) | `keep` | Phase 3 — Connected to line spacing command |
| **Paragraph Shading** | Background color fill behind paragraph block | `remove` | Phase 1 — Hide placeholder until block shading model is complete |
| **Paragraph Borders** | Surrounding borders around paragraph block | `remove` | Phase 1 — Hide placeholder until box border model is complete |
| **Sort A–Z** | Sort selected lines or paragraphs | `remove` | Phase 1 — Hide placeholder until Urdu collation sort is built |
| **Show/Hide Marks (¶)** | Toggle display of non-printing characters | `keep` | Phase 3 — Viewport rendering toggle |
| **Paragraph Dialog Launcher (↘️)** | Open complete Paragraph property modal | `keep` | Launches detailed paragraph modal |

---

### Group 5: Urdu Styles (اردو اسٹائلز)

| Control Label | Description | Disposition | Target Phase / Notes |
|---|---|---|---|
| **عام متن (Normal)** | Default Urdu body text style card | `implement` | Phase 5 — Canonical style card with Nastaliq preview |
| **عنوان ۱ (Heading 1)** | Main document heading style card | `implement` | Phase 5 — Canonical style card with Nastaliq preview |
| **عنوان ۲ (Heading 2)** | Section heading style card | `implement` | Phase 5 — Canonical style card with Nastaliq preview |
| **شاعری (Poetry)** | Poetry preset style card (line height & alignment) | `implement` | Phase 5 — Canonical style card with Nastaliq preview |
| **اقتباس (Quotation)** | Blockquote style card | `implement` | Phase 5 — Canonical style card with Nastaliq preview |
| **Fake Quick Styles** | Mockup cards that only display popups | `remove` | Phase 1 — Replace with real canonical style cards in Phase 5 |
| **Styles Manager Launcher (↘️)** | Open complete Styles Manager modal | `implement` | Phase 5 — Manages document style catalog |

---

### Group 6: Editing (تدوین)

| Control Label | Description | Disposition | Target Phase / Notes |
|---|---|---|---|
| **Find (🔍)** | Find text in document | `implement` | Phase 5 — Urdu diacritic-aware search |
| **Replace (c🔁b)** | Replace text in document | `implement` | Phase 5 — Character variant-aware search & replace |
| **Select All** | Select all text in active story/document | `keep` | Connected to canvas/story select command |
| **Select Objects** | Select layout objects vs text | `keep` | Connected to canvas tool selection |

---

### Group 7: Add-ins & Extension Launcher (ایڈ انز)

| Control Label | Description | Disposition | Target Phase / Notes |
|---|---|---|---|
| **Add-ins (▦ Add-ins)** | Extension marketplace launcher | `defer` | Deferred until a formal plugin runtime model exists |

---

### Specialized Urdu Tools (Relocated to Urdu Tools Tab `🌐`)

| Control Label | Description | Disposition | Target Location |
|---|---|---|---|
| **Character Substitution** | Arabic-to-Urdu letter variant fixer | `move` | Retained under **Urdu Tools** (`🌐`) |
| **Keyboard Layout Editor** | Custom key mapping editor | `move` | Retained under **Urdu Tools** (`🌐`) |
| **Text Normalization** | Unicode mark & diacritic normalization | `move` | Retained under **Urdu Tools** (`🌐`) |
| **Urdu OCR** | Image-to-Urdu text extraction | `move` | Retained under **Urdu Tools** (`🌐`) |
| **Dictionary & Spellcheck** | Urdu lexicon lookup | `move` | Retained under **Urdu Tools** (`🌐`) |

---

## 3. Summary of Dispositions

- **`keep`**: 24 controls (Core working buttons).
- **`implement`**: 15 controls (Urdu Input, Kashida, Urdu Font categories, Safe Paste, 5 Urdu Styles, Diacritic Find/Replace).
- **`move`**: 5 controls (Specialized language tools kept strictly under **Urdu Tools** `🌐`).
- **`remove`**: 13 controls (Placeholder popups, non-functional outlines/borders/shading, English-only case/effects).
- **`defer`**: 1 control (Add-ins extension launcher).
