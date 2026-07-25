# Legacy InPage (.inp) Feasibility & Technical Research Report

**Document Status**: Architectural Research Baseline  
**Target Milestone**: Milestone 6 — Professional Ecosystem (Import and Interoperability)

---

## 1. Executive Summary

InPage is the legacy proprietary Urdu desktop publishing software widely used in Pakistan, India, and Urdu publishing houses worldwide. InPage documents use the `.inp` file extension, which wraps document data inside an **OLE2 Compound File Binary Format (CFBF)** container.

This document establishes the technical, legal, security, and architectural feasibility of importing legacy `.inp` files into **RePage**, translating custom 16-bit Urdu font codepoints to standard Unicode UTF-8, and safely isolating binary parsers.

---

## 2. InPage Binary File Structure (.inp)

### 2.1 OLE2 Compound Container
InPage documents are structured as Microsoft OLE2 Compound Files (the same binary container used by legacy `.doc` and `.xls` formats).
- **Magic Bytes**: `0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1`
- **Internal Streams**:
  - `Data`: Primary document text stream, containing story text, page objects, and layout metadata.
  - `SummaryInformation`: Document properties (title, author, creation timestamp).
  - `Fonts`: Embedded or referenced Nastaliq font mapping tables.

### 2.2 Character Encoding & Font Codepage Mapping
InPage does **not** use native Unicode UTF-8 or UTF-16 in older `.inp` versions (v1.x – v3.x). Instead, text is encoded using custom **16-bit character index tables** mapped to proprietary Nastaliq font glyphs (Noori Nastaliq, InPage Urdu 16-bit encoding).

#### Glyph-to-Unicode Translation Matrix:
| InPage 16-bit Code | Character Name | Canonical Unicode |
| :---: | :--- | :---: |
| `0x0041` | ALIF (ا) | `U+0627` |
| `0x0042` | BAY (ب) | `U+0628` |
| `0x0043` | PAY (پ) | `U+067E` |
| `0x0044` | TAY (ت) | `U+062A` |
| `0x0045` | TTAY (ٹ) | `U+0679` |
| `0x0046` | SAY (ث) | `U+062B` |
| `0x0047` | JEEM (ج) | `U+062C` |
| `0x0048` | CHECH (چ) | `U+0686` |
| `0x0049` | HEE (ح) | `U+062D` |
| `0x004A` | KHEE (خ) | `U+062E` |
| `0x004B` | DAL (د) | `U+062F` |
| `0x004C` | DDAL (ڈ) | `U+0698` |
| `0x004D` | ZAL (ذ) | `U+0630` |
| `0x004E` | RAY (ر) | `U+0631` |
| `0x004F` | RRAY (ڑ) | `U+0691` |

---

## 3. Legal and Intellectual Property Boundaries

1. **No Proprietary Font Redistribution**: RePage must **never** bundle or redistribute proprietary InPage font binaries (`Naskh`, `Noori Nastaliq`, or `.ttf` files belonging to Concept Software Solutions).
2. **Open-Source Font Target**: Imported InPage documents are mapped directly to open-licensed Urdu Nastaliq fonts (e.g. *Jameel Noori Nastaliq*, *Gulzar*, *Noto Nastaliq Urdu*).
3. **Interoperability Right**: Reverse-engineering the binary `.inp` file structure for clean-room interoperability is legally protected under standard software reverse-engineering and fair-use interoperability doctrines.

---

## 4. Security Isolation & Quarantine Architecture

Binary OLE2 files present significant security risks (buffer overflows, heap corruption, memory exhaustion, malformed sector allocation tables).

```
 ┌─────────────────────────────────────────────────────────────┐
 │                    External .inp Binary File                │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                Security Quarantine Sandbox                 │
 │  - Max File Size: 25 MB                                     │
 │  - OLE2 Sector Validation & Sector Allocation Table (SAT)    │
 │  - Memory Limit: 128 MB max heap allocation                 │
 │  - Parse Timeout: 3,000 ms hard limit                        │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │            InPage Stream Decoder & Encoding Mapping          │
 │  - Decodes 'Data' stream                                    │
 │  - Maps 16-bit font indices -> Canonical UTF-8 Unicode      │
 │  - Converts text frames & geometry to PDF Points            │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │               Canonical RePage Document Model               │
 └─────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Roadmap for Optional InPage Importer Plugin

1. **Phase 1: Binary Container Unpacker (`ole2Parser.ts`)**:
   - Parse OLE2 FAT/SAT sectors.
   - Extract `Data` stream into memory buffer.
2. **Phase 2: Text & Formatting Decoder (`inpDecoder.ts`)**:
   - Extract raw text streams and paragraph delimiters (`0x0D`, `0x0A`).
   - Translate 16-bit glyph index tables to standard UTF-8 Urdu characters.
3. **Phase 3: Page & Frame Geometry Converter (`inpGeometry.ts`)**:
   - Convert InPage twips (1/20th of a point) to canonical PDF Points (1/72th of an inch).
4. **Phase 4: User Verification & Migration Report**:
   - Surface an explicit visual import summary highlighting converted text frames, mapped fonts, and unmapped legacy symbols.
