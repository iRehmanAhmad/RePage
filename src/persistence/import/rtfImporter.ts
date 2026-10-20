import {
  InlineNode,
  ParagraphNode,
  paragraph,
  RichTextDocument,
  TextAlignment,
  TextDirection,
  TextMark,
} from '../../domain/rich-text/types';
import { DEFAULT_RESOURCE_LIMITS, ImportOptions, ImportTextResult, validateResourceLimits } from './importEngine';
import { detectTextDirection } from './textImporter';
import {
  assembleImportedDocument,
  cleanImportTitle,
  countStoryWords,
  type DocumentImportResult,
} from './storyAssembler';

/**
 * RTF importer.
 *
 * The parser is byte-oriented (RTF is a byte format): literal bytes and
 * `\'hh` escapes are decoded with the document code page (`\ansicpgN`),
 * overridden per-font by `\fcharset` (Word writes Arabic/Urdu text as
 * cp1256 bytes under an Arabic-charset font even in `\ansicpg1252` files).
 * `\uN` escapes carry real Unicode directly. Decoded text is passed through
 * untouched — no normalization of joiners, bidi controls or combining marks.
 *
 * Group state is a proper stack, and destination groups (font/color tables
 * are parsed for lookups; headers, footers, pictures, footnotes, objects and
 * unknown `\*` destinations) are skipped as units — counted and reported by
 * the end-to-end builder instead of leaking into the text or being mangled.
 */

export interface RtfParseStats {
  tableCount: number;
  imageCount: number;
  headerFooterCount: number;
  footnoteCount: number;
  embeddedObjectCount: number;
}

export interface RtfParseResult {
  paragraphs: ParagraphNode[];
  stats: RtfParseStats;
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Code pages
// ---------------------------------------------------------------------------

function codepageLabel(cp: number): string {
  switch (cp) {
    case 65001:
      return 'utf-8';
    case 932:
      return 'shift_jis';
    case 936:
      return 'gbk';
    case 949:
      return 'euc-kr';
    case 950:
      return 'big5';
    case 874:
      return 'windows-874';
    default:
      return cp >= 1250 && cp <= 1258 ? `windows-${cp}` : 'windows-1252';
  }
}

/** RTF \fcharset value -> decoder label (null = use the document code page). */
function charsetLabel(charset: number): string | null {
  switch (charset) {
    case 128:
      return 'shift_jis';
    case 129:
      return 'euc-kr';
    case 134:
      return 'gbk';
    case 136:
      return 'big5';
    case 161:
      return 'windows-1253';
    case 162:
      return 'windows-1254';
    case 163:
      return 'windows-1258';
    case 177:
      return 'windows-1255';
    case 178: // Arabic — the Urdu case
      return 'windows-1256';
    case 186:
      return 'windows-1257';
    case 204:
      return 'windows-1251';
    case 222:
      return 'windows-874';
    case 238:
      return 'windows-1250';
    default:
      return null;
  }
}

const decoderCache = new Map<string, TextDecoder>();
function getDecoder(label: string): TextDecoder {
  let dec = decoderCache.get(label);
  if (!dec) {
    try {
      dec = new TextDecoder(label);
    } catch {
      dec = new TextDecoder('windows-1252');
    }
    decoderCache.set(label, dec);
  }
  return dec;
}

// ---------------------------------------------------------------------------
// Parser state
// ---------------------------------------------------------------------------

interface RtfState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  sub: boolean;
  sup: boolean;
  fontSizePt: number | null;
  color: string | null;
  highlight: string | null;
  fontFamily: string | null;
  fontIndex: number | null;
  uc: number;
  alignment: TextAlignment;
  paraDirection: TextDirection | null;
}

function defaultState(): RtfState {
  return {
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    sub: false,
    sup: false,
    fontSizePt: null,
    color: null,
    highlight: null,
    fontFamily: null,
    fontIndex: null,
    uc: 1,
    alignment: 'start',
    paraDirection: null,
  };
}

const PARSED_DESTINATIONS = new Set(['fonttbl', 'colortbl']);
const COUNTED_DESTINATIONS = new Map<string, keyof RtfParseStats>([
  ['pict', 'imageCount'],
  ['header', 'headerFooterCount'],
  ['headerl', 'headerFooterCount'],
  ['headerr', 'headerFooterCount'],
  ['headerf', 'headerFooterCount'],
  ['footer', 'headerFooterCount'],
  ['footerl', 'headerFooterCount'],
  ['footerr', 'headerFooterCount'],
  ['footerf', 'headerFooterCount'],
  ['footnote', 'footnoteCount'],
  ['object', 'embeddedObjectCount'],
]);
const SILENT_DESTINATIONS = new Set([
  'stylesheet',
  'info',
  'themedata',
  'colorschememapping',
  'latentstyles',
  'rsidtbl',
  'generator',
  'datafield',
  'filetbl',
  'listtable',
  'listoverridetable',
  'revtbl',
  'fontemb',
  'fontfile',
  'background',
  'docvar',
  'mmathPr',
  'ftnsep',
  'ftnsepc',
  'ftncn',
  'aftnsep',
  'aftnsepc',
  'aftncn',
  'endnotes',
  'objclass',
  'objname',
  'shp',
  'shpinst',
  'sp',
]);

const SYMBOL_WORDS = new Map<string, string>([
  ['emdash', '\u2014'],
  ['endash', '\u2013'],
  ['bullet', '\u2022'],
  ['lquote', '\u2018'],
  ['rquote', '\u2019'],
  ['ldblquote', '\u201c'],
  ['rdblquote', '\u201d'],
]);

const BACKSLASH = 0x5c;
const OPEN_BRACE = 0x7b;
const CLOSE_BRACE = 0x7d;
const SINGLE_QUOTE = 0x27;
const SPACE = 0x20;

function isLetterUnit(u: number): boolean {
  return (u >= 0x41 && u <= 0x5a) || (u >= 0x61 && u <= 0x7a);
}
function isDigitUnit(u: number): boolean {
  return u >= 0x30 && u <= 0x39;
}
function isHexUnit(u: number): boolean {
  return isDigitUnit(u) || (u >= 0x41 && u <= 0x46) || (u >= 0x61 && u <= 0x66);
}

/**
 * Convert input to a unit stream: values 0–0xFF are raw bytes; values above
 * 0xFF are already-decoded Unicode characters (only possible when the caller
 * passed a string containing non-Latin-1 characters — those pass through
 * untouched).
 */
function toUnits(data: string | ArrayBuffer | Uint8Array): number[] {
  if (typeof data === 'string') {
    const units: number[] = [];
    for (let i = 0; i < data.length; i++) {
      units.push(data.charCodeAt(i));
    }
    return units;
  }
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return Array.from(bytes);
}

interface ControlToken {
  word: string;
  param: number | null;
  /** For control symbols (`\` + non-letter): the symbol character. */
  symbol: string | null;
  /** Index just past the token (delimiter space consumed). */
  end: number;
}

function parseControlAt(units: number[], at: number): ControlToken | null {
  if (units[at] !== BACKSLASH || at + 1 >= units.length) return null;
  let i = at + 1;
  const first = units[i]!;
  if (!isLetterUnit(first)) {
    return { word: '', param: null, symbol: String.fromCharCode(first), end: i + 1 };
  }
  let word = '';
  while (i < units.length && isLetterUnit(units[i]!)) {
    word += String.fromCharCode(units[i]!);
    i++;
  }
  let sign = 1;
  if (i < units.length && units[i] === 0x2d && i + 1 < units.length && isDigitUnit(units[i + 1]!)) {
    sign = -1;
    i++;
  }
  let paramStr = '';
  while (i < units.length && isDigitUnit(units[i]!)) {
    paramStr += String.fromCharCode(units[i]!);
    i++;
  }
  const param = paramStr ? parseInt(paramStr, 10) * sign : null;
  if (i < units.length && units[i] === SPACE) i++;
  return { word, param, symbol: null, end: i };
}

/** Index just past the group that opens at `at` (units[at] === '{'). */
function skipGroup(units: number[], at: number): number {
  let depth = 0;
  let i = at;
  while (i < units.length) {
    const u = units[i]!;
    if (u === BACKSLASH) {
      i += 2; // escaped unit cannot be a brace
      continue;
    }
    if (u === OPEN_BRACE) {
      depth++;
      i++;
      continue;
    }
    if (u === CLOSE_BRACE) {
      depth--;
      i++;
      if (depth === 0) return i;
      continue;
    }
    i++;
  }
  return i;
}

function groupRawText(units: number[], at: number, end: number): string {
  let s = '';
  for (let i = at; i < end; i++) {
    s += String.fromCharCode(units[i]!);
  }
  return s;
}

/** Decode `\'hh` escapes inside a raw table string, then decode codepage bytes. */
function decodeTableText(raw: string, label: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (
      raw[i] === '\\' &&
      raw[i + 1] === "'" &&
      i + 3 < raw.length &&
      isHexUnit(raw.charCodeAt(i + 2)) &&
      isHexUnit(raw.charCodeAt(i + 3))
    ) {
      bytes.push(parseInt(raw.slice(i + 2, i + 4), 16));
      i += 3;
    } else {
      bytes.push(raw.charCodeAt(i) & 0xff);
    }
  }
  return getDecoder(label).decode(new Uint8Array(bytes));
}

// ---------------------------------------------------------------------------
// Core parser
// ---------------------------------------------------------------------------

export function parseRtfDocument(
  data: string | ArrayBuffer | Uint8Array,
  options: ImportOptions = {},
): RtfParseResult {
  const units = toUnits(data);
  const stats: RtfParseStats = {
    tableCount: 0,
    imageCount: 0,
    headerFooterCount: 0,
    footnoteCount: 0,
    embeddedObjectCount: 0,
  };
  const warnings: string[] = [];

  let docCodepage = 'windows-1252';
  const fontNames = new Map<number, string>();
  const fontCharsets = new Map<number, string>();
  const colorTable: (string | null)[] = [];
  let defaultFontIndex: number | null = null;

  let state = defaultState();
  const stack: RtfState[] = [];

  const paragraphs: ParagraphNode[] = [];
  let currentInline: InlineNode[] = [];
  let currentText = '';
  let pendingBytes: number[] = [];

  let inTable = false;
  let afterRow = false;

  function effectiveDecoderLabel(): string {
    if (state.fontIndex !== null) {
      const label = fontCharsets.get(state.fontIndex);
      if (label) return label;
    }
    return docCodepage;
  }

  function flushPendingBytes() {
    if (pendingBytes.length === 0) return;
    currentText += getDecoder(effectiveDecoderLabel()).decode(new Uint8Array(pendingBytes));
    pendingBytes = [];
  }

  function currentMarks(): TextMark[] {
    const marks: TextMark[] = [];
    if (state.bold) marks.push({ type: 'bold' });
    if (state.italic) marks.push({ type: 'italic' });
    if (state.underline) marks.push({ type: 'underline' });
    if (state.strike) marks.push({ type: 'strikethrough' });
    if (state.sub) marks.push({ type: 'subscript' });
    if (state.sup) marks.push({ type: 'superscript' });
    if (state.fontSizePt !== null && state.fontSizePt !== 12) {
      marks.push({ type: 'fontSize', size: state.fontSizePt });
    }
    if (state.color) marks.push({ type: 'color', color: state.color });
    if (state.highlight) marks.push({ type: 'highlight', color: state.highlight });
    if (state.fontFamily) marks.push({ type: 'fontFamily', family: state.fontFamily });
    return marks;
  }

  function flushTextRun() {
    flushPendingBytes();
    if (!currentText) return;
    const marks = currentMarks();
    currentInline.push({
      type: 'text',
      text: currentText,
      marks: marks.length > 0 ? marks : undefined,
    });
    currentText = '';
  }

  function flushParagraph() {
    flushTextRun();
    const text = currentInline
      .filter((n): n is { type: 'text'; text: string } => n.type === 'text')
      .map((n) => n.text)
      .join('');
    const direction =
      state.paraDirection ?? detectTextDirection(text, options.defaultDirection ?? 'rtl');
    paragraphs.push({
      type: 'paragraph',
      direction,
      alignment: state.alignment,
      content: currentInline,
    });
    currentInline = [];
  }

  function enterTable() {
    if (!inTable) {
      inTable = true;
      stats.tableCount++;
    }
    afterRow = false;
  }

  /** Peek at a group opening at `at`; returns the destination name if it is one. */
  function peekDestination(at: number): string | null {
    let j = at + 1;
    while (
      j < units.length &&
      (units[j] === SPACE || units[j] === 0x0d || units[j] === 0x0a)
    ) {
      j++;
    }
    if (j >= units.length || units[j] !== BACKSLASH) return null;
    if (units[j + 1] === 0x2a) {
      // \* — ignorable destination named by the following control word
      const k = j + 2;
      if (k < units.length && units[k] === BACKSLASH) {
        const named = parseControlAt(units, k);
        if (named && named.word) return named.word;
      }
      return '*';
    }
    const tok = parseControlAt(units, j);
    if (!tok || !tok.word) return null;
    if (
      PARSED_DESTINATIONS.has(tok.word) ||
      COUNTED_DESTINATIONS.has(tok.word) ||
      SILENT_DESTINATIONS.has(tok.word)
    ) {
      return tok.word;
    }
    return null;
  }

  function parseFontTable(raw: string) {
    for (const entry of raw.split(';')) {
      const fMatch = entry.match(/\\f(-?\d+)/);
      if (!fMatch) continue;
      const index = parseInt(fMatch[1]!, 10);
      const csMatch = entry.match(/\\fcharset(-?\d+)/);
      if (csMatch) {
        const label = charsetLabel(parseInt(csMatch[1]!, 10));
        if (label) fontCharsets.set(index, label);
      }
      const nameRaw = entry
        .replace(/\\[a-zA-Z]+-?\d*\s?/g, '')
        .replace(/[{}]/g, '')
        .trim();
      if (nameRaw) {
        const label =
          (csMatch ? charsetLabel(parseInt(csMatch[1]!, 10)) : null) ?? docCodepage;
        fontNames.set(index, decodeTableText(nameRaw, label));
      }
    }
  }

  function parseColorTable(raw: string) {
    colorTable.length = 0;
    for (const entry of raw.split(';')) {
      const r = entry.match(/\\red(\d+)/);
      const g = entry.match(/\\green(\d+)/);
      const b = entry.match(/\\blue(\d+)/);
      if (r && g && b) {
        const hex = [r[1], g[1], b[1]]
          .map((v) => parseInt(v!, 10).toString(16).padStart(2, '0'))
          .join('');
        colorTable.push(`#${hex}`);
      } else {
        colorTable.push(null);
      }
    }
  }

  let i = 0;
  while (i < units.length) {
    const u = units[i]!;

    if (u === OPEN_BRACE) {
      const dest = peekDestination(i);
      if (dest !== null) {
        const end = skipGroup(units, i);
        if (dest === 'fonttbl') {
          parseFontTable(groupRawText(units, i, end));
        } else if (dest === 'colortbl') {
          parseColorTable(groupRawText(units, i, end));
        } else {
          const counted = COUNTED_DESTINATIONS.get(dest);
          if (counted) stats[counted]++;
        }
        i = end;
        continue;
      }
      stack.push({ ...state });
      i++;
      continue;
    }

    if (u === CLOSE_BRACE) {
      flushTextRun();
      const prev = stack.pop();
      if (prev) state = prev;
      i++;
      continue;
    }

    if (u === BACKSLASH) {
      const tok = parseControlAt(units, i);
      if (!tok) {
        i++;
        continue;
      }
      i = tok.end;

      if (tok.symbol !== null) {
        // Control symbols
        if (tok.symbol === '\\' || tok.symbol === '{' || tok.symbol === '}') {
          flushPendingBytes();
          currentText += tok.symbol;
        } else if (tok.symbol === "'") {
          // \'hh — one codepage byte
          const h1 = units[i];
          const h2 = units[i + 1];
          if (h1 !== undefined && h2 !== undefined && isHexUnit(h1) && isHexUnit(h2)) {
            pendingBytes.push(parseInt(String.fromCharCode(h1, h2), 16));
            i += 2;
          }
        } else if (tok.symbol === '~') {
          flushPendingBytes();
          currentText += '\u00a0';
        } else if (tok.symbol === '-') {
          flushPendingBytes();
          currentText += '\u00ad';
        } else if (tok.symbol === '_') {
          flushPendingBytes();
          currentText += '\u2011';
        }
        // '*' and anything else: ignore
        continue;
      }

      const word = tok.word;
      const param = tok.param;

      switch (word) {
        case 'ansicpg':
          if (param !== null) {
            flushPendingBytes();
            docCodepage = codepageLabel(param);
          }
          break;
        case 'deff':
          if (param !== null) defaultFontIndex = param;
          break;
        case 'uc':
          if (param !== null) state.uc = param;
          break;
        case 'u': {
          if (param !== null) {
            flushPendingBytes();
            const cp = param < 0 ? param + 65536 : param;
            if (cp >= 0 && cp <= 0x10ffff) {
              currentText += String.fromCodePoint(cp);
            }
            // Skip the \uc fallback characters (each is one byte or one \'hh escape)
            let skip = state.uc;
            while (skip > 0 && i < units.length) {
              if (
                units[i] === BACKSLASH &&
                units[i + 1] === SINGLE_QUOTE &&
                i + 3 < units.length &&
                isHexUnit(units[i + 2]!) &&
                isHexUnit(units[i + 3]!)
              ) {
                i += 4;
              } else if (
                units[i] !== OPEN_BRACE &&
                units[i] !== CLOSE_BRACE &&
                units[i] !== BACKSLASH
              ) {
                i += 1;
              } else {
                break;
              }
              skip--;
            }
          }
          break;
        }
        case 'bin':
          if (param !== null && param > 0) {
            i = Math.min(units.length, i + param);
          }
          break;
        // ---- character formatting (flush the current run first) ----
        case 'b':
          flushTextRun();
          state.bold = param !== 0;
          break;
        case 'i':
          flushTextRun();
          state.italic = param !== 0;
          break;
        case 'ul':
          flushTextRun();
          state.underline = param !== 0;
          break;
        case 'ulnone':
          flushTextRun();
          state.underline = false;
          break;
        case 'strike':
          flushTextRun();
          state.strike = param !== 0;
          break;
        case 'sub':
          flushTextRun();
          state.sub = true;
          state.sup = false;
          break;
        case 'super':
          flushTextRun();
          state.sup = true;
          state.sub = false;
          break;
        case 'nosupersub':
          flushTextRun();
          state.sub = false;
          state.sup = false;
          break;
        case 'fs':
          flushTextRun();
          if (param !== null) state.fontSizePt = param / 2;
          break;
        case 'cf':
          flushTextRun();
          state.color = param !== null ? (colorTable[param] ?? null) : null;
          break;
        case 'highlight':
          flushTextRun();
          state.highlight = param !== null ? (colorTable[param] ?? null) : null;
          break;
        case 'f':
          flushPendingBytes();
          if (param !== null) {
            state.fontIndex = param;
            state.fontFamily = fontNames.get(param) ?? null;
          }
          break;
        case 'plain': {
          flushTextRun();
          const fresh = defaultState();
          state.bold = fresh.bold;
          state.italic = fresh.italic;
          state.underline = fresh.underline;
          state.strike = fresh.strike;
          state.sub = fresh.sub;
          state.sup = fresh.sup;
          state.fontSizePt = fresh.fontSizePt;
          state.color = fresh.color;
          state.highlight = fresh.highlight;
          state.fontFamily = fresh.fontFamily;
          state.fontIndex = defaultFontIndex;
          break;
        }
        // ---- paragraph control ----
        case 'par':
        case 'page':
        case 'column':
          if (afterRow && inTable) {
            inTable = false;
            afterRow = false;
          }
          flushParagraph();
          break;
        case 'sect':
          flushParagraph();
          break;
        case 'pard':
          state.alignment = 'start';
          state.paraDirection = null;
          break;
        case 'ql':
          state.alignment = 'left';
          break;
        case 'qr':
          state.alignment = 'right';
          break;
        case 'qc':
          state.alignment = 'center';
          break;
        case 'qj':
          state.alignment = 'justify';
          break;
        case 'rtlpar':
          state.paraDirection = 'rtl';
          break;
        case 'ltrpar':
          state.paraDirection = 'ltr';
          break;
        case 'line':
          flushTextRun();
          currentInline.push({ type: 'hardBreak' });
          break;
        case 'tab':
          flushPendingBytes();
          currentText += '\t';
          break;
        // ---- tables (structure dropped, cell text kept as paragraphs) ----
        case 'trowd':
          enterTable();
          break;
        case 'intbl':
          enterTable();
          break;
        case 'cell':
        case 'nestcell':
          if (inTable) flushParagraph();
          break;
        case 'row':
        case 'nestrow':
          if (inTable) {
            flushParagraph();
            afterRow = true;
          }
          break;
        default: {
          const sym = SYMBOL_WORDS.get(word);
          if (sym) {
            flushPendingBytes();
            currentText += sym;
          }
          // All other control words are ignored.
          break;
        }
      }
      continue;
    }

    if (u === 0x0d || u === 0x0a) {
      i++; // raw line breaks are insignificant in RTF
      continue;
    }

    if (u > 0xff) {
      // Already-decoded Unicode character (string input only): pass through.
      flushPendingBytes();
      currentText += String.fromCharCode(u);
      i++;
      continue;
    }

    pendingBytes.push(u);
    i++;
  }

  flushParagraph();

  const finalParagraphs = paragraphs.filter((p) => p.content.length > 0);

  return { paragraphs: finalParagraphs, stats, warnings };
}

// ---------------------------------------------------------------------------
// Story-level importer (legacy contract, kept for existing callers)
// ---------------------------------------------------------------------------

export function importRtf(
  rtfContent: string | ArrayBuffer,
  options: ImportOptions = {},
): ImportTextResult {
  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  const byteSize =
    typeof rtfContent === 'string' ? new Blob([rtfContent]).size : rtfContent.byteLength;
  validateResourceLimits(byteSize, limits);

  const { paragraphs, warnings } = parseRtfDocument(rtfContent, options);

  const story: RichTextDocument = {
    type: 'doc',
    content:
      paragraphs.length > 0 ? paragraphs : [paragraph('', options.defaultDirection ?? 'rtl')],
  };

  if (story.content.length > limits.maxParagraphCount) {
    throw new Error(
      `Paragraph count (${story.content.length}) exceeds resource limit of ${limits.maxParagraphCount}`,
    );
  }

  const fullText = story.content
    .map((p) => p.content.map((c: InlineNode) => (c.type === 'text' ? c.text : '')).join(''))
    .join(' ');
  const words = fullText.trim().split(/\s+/).filter(Boolean);

  return {
    type: 'story',
    story,
    paragraphCount: story.content.length,
    wordCount: words.length,
    detectedFormat: 'rtf',
    warnings,
  };
}

// ---------------------------------------------------------------------------
// End-to-end document importer
// ---------------------------------------------------------------------------

/**
 * End-to-end RTF import: RTF bytes -> validated canonical RePageDocument
 * plus an honest import report (same contract as `importDocxFile`).
 *
 * Supported: paragraphs, bold/italic/underline/strike/sub/superscript runs,
 * font size, text color + highlight (via the color table), font family (via
 * the font table), paragraph alignment and `\rtlpar`/`\ltrpar` direction,
 * `\uN` Unicode escapes, and legacy codepage text (document `\ansicpg` and
 * per-font `\fcharset` decoding — cp1256 covers Urdu/Arabic Word files).
 *
 * Counted and reported as dropped, never mangled: table structure (cell text
 * is kept as ordinary paragraphs), embedded pictures, headers/footers,
 * footnotes and OLE objects.
 */
export async function importRtfFile(
  data: string | ArrayBuffer | Uint8Array,
  filename = 'document.rtf',
  options: ImportOptions = {},
): Promise<DocumentImportResult> {
  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  const byteSize =
    typeof data === 'string' ? new Blob([data]).size : data.byteLength;
  validateResourceLimits(byteSize, limits);

  const { paragraphs, stats, warnings } = parseRtfDocument(data, options);

  if (paragraphs.length > limits.maxParagraphCount) {
    throw new Error(
      `Paragraph count (${paragraphs.length}) exceeds resource limit of ${limits.maxParagraphCount}`,
    );
  }

  const dropped: string[] = [];
  if (stats.tableCount > 0) {
    dropped.push(
      `${stats.tableCount} table(s): structure dropped, cell text kept as paragraphs`,
    );
  }
  if (stats.imageCount > 0) {
    dropped.push(`${stats.imageCount} embedded picture(s) skipped`);
  }
  if (stats.headerFooterCount > 0) {
    dropped.push(`${stats.headerFooterCount} header/footer section(s) skipped`);
  }
  if (stats.footnoteCount > 0) {
    dropped.push(`${stats.footnoteCount} footnote(s) skipped`);
  }
  if (stats.embeddedObjectCount > 0) {
    dropped.push(`${stats.embeddedObjectCount} embedded object(s) skipped`);
  }

  const { document } = await assembleImportedDocument({
    title: cleanImportTitle(filename, 'Imported RTF document'),
    storyName: 'Imported RTF content',
    blocks: paragraphs.map((node) => ({ kind: 'paragraph' as const, node })),
    fallbackParagraph: paragraph('', options.defaultDirection ?? 'rtl'),
  });

  return {
    document,
    report: {
      filename,
      paragraphCount: paragraphs.length,
      wordCount: countStoryWords(paragraphs),
      headingCount: 0,
      listItemCount: 0,
      tableCount: stats.tableCount,
      imageCount: stats.imageCount,
      footnoteCount: stats.footnoteCount,
      pageCount: document.pageOrder.length,
      dropped,
      warnings,
    },
  };
}
