import JSZip from 'jszip';
import type {
  InlineNode,
  ParagraphNode,
  RichTextDocument,
  TextAlignment,
  TextDirection,
  TextMark,
} from '../../domain/rich-text/types';
import { detectTextDirection } from './textImporter';
import { DEFAULT_RESOURCE_LIMITS, ImportOptions } from './importEngine';

/**
 * DOCX (Office Open XML) parser: .docx zip bytes -> ordered content blocks.
 *
 * Pure parsing stage of the import pipeline. Document assembly (canonical
 * model, pages, frames) lives in docxImporter.ts. Text is NEVER normalized
 * here: joiners, bidi controls, combining marks and aerab pass through
 * byte-identical via textContent.
 */

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

export interface DocxTableCellData {
  content: RichTextDocument;
  colSpan: number;
  rowSpan: number;
  backgroundColor?: string | undefined;
}

export interface DocxTableData {
  rows: DocxTableCellData[][];
}

export type DocxBlock =
  | { kind: 'paragraph'; node: ParagraphNode }
  | { kind: 'table'; table: DocxTableData }
  | { kind: 'imageMarker'; imageIndex: number };

export interface DocxImageData {
  /** Original file name inside the package, e.g. "image1.png". */
  name: string;
  mediaType: string;
  bytes: Uint8Array;
}

export interface DocxFootnoteData {
  number: number;
  text: string;
}

export interface DocxParseStats {
  paragraphCount: number;
  headingCount: number;
  listItemCount: number;
  tableCount: number;
  tableCellCount: number;
  imageCount: number;
  footnoteCount: number;
  insertedTextRuns: number;
  deletedTextRuns: number;
  commentRanges: number;
  textBoxes: number;
  oleObjects: number;
  altChunks: number;
}

export interface ParsedDocx {
  blocks: DocxBlock[];
  images: DocxImageData[];
  footnotes: DocxFootnoteData[];
  warnings: string[];
  stats: DocxParseStats;
}

// ---------------------------------------------------------------------------
// Hardening limits (ZIP bomb / resource protection, per docs/DEPENDENCIES.md)
// ---------------------------------------------------------------------------

const MAX_ZIP_ENTRIES = 2000;
const MAX_UNCOMPRESSED_BYTES = 200 * 1024 * 1024; // 200 MB total
const MAX_IMAGES = 100;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB per image
const MAX_TABLE_ROWS = 300;
const MAX_TABLE_COLS = 63; // Word's own column cap
const MAX_LIST_LEVEL = 8;

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

// ---------------------------------------------------------------------------
// Namespace-agnostic XML helpers (producers sometimes re-prefix w:)
// ---------------------------------------------------------------------------

function isEl(node: Node | null | undefined): node is Element {
  return !!node && node.nodeType === 1;
}

function kids(el: Element, local: string): Element[] {
  const out: Element[] = [];
  for (const child of Array.from(el.childNodes)) {
    if (isEl(child) && child.localName === local) out.push(child);
  }
  return out;
}

function kid(el: Element, local: string): Element | undefined {
  return kids(el, local)[0];
}

/** Deep search by local name, not crossing into nested w:p / w:tbl islands. */
function descendants(el: Element, local: string, stopAt: Set<string> = new Set(['p', 'tbl'])): Element[] {
  const out: Element[] = [];
  const walk = (node: Element, isRoot: boolean) => {
    for (const child of Array.from(node.childNodes)) {
      if (!isEl(child)) continue;
      if (!isRoot && stopAt.has(child.localName)) continue;
      if (child.localName === local) out.push(child);
      walk(child, false);
    }
  };
  walk(el, true);
  return out;
}

function attr(el: Element, local: string): string | undefined {
  for (const a of Array.from(el.attributes)) {
    if (a.localName === local) return a.value;
  }
  return undefined;
}

function parseXml(text: string, what: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  const err = doc.getElementsByTagName('parsererror')[0];
  if (err) {
    throw new Error(`Could not parse ${what}: malformed XML.`);
  }
  return doc;
}

// ---------------------------------------------------------------------------
// Numbering (lists)
// ---------------------------------------------------------------------------

interface LevelFormat {
  kind: 'bullet' | 'ordered';
  levelText: string;
  start: number;
}

type NumberingMap = Map<number, Map<number, LevelFormat>>;

const ORDERED_FORMATS = new Set([
  'decimal',
  'decimalZero',
  'lowerLetter',
  'upperLetter',
  'lowerRoman',
  'upperRoman',
  'decimalEnclosedCircle',
  'ordinal',
  'cardinalText',
  'ordinalText',
]);

function parseNumbering(xml: string | undefined, warnings: string[]): NumberingMap {
  const map: NumberingMap = new Map();
  if (!xml) return map;
  try {
    const doc = parseXml(xml, 'numbering.xml');
    const abstract = new Map<number, Map<number, LevelFormat>>();
    for (const a of Array.from(doc.getElementsByTagNameNS(W_NS, 'abstractNum'))) {
      const id = Number(attr(a, 'abstractNumId'));
      if (!Number.isFinite(id)) continue;
      const levels = new Map<number, LevelFormat>();
      for (const lvl of kids(a, 'lvl')) {
        const ilvl = Number(attr(lvl, 'ilvl'));
        if (!Number.isFinite(ilvl)) continue;
        const fmt = kid(lvl, 'numFmt');
        const fmtVal = fmt ? attr(fmt, 'val') : undefined;
        const text = kid(lvl, 'lvlText');
        const startEl = kid(lvl, 'start');
        const kind: 'bullet' | 'ordered' =
          fmtVal === 'bullet' ? 'bullet' : fmtVal && ORDERED_FORMATS.has(fmtVal) ? 'ordered' : 'bullet';
        if (fmtVal && fmtVal !== 'bullet' && !ORDERED_FORMATS.has(fmtVal)) {
          warnings.push(`Unsupported list numbering format "${fmtVal}" treated as bullets.`);
        }
        levels.set(ilvl, {
          kind,
          levelText: text ? attr(text, 'val') ?? '' : '',
          start: startEl ? Number(attr(startEl, 'val') ?? '1') || 1 : 1,
        });
      }
      abstract.set(id, levels);
    }
    for (const num of Array.from(doc.getElementsByTagNameNS(W_NS, 'num'))) {
      const numId = Number(attr(num, 'numId'));
      const absIdEl = kid(num, 'abstractNumId');
      const absId = absIdEl ? Number(attr(absIdEl, 'val')) : NaN;
      if (!Number.isFinite(numId) || !Number.isFinite(absId)) continue;
      const levels = abstract.get(absId);
      if (levels) map.set(numId, levels);
    }
  } catch {
    warnings.push('numbering.xml could not be parsed; lists fall back to plain bullets.');
  }
  return map;
}

// ---------------------------------------------------------------------------
// Relationships (images)
// ---------------------------------------------------------------------------

function parseRels(xml: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!xml) return map;
  try {
    const doc = parseXml(xml, 'document.xml.rels');
    for (const rel of Array.from(doc.getElementsByTagName('Relationship'))) {
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target');
      if (id && target) map.set(id, target);
    }
  } catch {
    // non-fatal: images simply won't resolve
  }
  return map;
}

// ---------------------------------------------------------------------------
// Parser context
// ---------------------------------------------------------------------------

interface Ctx {
  numbering: NumberingMap;
  rels: Map<string, string>;
  imageTargets: { name: string; target: string }[];
  warnings: string[];
  stats: DocxParseStats;
  counters: Map<string, number>;
  footnoteOrder: number[];
  footnoteTexts: Map<number, string>;
  deadline: number;
  checkCount: number;
}

function checkDeadline(ctx: Ctx): void {
  ctx.checkCount += 1;
  if (ctx.checkCount % 400 === 0 && Date.now() > ctx.deadline) {
    throw new Error('Import timed out while parsing the document. Try a smaller file.');
  }
}

// ---------------------------------------------------------------------------
// Run-level parsing
// ---------------------------------------------------------------------------

const HIGHLIGHT_HEX: Record<string, string> = {
  yellow: '#FFFF00',
  green: '#00FF00',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  blue: '#0000FF',
  red: '#FF0000',
  darkBlue: '#000080',
  darkCyan: '#008080',
  darkGreen: '#008000',
  darkMagenta: '#800080',
  darkRed: '#800000',
  darkYellow: '#808000',
  darkGray: '#808080',
  lightGray: '#C0C0C0',
  black: '#000000',
};

const UNDERLINE_STYLE: Record<string, TextMark> = {
  single: { type: 'underline', style: 'single' },
  double: { type: 'underline', style: 'double' },
  thick: { type: 'underline', style: 'thick' },
  dotted: { type: 'underline', style: 'dotted' },
  dashed: { type: 'underline', style: 'dashed' },
  wave: { type: 'underline', style: 'wave' },
};

function marksFromRPr(rPr: Element | undefined, warnings: string[]): TextMark[] {
  const marks: TextMark[] = [];
  if (!rPr) return marks;

  if (kid(rPr, 'b') || kid(rPr, 'bCs')) marks.push({ type: 'bold' });
  if (kid(rPr, 'i') || kid(rPr, 'iCs')) marks.push({ type: 'italic' });

  const u = kid(rPr, 'u');
  if (u) {
    const val = attr(u, 'val') ?? 'single';
    if (val !== 'none') {
      marks.push(UNDERLINE_STYLE[val] ?? { type: 'underline', style: 'single' });
    }
  }

  if (kid(rPr, 'strike') || kid(rPr, 'dstrike')) marks.push({ type: 'strikethrough' });

  const vert = kid(rPr, 'vertAlign');
  if (vert) {
    const v = attr(vert, 'val');
    if (v === 'superscript') marks.push({ type: 'superscript' });
    else if (v === 'subscript') marks.push({ type: 'subscript' });
  }

  const color = kid(rPr, 'color');
  if (color) {
    const val = attr(color, 'val');
    if (val && val !== 'auto' && /^[0-9a-fA-F]{6}$/.test(val)) {
      marks.push({ type: 'color', color: `#${val.toUpperCase()}` });
    }
  }

  const highlight = kid(rPr, 'highlight');
  if (highlight) {
    const val = attr(highlight, 'val');
    const hex = val ? HIGHLIGHT_HEX[val] : undefined;
    if (hex) marks.push({ type: 'highlight', color: hex });
    else if (val && val !== 'none') warnings.push(`Unknown highlight color "${val}" skipped.`);
  }

  const sz = kid(rPr, 'sz') ?? kid(rPr, 'szCs');
  if (sz) {
    const half = Number(attr(sz, 'val'));
    if (Number.isFinite(half) && half > 0 && half <= 1638) {
      marks.push({ type: 'fontSize', size: half / 2 });
    }
  }

  const fonts = kid(rPr, 'rFonts');
  if (fonts) {
    const family = attr(fonts, 'cs') ?? attr(fonts, 'ascii') ?? attr(fonts, 'hAnsi');
    if (family && family.trim()) marks.push({ type: 'fontFamily', family: family.trim() });
  }

  return marks;
}

interface RunAcc {
  inlines: InlineNode[];
  imageAnchors: { relId: string }[];
}

/** Parse one w:r (or accepted wrapper) into inline nodes. */
function parseRun(r: Element, ctx: Ctx, acc: RunAcc): void {
  const rPr = kid(r, 'rPr');
  const marks = marksFromRPr(rPr, ctx.warnings);

  for (const child of Array.from(r.childNodes)) {
    if (!isEl(child)) continue;
    switch (child.localName) {
      case 't': {
        const text = child.textContent ?? '';
        if (text) {
          acc.inlines.push({ type: 'text', text, marks: marks.length > 0 ? marks : undefined });
        }
        break;
      }
      case 'br':
      case 'cr': {
        // <w:br w:type="page|column"/> is an explicit layout break;
        // untyped breaks (and w:type="textWrapping") are line breaks.
        const brType = child.localName === 'br' ? attr(child, 'type') : undefined;
        if (brType === 'page' || brType === 'column') {
          acc.inlines.push({ type: 'break', breakType: brType });
        } else {
          acc.inlines.push({ type: 'hardBreak' });
        }
        break;
      }
      case 'tab':
        // Tabs have no reliable canvas metric; four spaces is the honest, visible mapping.
        acc.inlines.push({ type: 'text', text: '    ', marks: marks.length > 0 ? marks : undefined });
        break;
      case 'noBreakHyphen':
        acc.inlines.push({ type: 'text', text: '‑', marks: marks.length > 0 ? marks : undefined });
        break;
      case 'drawing':
      case 'pict': {
        const blip = descendants(child, 'blip', new Set())[0];
        const relId = blip ? attr(blip, 'embed') : undefined;
        if (relId) acc.imageAnchors.push({ relId });
        else {
          const vImage = descendants(child, 'imagedata', new Set())[0];
          const vRel = vImage ? attr(vImage, 'id') : undefined;
          if (vRel) acc.imageAnchors.push({ relId: vRel });
        }
        break;
      }
      case 'footnoteReference': {
        const id = Number(attr(child, 'id'));
        if (Number.isFinite(id) && id > 1) {
          if (!ctx.footnoteOrder.includes(id)) ctx.footnoteOrder.push(id);
          const n = ctx.footnoteOrder.indexOf(id) + 1;
          acc.inlines.push({
            type: 'text',
            text: `[${n}]`,
            marks: [...marks, { type: 'superscript' }],
          });
        }
        break;
      }
      case 'endnoteReference': {
        const id = Number(attr(child, 'id'));
        if (Number.isFinite(id) && id > 1) {
          if (!ctx.footnoteOrder.includes(id)) ctx.footnoteOrder.push(id);
          const n = ctx.footnoteOrder.indexOf(id) + 1;
          acc.inlines.push({
            type: 'text',
            text: `[${n}]`,
            marks: [...marks, { type: 'superscript' }],
          });
        }
        break;
      }
      default:
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Paragraph parsing
// ---------------------------------------------------------------------------

const HEADING_STYLE_IDS: Record<string, string> = {
  heading1: 'heading1',
  heading2: 'heading2',
  heading3: 'subheading',
  heading4: 'subheading',
  heading5: 'subheading',
  heading6: 'subheading',
  heading7: 'subheading',
  heading8: 'subheading',
  heading9: 'subheading',
  title: 'headline',
  subtitle: 'subheading',
};

function headingLevelFromStyle(styleId: string | undefined): string | undefined {
  if (!styleId) return undefined;
  const norm = styleId.toLowerCase().replace(/\s+/g, '');
  if (HEADING_STYLE_IDS[norm]) return HEADING_STYLE_IDS[norm];
  const m = norm.match(/^heading([1-9])$/);
  if (m) return HEADING_STYLE_IDS[`heading${m[1]}`];
  return undefined;
}

function alignmentFromJc(val: string | undefined): TextAlignment {
  switch (val) {
    case 'center':
      return 'center';
    case 'end':
    case 'right':
      return 'right';
    case 'left':
      return 'left';
    case 'both':
    case 'distribute':
      return 'justify';
    default:
      return 'start';
  }
}

/** Recursively collect runs from paragraph-level wrappers (hyperlink, ins, sdt, ...). */
function collectRuns(p: Element, ctx: Ctx, acc: RunAcc): void {
  for (const child of Array.from(p.childNodes)) {
    if (!isEl(child)) continue;
    switch (child.localName) {
      case 'r':
        parseRun(child, ctx, acc);
        break;
      case 'hyperlink':
      case 'smartTag':
        collectRuns(child, ctx, acc);
        break;
      case 'sdt': {
        const content = kid(child, 'sdtContent');
        if (content) collectRuns(content, ctx, acc);
        break;
      }
      case 'ins':
        ctx.stats.insertedTextRuns += 1;
        collectRuns(child, ctx, acc); // tracked insertions are accepted
        break;
      case 'moveTo':
        collectRuns(child, ctx, acc);
        break;
      case 'del':
      case 'moveFrom':
        ctx.stats.deletedTextRuns += 1; // tracked deletions are dropped
        break;
      case 'commentRangeStart':
        ctx.stats.commentRanges += 1;
        break;
      case 'bookmarkStart':
      case 'bookmarkEnd':
      case 'commentRangeEnd':
      case 'proofErr':
      case 'permStart':
      case 'permEnd':
        break; // metadata only
      case 'oMath':
      case 'oMathPara':
        ctx.warnings.push('A math equation was skipped (equations are not imported).');
        break;
      case 'object':
        ctx.stats.oleObjects += 1;
        break;
      default:
        break;
    }
  }
}

function resolveListMarker(
  numId: number,
  ilvl: number,
  ctx: Ctx,
): { kind: 'bullet' | 'ordered'; marker: string } | undefined {
  const levels = ctx.numbering.get(numId);
  const level = levels?.get(Math.min(ilvl, MAX_LIST_LEVEL));
  if (!level) return undefined;
  if (level.kind === 'bullet') return { kind: 'bullet', marker: '• ' };
  const key = `${numId}:${ilvl}`;
  const n = (ctx.counters.get(key) ?? level.start - 1) + 1;
  ctx.counters.set(key, n);
  let text = level.levelText || '%1.';
  text = text.replace(/%([1-9])/g, (_m, d) => {
    const lvl = Number(d) - 1;
    if (lvl === ilvl) return String(n);
    return String(ctx.counters.get(`${numId}:${lvl}`) ?? 1);
  });
  return { kind: 'ordered', marker: `${text} ` };
}

export function parseParagraph(
  p: Element,
  ctx: Ctx,
  opts: { inTableCell?: boolean } = {},
): { node: ParagraphNode | undefined; imageRelIds: string[] } {
  checkDeadline(ctx);
  const pPr = kid(p, 'pPr');

  const acc: RunAcc = { inlines: [], imageAnchors: [] };
  collectRuns(p, ctx, acc);
  const imageRelIds = acc.imageAnchors.map((a) => a.relId);

  const text = acc.inlines
    .filter((n): n is { type: 'text'; text: string } => n.type === 'text')
    .map((n) => n.text)
    .join('');

  // Paragraphs that only anchored images still count as content (image marker).
  if (!text.trim() && acc.inlines.length === 0 && acc.imageAnchors.length === 0) {
    return { node: undefined, imageRelIds };
  }

  let direction: TextDirection = detectTextDirection(text, 'rtl');
  let alignment: TextAlignment = 'start';
  let styleId: string | undefined;
  let indentLevel = 0;
  let spaceBefore: number | undefined;
  let spaceAfter: number | undefined;
  let backgroundColor: string | undefined;
  let listMarker: string | undefined;
  let isHeading = false;
  let pageBreakBefore = false;

  if (pPr) {
    if (kid(pPr, 'pageBreakBefore')) pageBreakBefore = true;

    const explicitRtl = !!kid(pPr, 'bidi');
    if (explicitRtl) direction = 'rtl';
    else direction = detectTextDirection(text, 'rtl');

    const jc = kid(pPr, 'jc');
    alignment = alignmentFromJc(jc ? attr(jc, 'val') : undefined);

    const pStyle = kid(pPr, 'pStyle');
    const styleVal = pStyle ? attr(pStyle, 'val') : undefined;
    const headingId = headingLevelFromStyle(styleVal);
    if (headingId) {
      styleId = headingId;
      isHeading = true;
      ctx.stats.headingCount += 1;
    }
    const outline = kid(pPr, 'outlineLvl');
    if (outline && !isHeading) {
      const lvl = Number(attr(outline, 'val'));
      if (Number.isFinite(lvl) && lvl <= 2) {
        styleId = lvl === 0 ? 'heading1' : 'heading2';
        isHeading = true;
        ctx.stats.headingCount += 1;
      }
    }

    const numPr = kid(pPr, 'numPr');
    if (numPr && !opts.inTableCell) {
      const numIdEl = kid(numPr, 'numId');
      const ilvlEl = kid(numPr, 'ilvl');
      const numId = numIdEl ? Number(attr(numIdEl, 'val')) : NaN;
      const ilvl = ilvlEl ? Number(attr(ilvlEl, 'val') ?? '0') : 0;
      if (Number.isFinite(numId) && numId > 0) {
        const resolved = resolveListMarker(numId, ilvl, ctx);
        if (resolved) {
          listMarker = resolved.marker;
          indentLevel = Math.min(ilvl, MAX_LIST_LEVEL);
          ctx.stats.listItemCount += 1;
        } else {
          // Numbering reference missing: honest bullet fallback, counted once per numId.
          const key = `nummissing:${numId}`;
          if (!ctx.counters.has(key)) {
            ctx.counters.set(key, 1);
            ctx.warnings.push(`List numbering ${numId} has no definition; items shown as plain bullets.`);
          }
          listMarker = '• ';
          ctx.stats.listItemCount += 1;
        }
      }
    }

    const spacing = kid(pPr, 'spacing');
    if (spacing) {
      const before = Number(attr(spacing, 'before') ?? '');
      const after = Number(attr(spacing, 'after') ?? '');
      if (Number.isFinite(before) && before > 0) spaceBefore = before / 20;
      if (Number.isFinite(after) && after > 0) spaceAfter = after / 20;
    }

    const shd = kid(pPr, 'shd');
    if (shd) {
      const fill = attr(shd, 'fill');
      if (fill && fill !== 'auto' && /^[0-9a-fA-F]{6}$/.test(fill)) {
        backgroundColor = `#${fill.toUpperCase()}`;
      }
    }
  }

  // (direction already resolved above: explicit bidi wins, else detected)

  let inlines: InlineNode[] = acc.inlines;
  if (listMarker) {
    // The canvas/print renderers draw plain text; the marker must be visible text.
    inlines = [{ type: 'text', text: listMarker }, ...inlines];
  }
  if (isHeading) {
    // Bake heading emphasis into the runs so every renderer shows it,
    // even where named style presets are not applied.
    inlines = inlines.map((n) => {
      if (n.type !== 'text') return n;
      const marks: TextMark[] = [...(n.marks ?? [])];
      if (!marks.some((m) => m.type === 'bold')) marks.push({ type: 'bold' });
      return { ...n, marks };
    });
  }

  ctx.stats.paragraphCount += 1;
  return {
    node: {
      type: 'paragraph',
      direction,
      alignment,
      styleId,
      indentLevel: indentLevel > 0 ? indentLevel : undefined,
      spaceBefore,
      spaceAfter,
      backgroundColor,
      pageBreakBefore: pageBreakBefore ? true : undefined,
      content: inlines,
    },
    imageRelIds,
  };
}

// ---------------------------------------------------------------------------
// Table parsing
// ---------------------------------------------------------------------------

function parseTableCell(tc: Element, ctx: Ctx): { node: ParagraphNode; colSpan: number; vMerge: 'restart' | 'continue' | 'none'; backgroundColor?: string | undefined } {
  const tcPr = kid(tc, 'tcPr');
  let colSpan = 1;
  let vMerge: 'restart' | 'continue' | 'none' = 'none';
  let backgroundColor: string | undefined;
  if (tcPr) {
    const gridSpan = kid(tcPr, 'gridSpan');
    if (gridSpan) {
      const v = Number(attr(gridSpan, 'val'));
      if (Number.isFinite(v) && v >= 1 && v <= MAX_TABLE_COLS) colSpan = v;
    }
    const vm = kid(tcPr, 'vMerge');
    if (vm) {
      // <w:vMerge/> (no val) or val="continue" extends a merge; val="restart" starts one.
      vMerge = attr(vm, 'val') === 'restart' ? 'restart' : 'continue';
    }
    const shd = kid(tcPr, 'shd');
    if (shd) {
      const fill = attr(shd, 'fill');
      if (fill && fill !== 'auto' && /^[0-9a-fA-F]{6}$/.test(fill)) {
        backgroundColor = `#${fill.toUpperCase()}`;
      }
    }
  }

  const paras: ParagraphNode[] = [];
  for (const p of kids(tc, 'p')) {
    const { node, imageRelIds } = parseParagraph(p, ctx, { inTableCell: true });
    if (node) paras.push(node);
    if (imageRelIds.length > 0 && !ctx.warnings.some((w) => w.includes('inside table cells'))) {
      ctx.warnings.push('Images inside table cells were skipped (only body images are imported).');
    }
    if (paras.length > 200) break;
  }
  // Nested tables are dropped with a count (no recursive table-in-table).
  const nested = kids(tc, 'tbl').length;
  if (nested > 0) {
    ctx.warnings.push(`${nested} nested table(s) inside a table cell were skipped.`);
  }
  if (paras.length === 0) {
    paras.push({ type: 'paragraph', direction: 'rtl', alignment: 'start', content: [] });
  }
  return {
    node: paras[0]!,
    colSpan,
    vMerge,
    backgroundColor,
  };
}

function parseTable(tbl: Element, ctx: Ctx): DocxTableData | undefined {
  checkDeadline(ctx);
  const gridCols = kids(kid(tbl, 'tblGrid') ?? tbl, 'gridCol').length;
  const rows: DocxTableCellData[][] = [];
  // Per-column vertical-merge tracking: index -> row position of the merge head.
  const mergeHeads: (number | null)[] = [];

  const trEls = kids(tbl, 'tr');
  for (let r = 0; r < trEls.length && r < MAX_TABLE_ROWS; r++) {
    const tr = trEls[r]!;
    const row: DocxTableCellData[] = [];
    let col = 0;
    const tcEls = kids(tr, 'tc');
    for (const tc of tcEls) {
      if (col >= MAX_TABLE_COLS) break;
      const cell = parseTableCell(tc, ctx);
      if (cell.vMerge === 'continue') {
        // Extend the merge head's rowSpan; this cell contributes no new cell.
        const headRow = mergeHeads[col];
        if (headRow !== null && headRow !== undefined && rows[headRow]) {
          // Find the head cell covering this column and extend it.
          let acc = 0;
          for (const c of rows[headRow]!) {
            if (col >= acc && col < acc + c.colSpan) {
              c.rowSpan += 1;
              break;
            }
            acc += c.colSpan;
          }
        } else {
          // Orphan continuation: render as an empty cell rather than losing the column.
          row.push({
            content: { type: 'doc', content: [cell.node] },
            colSpan: cell.colSpan,
            rowSpan: 1,
            backgroundColor: cell.backgroundColor,
          });
        }
        col += cell.colSpan;
        continue;
      }
      const rowSpan = 1;
      row.push({
        content: { type: 'doc', content: [cell.node] },
        colSpan: cell.colSpan,
        rowSpan,
        backgroundColor: cell.backgroundColor,
      });
      if (cell.vMerge === 'restart') {
        for (let c = col; c < col + cell.colSpan; c++) mergeHeads[c] = r;
      }
      col += cell.colSpan;
    }
    // A row made only of continuations still occupies the row.
    rows.push(row);
    ctx.stats.tableCellCount += row.length;
  }

  if (rows.length === 0) return undefined;
  if (trEls.length > MAX_TABLE_ROWS) {
    ctx.warnings.push(`Table truncated to ${MAX_TABLE_ROWS} rows (resource limit).`);
  }
  ctx.stats.tableCount += 1;
  void gridCols;
  return { rows };
}

// ---------------------------------------------------------------------------
// Footnotes
// ---------------------------------------------------------------------------

function parseFootnotes(xml: string | undefined, ctx: Ctx): void {
  if (!xml) return;
  try {
    const doc = parseXml(xml, 'footnotes.xml');
    for (const fn of Array.from(doc.getElementsByTagNameNS(W_NS, 'footnote'))) {
      const id = Number(attr(fn, 'id'));
      if (!Number.isFinite(id) || id <= 1) continue; // 0/1 are separators
      const texts: string[] = [];
      for (const p of kids(fn, 'p')) {
        const { node } = parseParagraph(p, ctx, { inTableCell: true });
        if (node) {
          texts.push(node.content.map((n) => (n.type === 'text' ? n.text : '')).join(''));
        }
      }
      const text = texts.join(' ').trim();
      if (text) ctx.footnoteTexts.set(id, text);
    }
  } catch {
    ctx.warnings.push('footnotes.xml could not be parsed; footnote texts were skipped.');
  }
}

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------

function sniffMediaType(bytes: Uint8Array): string | undefined {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif';
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return 'image/bmp';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Main entry: zip bytes -> parsed blocks
// ---------------------------------------------------------------------------

export async function parseDocxFile(
  data: ArrayBuffer | Uint8Array,
  options: ImportOptions = {},
): Promise<ParsedDocx> {
  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  validateSize(bytes.byteLength, limits.maxFileSizeBytes);

  if (typeof DOMParser === 'undefined') {
    throw new Error('DOCX import needs an XML parser (DOMParser), which is unavailable here.');
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new Error('This file is not a valid .docx (ZIP container unreadable).');
  }

  // ---- ZIP hardening: entry caps and path traversal (per docs/DEPENDENCIES.md) ----
  // Uncompressed-size protection is enforced incrementally as entries are
  // actually read (see readText / image extraction below), using only the
  // public JSZip API.
  const entries = Object.values(zip.files);
  if (entries.length > MAX_ZIP_ENTRIES) {
    throw new Error(`Archive has too many entries (${entries.length}); refusing to parse.`);
  }
  for (const e of entries) {
    if (e.dir) continue;
    const name = e.name;
    if (name.includes('..') || name.startsWith('/') || /^[a-zA-Z]:/.test(name)) {
      throw new Error('Archive contains an unsafe entry path; refusing to parse.');
    }
  }

  let bytesExpanded = 0;
  const noteExpanded = (n: number) => {
    bytesExpanded += n;
    if (bytesExpanded > MAX_UNCOMPRESSED_BYTES) {
      throw new Error('Archive expands to an unsafe size (possible ZIP bomb); refusing to parse.');
    }
  };

  const readText = async (path: string): Promise<string | undefined> => {
    const f = zip.file(path);
    if (!f) return undefined;
    const text = await f.async('string');
    noteExpanded(text.length * 2); // rough UTF-16 bytes
    return text;
  };

  const documentXml = await readText('word/document.xml');
  if (!documentXml) {
    throw new Error('This file is not a valid .docx (word/document.xml missing).');
  }

  const ctx: Ctx = {
    numbering: new Map(),
    rels: parseRels(await readText('word/_rels/document.xml.rels')),
    imageTargets: [],
    warnings: [],
    stats: {
      paragraphCount: 0,
      headingCount: 0,
      listItemCount: 0,
      tableCount: 0,
      tableCellCount: 0,
      imageCount: 0,
      footnoteCount: 0,
      insertedTextRuns: 0,
      deletedTextRuns: 0,
      commentRanges: 0,
      textBoxes: 0,
      oleObjects: 0,
      altChunks: 0,
    },
    counters: new Map(),
    footnoteOrder: [],
    footnoteTexts: new Map(),
    deadline: Date.now() + limits.parseTimeoutMs,
    checkCount: 0,
  };
  ctx.numbering = parseNumbering(await readText('word/numbering.xml'), ctx.warnings);

  parseFootnotes(await readText('word/footnotes.xml'), ctx);

  const doc = parseXml(documentXml, 'word/document.xml');
  const body = doc.getElementsByTagNameNS(W_NS, 'body')[0] ?? doc.getElementsByTagName('w:body')[0];
  if (!body) {
    throw new Error('This file is not a valid .docx (document body missing).');
  }

  const blocks: DocxBlock[] = [];
  const imageAnchorRelIds: string[] = [];

  const processBlockChildren = (parent: Element) => {
    for (const child of Array.from(parent.childNodes)) {
      if (!isEl(child)) continue;
      switch (child.localName) {
        case 'p': {
          const { node, imageRelIds } = parseParagraph(child, ctx);
          if (node) blocks.push({ kind: 'paragraph', node });
          for (const relId of imageRelIds) {
            if (!imageAnchorRelIds.includes(relId)) {
              imageAnchorRelIds.push(relId);
              blocks.push({ kind: 'imageMarker', imageIndex: imageAnchorRelIds.length - 1 });
            }
          }
          if (blocks.length > limits.maxParagraphCount) {
            throw new Error(
              `Paragraph count exceeds resource limit of ${limits.maxParagraphCount}.`,
            );
          }
          break;
        }
        case 'tbl': {
          const table = parseTable(child, ctx);
          if (table) blocks.push({ kind: 'table', table });
          break;
        }
        case 'sdt': {
          const content = kid(child, 'sdtContent');
          if (content) processBlockChildren(content);
          break;
        }
        case 'sectPr':
          break; // section properties: page geometry lives in RePage, not imported
        case 'altChunk':
          ctx.stats.altChunks += 1;
          break;
        default:
          break;
      }
    }
  };
  processBlockChildren(body);

  // ---- Resolve images ----
  const images: DocxImageData[] = [];
  for (const relId of imageAnchorRelIds) {
    if (images.length >= MAX_IMAGES) {
      ctx.warnings.push(`Only the first ${MAX_IMAGES} images were imported (resource limit).`);
      break;
    }
    const target = ctx.rels.get(relId);
    if (!target) {
      ctx.warnings.push('An image reference could not be resolved and was skipped.');
      continue;
    }
    const normalized = target.startsWith('word/') ? target : `word/${target.replace(/^\//, '')}`;
    const file = zip.file(normalized);
    if (!file || file.dir) {
      ctx.warnings.push(`Image "${target}" is missing from the package and was skipped.`);
      continue;
    }
    const raw = await file.async('uint8array');
    noteExpanded(raw.byteLength);
    if (raw.byteLength > MAX_IMAGE_BYTES) {
      ctx.warnings.push(`Image "${target}" exceeds the ${MAX_IMAGE_BYTES / 1024 / 1024} MB per-image limit and was skipped.`);
      continue;
    }
    const mediaType = sniffMediaType(raw);
    if (!mediaType) {
      ctx.warnings.push(`Image "${target}" has an unrecognized format and was skipped.`);
      continue;
    }
    const name = target.split('/').pop() || `image${images.length + 1}`;
    images.push({ name, mediaType, bytes: raw });
  }
  ctx.stats.imageCount = images.length;

  // ---- Footnote appendix data ----
  const footnotes: DocxFootnoteData[] = [];
  ctx.footnoteOrder.forEach((id, i) => {
    const text = ctx.footnoteTexts.get(id);
    if (text) footnotes.push({ number: i + 1, text });
  });
  ctx.stats.footnoteCount = footnotes.length;
  if (ctx.footnoteOrder.length > footnotes.length) {
    ctx.warnings.push(
      `${ctx.footnoteOrder.length - footnotes.length} footnote reference(s) had no text and were skipped.`,
    );
  }

  // ---- Honest drop notes ----
  const s = ctx.stats;
  if (s.commentRanges > 0) ctx.warnings.push(`${s.commentRanges} comment(s) were skipped (comments are not imported).`);
  if (s.deletedTextRuns > 0) ctx.warnings.push(`${s.deletedTextRuns} tracked deletion(s) were dropped (showing final text).`);
  if (s.insertedTextRuns > 0) ctx.warnings.push(`${s.insertedTextRuns} tracked insertion(s) were accepted as final text.`);
  if (s.oleObjects > 0) ctx.warnings.push(`${s.oleObjects} embedded object(s) were skipped (OLE is not imported).`);
  if (s.altChunks > 0) ctx.warnings.push(`${s.altChunks} alternative-content chunk(s) were skipped.`);
  if (s.textBoxes > 0) ctx.warnings.push(`${s.textBoxes} text box(es) were skipped (floating text boxes are not imported).`);

  return { blocks, images, footnotes, warnings: ctx.warnings, stats: s };
}

function validateSize(sizeBytes: number, maxBytes: number): void {
  if (sizeBytes > maxBytes) {
    throw new Error(
      `File size (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the ${(maxBytes / (1024 * 1024)).toFixed(2)} MB import limit.`,
    );
  }
}
