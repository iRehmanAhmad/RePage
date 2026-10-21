import JSZip from 'jszip';
import type {
  ImageFrameObject,
  Page,
  RePageDocument,
  TableCell,
  TableObject,
  TextFrameObject,
} from '../domain/document/types';
import type {
  InlineNode,
  ParagraphNode,
  TextAlignment,
  TextMark,
} from '../domain/rich-text/types';
import { BUILTIN_URDU_PARAGRAPH_STYLES } from '../domain/rich-text/styles';
import { PRIMARY_STORY_ID } from '../domain/document/createDocument';

/**
 * DOCX (Office Open XML) exporter: canonical RePageDocument -> .docx package.
 *
 * Pure and viewport-independent (repo rule: export/ never reads the canvas
 * or DOM). The package is assembled with JSZip (already a dependency) and
 * mirrors what `docxParser.ts` accepts on the way in, so export -> import
 * round-trips: paragraphs/stories in reading order, runs with marks, named
 * styles, tables, embedded images, and section page setup.
 *
 * Urdu/RTL correctness: RTL paragraphs carry `w:bidi`; runs containing
 * Arabic-script text carry `w:rtl` + `w:lang w:bidi="ur-PK"` and complex-
 * script font/size/bold (`w:cs`, `w:szCs`, `w:bCs`). Text is copied
 * byte-for-byte — NEVER normalized (joiners, bidi controls, aerab pass
 * through untouched; only XML escaping is applied).
 *
 * Features with no DOCX equivalent (linked-frame chain structure, master
 * pages, headers/footers, shapes) are counted in the export report, never
 * silently mangled.
 */

export interface DocxExportReport {
  paragraphCount: number;
  headingCount: number;
  tableCount: number;
  tableCellCount: number;
  imageCount: number;
  /** Features present in the document that DOCX cannot represent as-is. */
  notes: string[];
  /** Problems hit while exporting (e.g. image bytes unavailable). */
  warnings: string[];
}

export interface DocxExportResult {
  bytes: Uint8Array;
  fileName: string;
  report: DocxExportReport;
}

export interface DocxExportOptions {
  fileName?: string | undefined;
}

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export { DOCX_MIME };

/** A4 in points; used when a document has no pages. */
const FALLBACK_PAGE = { width: 595.28, height: 841.89, margins: { top: 72, right: 72, bottom: 72, left: 72 } };

const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(text: string): string {
  return esc(text).replace(/"/g, '&quot;');
}

/** '#RRGGBB' / 'RRGGBB' -> 'RRGGBB' uppercase, or undefined when not hex. */
function hexColor(color: string | undefined): string | undefined {
  if (!color) return undefined;
  const m = color.trim().match(/^#?([0-9a-fA-F]{6})$/);
  return m ? m[1]!.toUpperCase() : undefined;
}

const ptToTwips = (pt: number): number => Math.round(pt * 20);
const ptToHalfPoints = (pt: number): number => Math.round(pt * 2);
const ptToEmu = (pt: number): number => Math.round(pt * 12700);

// ---------------------------------------------------------------------------
// Style mapping (RePage preset id -> OOXML styleId).
// The importer maps these back: Heading1->heading1, Heading2->heading2,
// Heading3->subheading, Title->headline (see docxParser HEADING_STYLE_IDS).
// ---------------------------------------------------------------------------

const STYLE_ID_TO_DOCX: Record<string, string> = {
  heading1: 'Heading1',
  heading2: 'Heading2',
  subheading: 'Heading3',
  headline: 'Title',
  quote: 'Quote',
  body: 'BodyText',
  poetry: 'Poetry',
  normal: 'Normal',
};

const HEADING_DOCX_STYLES = new Set(['Heading1', 'Heading2', 'Heading3', 'Title']);

/** Named highlight colors the importer understands (hex -> OOXML name). */
const HIGHLIGHT_NAMES: Record<string, string> = {
  FFFF00: 'yellow',
  '00FF00': 'green',
  '00FFFF': 'cyan',
  FF00FF: 'magenta',
  '0000FF': 'blue',
  FF0000: 'red',
  '000080': 'darkBlue',
  '008080': 'darkCyan',
  '008000': 'darkGreen',
  '800080': 'darkMagenta',
  '800000': 'darkRed',
  '808000': 'darkYellow',
  '808080': 'darkGray',
  C0C0C0: 'lightGray',
  '000000': 'black',
};

// ---------------------------------------------------------------------------
// Export context
// ---------------------------------------------------------------------------

interface MediaPart {
  relId: string;
  path: string;
  contentType: string;
  bytes: Uint8Array;
}

interface Ctx {
  report: DocxExportReport;
  media: MediaPart[];
  nextRelId: number;
  nextDrawingId: number;
  emittedStories: Set<string>;
  chainsFlattened: number;
  shapesSkipped: number;
  listParagraphsFlattened: number;
  borderedParagraphs: number;
}

interface FrameDefaults {
  fontFamily?: string | undefined;
  fontSize?: number | undefined;
  color?: string | undefined;
  lineHeight?: number | undefined;
}

function containsArabic(text: string): boolean {
  return ARABIC_SCRIPT.test(text);
}

function paragraphText(node: ParagraphNode): string {
  return node.content.map((n) => (n.type === 'text' ? n.text : '')).join('');
}

function resolveDirection(node: ParagraphNode): 'rtl' | 'ltr' {
  if (node.direction === 'rtl' || node.direction === 'ltr') return node.direction;
  return containsArabic(paragraphText(node)) ? 'rtl' : 'ltr';
}

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

function runPropertiesXml(
  marks: TextMark[],
  defaults: FrameDefaults,
  arabic: boolean,
): string {
  const byType = new Map<string, TextMark>();
  for (const m of marks) if (!byType.has(m.type)) byType.set(m.type, m);

  const familyMark = byType.get('fontFamily') as { family: string } | undefined;
  const sizeMark = byType.get('fontSize') as { size: number } | undefined;
  const colorMark = byType.get('color') as { color: string } | undefined;

  const family = familyMark?.family ?? defaults.fontFamily;
  const size = sizeMark?.size ?? defaults.fontSize;
  const color = hexColor(colorMark?.color) ?? hexColor(defaults.color);

  let out = '';

  // rFonts: complex-script font is what shapes Nastaliq; set all slots to the
  // effective family. Arabic runs without any family fall back to the
  // document's standard Urdu font so Word does not substitute a Latin face.
  const csFamily = family ?? (arabic ? 'Noto Nastaliq Urdu' : undefined);
  if (family || csFamily) {
    const attrs: string[] = [];
    if (family) attrs.push(`w:ascii="${escAttr(family)}"`, `w:hAnsi="${escAttr(family)}"`);
    if (csFamily) attrs.push(`w:cs="${escAttr(csFamily)}"`);
    out += `<w:rFonts ${attrs.join(' ')}/>`;
  }

  if (byType.has('bold')) out += '<w:b/><w:bCs/>';
  if (byType.has('italic')) out += '<w:i/><w:iCs/>';

  const effect = byType.get('textEffect') as { shadow?: boolean } | undefined;
  if (effect?.shadow) out += '<w:shadow/>';

  if (byType.has('strikethrough')) out += '<w:strike/>';

  if (color) out += `<w:color w:val="${color}"/>`;

  const spacing = byType.get('characterSpacing') as { value: number } | undefined;
  if (spacing && Number.isFinite(spacing.value) && spacing.value !== 0) {
    out += `<w:spacing w:val="${Math.round(spacing.value * 20)}"/>`;
  }

  if (size && Number.isFinite(size) && size > 0) {
    const hp = ptToHalfPoints(size);
    out += `<w:sz w:val="${hp}"/><w:szCs w:val="${hp}"/>`;
  }

  const highlight = byType.get('highlight') as { color: string } | undefined;
  let highlightShd: string | undefined;
  if (highlight) {
    const hex = hexColor(highlight.color);
    const name = hex ? HIGHLIGHT_NAMES[hex] : undefined;
    if (name) out += `<w:highlight w:val="${name}"/>`;
    else if (hex) highlightShd = hex;
  }

  const underline = byType.get('underline') as { style?: string; color?: string } | undefined;
  if (underline) {
    const styleMap: Record<string, string> = {
      single: 'single',
      double: 'double',
      thick: 'thick',
      dotted: 'dotted',
      dashed: 'dashed',
      wave: 'wavy',
    };
    const val = styleMap[underline.style ?? 'single'] ?? 'single';
    const uColor = hexColor(underline.color);
    out += `<w:u w:val="${val}"${uColor ? ` w:color="${uColor}"` : ''}/>`;
  }

  if (highlightShd) out += `<w:shd w:val="clear" w:color="auto" w:fill="${highlightShd}"/>`;

  if (byType.has('superscript')) out += '<w:vertAlign w:val="superscript"/>';
  else if (byType.has('subscript')) out += '<w:vertAlign w:val="subscript"/>';

  if (arabic) out += '<w:rtl/><w:lang w:bidi="ur-PK"/>';

  return out ? `<w:rPr>${out}</w:rPr>` : '';
}

function runXml(run: { text: string; marks?: TextMark[] | undefined }, defaults: FrameDefaults): string {
  const arabic = containsArabic(run.text);
  const rPr = runPropertiesXml(run.marks ?? [], defaults, arabic);
  // Split control characters into OOXML equivalents: newline -> break,
  // tab -> tab. Text itself is copied byte-for-byte.
  const parts = run.text.split(/(\n|\t)/);
  let inner = '';
  let buffer = '';
  const flush = () => {
    if (buffer) {
      inner += `<w:t xml:space="preserve">${esc(buffer)}</w:t>`;
      buffer = '';
    }
  };
  for (const part of parts) {
    if (part === '\n') {
      flush();
      inner += '<w:br/>';
    } else if (part === '\t') {
      flush();
      inner += '<w:tab/>';
    } else {
      buffer += part;
    }
  }
  flush();
  if (!inner) return '';
  return `<w:r>${rPr}${inner}</w:r>`;
}

// ---------------------------------------------------------------------------
// Paragraphs
// ---------------------------------------------------------------------------

function jcValue(alignment: TextAlignment | undefined, direction: 'rtl' | 'ltr'): string | undefined {
  switch (alignment) {
    case 'center':
      return 'center';
    case 'justify':
      return 'both';
    case 'left':
      return 'left';
    case 'right':
      return 'right';
    case 'end':
      return direction === 'rtl' ? 'left' : 'right';
    case 'start':
    default:
      return undefined; // default alignment in the paragraph direction
  }
}

function paragraphXml(node: ParagraphNode, defaults: FrameDefaults, ctx: Ctx): string {
  const direction = resolveDirection(node);
  const docxStyle = node.styleId ? STYLE_ID_TO_DOCX[node.styleId] : undefined;

  if (node.type !== 'paragraph') ctx.listParagraphsFlattened += 1;
  if (node.border) ctx.borderedParagraphs += 1;

  let pPr = '';
  if (docxStyle && docxStyle !== 'Normal') pPr += `<w:pStyle w:val="${docxStyle}"/>`;
  if (docxStyle && HEADING_DOCX_STYLES.has(docxStyle)) ctx.report.headingCount += 1;

  const bg = hexColor(node.backgroundColor);
  if (bg) pPr += `<w:shd w:val="clear" w:color="auto" w:fill="${bg}"/>`;

  if (direction === 'rtl') pPr += '<w:bidi/>';

  // Spacing: explicit paragraph spacing wins; line height comes from the
  // paragraph, else the owning frame's default.
  let spacing = '';
  if (node.spaceBefore !== undefined && node.spaceBefore > 0) {
    spacing += ` w:before="${ptToTwips(node.spaceBefore)}"`;
  }
  if (node.spaceAfter !== undefined && node.spaceAfter > 0) {
    spacing += ` w:after="${ptToTwips(node.spaceAfter)}"`;
  }
  const lineHeight = node.lineHeight ?? defaults.lineHeight;
  if (lineHeight && Number.isFinite(lineHeight) && lineHeight > 0) {
    spacing += ` w:line="${Math.round(lineHeight * 240)}" w:lineRule="auto"`;
  }
  if (spacing) pPr += `<w:spacing${spacing}/>`;

  let ind = '';
  if (node.indentLevel && node.indentLevel > 0) {
    const twips = Math.round(node.indentLevel) * 720;
    ind += direction === 'rtl' ? ` w:right="${twips}"` : ` w:left="${twips}"`;
  }
  if (node.firstLineIndent !== undefined && node.firstLineIndent !== 0) {
    ind += ` w:firstLine="${ptToTwips(node.firstLineIndent)}"`;
  }
  if (ind) pPr += `<w:ind${ind}/>`;

  const jc = jcValue(node.alignment, direction);
  if (jc) pPr += `<w:jc w:val="${jc}"/>`;

  let runs = '';
  for (const inline of node.content as InlineNode[]) {
    if (inline.type === 'hardBreak') {
      runs += '<w:r><w:br/></w:r>';
    } else {
      runs += runXml(inline, defaults);
    }
  }

  ctx.report.paragraphCount += 1;
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${runs}</w:p>`;
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

function cellParagraphs(cell: TableCell): ParagraphNode[] {
  const content = cell.content as { type?: string; content?: ParagraphNode[] } | string | undefined;
  if (typeof content === 'string') {
    return [
      {
        type: 'paragraph',
        direction: containsArabic(content) ? 'rtl' : 'ltr',
        alignment: 'start',
        content: content ? [{ type: 'text', text: content }] : [],
      },
    ];
  }
  if (content && content.type === 'doc' && Array.isArray(content.content) && content.content.length > 0) {
    return content.content;
  }
  return [{ type: 'paragraph', direction: 'rtl', alignment: 'start', content: [] }];
}

function tableXml(table: TableObject, ctx: Ctx): string {
  const totalWidthTwips = Math.max(240, ptToTwips(table.frame.width || 468));
  const colCount = Math.max(
    1,
    ...table.rows.map((r) => r.cells.reduce((s, c) => s + (c.colSpan ?? 1), 0)),
  );
  const colWidth = Math.floor(totalWidthTwips / colCount);

  const borderColor = hexColor(table.borderColor) ?? 'auto';
  const borderSz = Math.max(1, Math.round((table.borderWidth ?? 1) * 8));
  const border = (side: string) =>
    `<w:${side} w:val="single" w:sz="${borderSz}" w:space="0" w:color="${borderColor}"/>`;
  let tblPr =
    `<w:tblW w:w="${totalWidthTwips}" w:type="dxa"/>` +
    `<w:tblBorders>${border('top')}${border('left')}${border('bottom')}${border('right')}${border('insideH')}${border('insideV')}</w:tblBorders>` +
    '<w:tblLayout w:type="fixed"/>';
  if (table.cellPadding) {
    const p = table.cellPadding;
    tblPr +=
      '<w:tblCellMar>' +
      `<w:top w:w="${ptToTwips(p.top)}" w:type="dxa"/>` +
      `<w:left w:w="${ptToTwips(p.left)}" w:type="dxa"/>` +
      `<w:bottom w:w="${ptToTwips(p.bottom)}" w:type="dxa"/>` +
      `<w:right w:w="${ptToTwips(p.right)}" w:type="dxa"/>` +
      '</w:tblCellMar>';
  }

  let grid = '';
  for (let i = 0; i < colCount; i++) grid += `<w:gridCol w:w="${colWidth}"/>`;

  // Vertical merges: head cell carries rowSpan; following rows need explicit
  // continuation cells at the merged columns (the importer folds them back).
  const activeMerges = new Map<number, { remaining: number; span: number }>();
  let rowsXml = '';
  for (const row of table.rows) {
    let tr = '';
    let col = 0;
    const flushMerges = () => {
      for (;;) {
        const merge = activeMerges.get(col);
        if (!merge || merge.remaining <= 0) return;
        tr +=
          `<w:tc><w:tcPr><w:tcW w:w="${colWidth * merge.span}" w:type="dxa"/>` +
          (merge.span > 1 ? `<w:gridSpan w:val="${merge.span}"/>` : '') +
          '<w:vMerge/></w:tcPr><w:p/></w:tc>';
        merge.remaining -= 1;
        if (merge.remaining <= 0) activeMerges.delete(col);
        col += merge.span;
        ctx.report.tableCellCount += 1;
      }
    };
    for (const cell of row.cells) {
      flushMerges();
      const span = Math.max(1, cell.colSpan ?? 1);
      let tcPr = `<w:tcW w:w="${colWidth * span}" w:type="dxa"/>`;
      if (span > 1) tcPr += `<w:gridSpan w:val="${span}"/>`;
      if (cell.rowSpan && cell.rowSpan > 1) {
        tcPr += '<w:vMerge w:val="restart"/>';
        activeMerges.set(col, { remaining: cell.rowSpan - 1, span });
      }
      const bg = hexColor(cell.backgroundColor);
      if (bg) tcPr += `<w:shd w:val="clear" w:color="auto" w:fill="${bg}"/>`;
      let paras = '';
      for (const p of cellParagraphs(cell)) paras += paragraphXml(p, {}, ctx);
      tr += `<w:tc><w:tcPr>${tcPr}</w:tcPr>${paras}</w:tc>`;
      col += span;
      ctx.report.tableCellCount += 1;
    }
    flushMerges();
    rowsXml += `<w:tr>${tr}</w:tr>`;
  }

  ctx.report.tableCount += 1;
  return `<w:tbl><w:tblPr>${tblPr}</w:tblPr><w:tblGrid>${grid}</w:tblGrid>${rowsXml}</w:tbl>`;
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

const MEDIA_TYPES: Record<string, { ext: string; contentType: string }> = {
  'image/png': { ext: 'png', contentType: 'image/png' },
  'image/jpeg': { ext: 'jpg', contentType: 'image/jpeg' },
  'image/gif': { ext: 'gif', contentType: 'image/gif' },
  'image/webp': { ext: 'webp', contentType: 'image/webp' },
  'image/bmp': { ext: 'bmp', contentType: 'image/bmp' },
  'image/svg+xml': { ext: 'svg', contentType: 'image/svg+xml' },
};

function decodeDataUrl(dataUrl: string): { mediaType: string; bytes: Uint8Array } | undefined {
  const m = dataUrl.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/);
  if (!m) return undefined;
  const mediaType = m[1]!;
  try {
    if (m[2]) {
      const binary = atob(m[3]!);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return { mediaType, bytes };
    }
    return { mediaType, bytes: new TextEncoder().encode(decodeURIComponent(m[3]!)) };
  } catch {
    return undefined;
  }
}

function imageParagraphXml(obj: ImageFrameObject, doc: RePageDocument, ctx: Ctx): string {
  const asset = obj.assetId ? doc.assets[obj.assetId] : undefined;
  if (!asset) {
    ctx.report.warnings.push(`Image frame "${obj.name}" has no asset and was skipped.`);
    return '';
  }
  const decoded = asset.dataUrl ? decodeDataUrl(asset.dataUrl) : undefined;
  if (!decoded) {
    ctx.report.warnings.push(
      `Image "${asset.originalName}" has no embedded data available and was skipped.`,
    );
    return '';
  }
  const mediaType = decoded.mediaType || asset.mediaType;
  const kind = MEDIA_TYPES[mediaType] ?? { ext: 'png', contentType: 'image/png' };
  if (mediaType === 'image/svg+xml') {
    ctx.report.warnings.push('An SVG image was embedded; older Word versions may not display it.');
  }
  const relId = `rId${ctx.nextRelId++}`;
  const path = `word/media/image${ctx.media.length + 1}.${kind.ext}`;
  ctx.media.push({ relId, path, contentType: kind.contentType, bytes: decoded.bytes });

  const cx = ptToEmu(Math.max(1, obj.frame.width));
  const cy = ptToEmu(Math.max(1, obj.frame.height));
  const id = ctx.nextDrawingId++;
  const name = escAttr(asset.originalName || `image${id}`);
  ctx.report.imageCount += 1;

  return (
    '<w:p><w:r><w:drawing>' +
    `<wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/>` +
    '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
    `<wp:docPr id="${id}" name="${name}"/>` +
    '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
    '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
    '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    `<pic:nvPicPr><pic:cNvPr id="${id}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
    '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
  );
}

// ---------------------------------------------------------------------------
// styles.xml (built from the built-in paragraph style presets)
// ---------------------------------------------------------------------------

function styleDefXml(
  styleId: string,
  name: string,
  presetId: string | undefined,
  extra: { outlineLvl?: number; jc?: string; italic?: boolean } = {},
): string {
  const preset = presetId ? BUILTIN_URDU_PARAGRAPH_STYLES[presetId] : undefined;
  let pPr = '';
  if (extra.jc) pPr += `<w:jc w:val="${extra.jc}"/>`;
  if (preset?.direction === 'rtl') pPr += '<w:bidi/>';
  if (extra.outlineLvl !== undefined) pPr += `<w:outlineLvl w:val="${extra.outlineLvl}"/>`;
  let rPr = '';
  if (preset) {
    rPr += `<w:rFonts w:ascii="${escAttr(preset.fontFamily)}" w:hAnsi="${escAttr(preset.fontFamily)}" w:cs="${escAttr(preset.fontFamily)}"/>`;
    if (styleId.startsWith('Heading') || styleId === 'Title') rPr += '<w:b/><w:bCs/>';
    if (extra.italic) rPr += '<w:i/><w:iCs/>';
    const color = hexColor(preset.color);
    if (color) rPr += `<w:color w:val="${color}"/>`;
    const hp = ptToHalfPoints(preset.fontSize);
    rPr += `<w:sz w:val="${hp}"/><w:szCs w:val="${hp}"/>`;
  }
  const isDefault = styleId === 'Normal' ? ' w:default="1"' : '';
  return (
    `<w:style w:type="paragraph"${isDefault} w:styleId="${styleId}">` +
    `<w:name w:val="${escAttr(name)}"/>` +
    (styleId !== 'Normal' ? '<w:basedOn w:val="Normal"/><w:next w:val="Normal"/>' : '<w:next w:val="Normal"/>') +
    '<w:qFormat/>' +
    (pPr ? `<w:pPr>${pPr}</w:pPr>` : '') +
    (rPr ? `<w:rPr>${rPr}</w:rPr>` : '') +
    '</w:style>'
  );
}

function buildStylesXml(): string {
  const normal = BUILTIN_URDU_PARAGRAPH_STYLES.normal!;
  const styles =
    '<w:docDefaults><w:rPrDefault><w:rPr>' +
    `<w:rFonts w:ascii="${escAttr(normal.fontFamily)}" w:hAnsi="${escAttr(normal.fontFamily)}" w:cs="${escAttr(normal.fontFamily)}"/>` +
    `<w:sz w:val="${ptToHalfPoints(normal.fontSize)}"/><w:szCs w:val="${ptToHalfPoints(normal.fontSize)}"/>` +
    '<w:lang w:val="en-US" w:bidi="ur-PK"/>' +
    '</w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
    styleDefXml('Normal', 'Normal', 'normal') +
    styleDefXml('Heading1', 'heading 1', 'heading1', { outlineLvl: 0 }) +
    styleDefXml('Heading2', 'heading 2', 'heading2', { outlineLvl: 1 }) +
    styleDefXml('Heading3', 'heading 3', 'subheading', { outlineLvl: 2 }) +
    styleDefXml('Title', 'Title', 'headline', { jc: 'center' }) +
    styleDefXml('Quote', 'Quote', 'quote', { italic: true }) +
    styleDefXml('BodyText', 'Body Text', 'body') +
    styleDefXml('Poetry', 'Poetry', 'poetry', { jc: 'center' });

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    styles +
    '</w:styles>'
  );
}

// ---------------------------------------------------------------------------
// Section properties
// ---------------------------------------------------------------------------

function sectionPrXml(doc: RePageDocument, ctx: Ctx): string {
  const firstPageId = doc.pageOrder[0];
  const page: Page | undefined = firstPageId ? doc.pages[firstPageId] : undefined;
  const width = page?.width ?? FALLBACK_PAGE.width;
  const height = page?.height ?? FALLBACK_PAGE.height;
  const margins = page?.margins ?? FALLBACK_PAGE.margins;

  // Honest note when later pages disagree with the exported section setup.
  let differs = false;
  for (const pid of doc.pageOrder.slice(1)) {
    const p = doc.pages[pid];
    if (!p) continue;
    if (p.width !== width || p.height !== height) differs = true;
    if (
      p.margins.top !== margins.top ||
      p.margins.right !== margins.right ||
      p.margins.bottom !== margins.bottom ||
      p.margins.left !== margins.left
    ) {
      differs = true;
    }
  }
  if (differs) {
    ctx.report.notes.push(
      "Pages with different sizes or margins were exported with the first page's section settings (per-page DOCX sections are not generated).",
    );
  }

  const section = doc.sections?.find((s) => s.startPageId === firstPageId) ?? doc.sections?.[0];
  const cols = section && section.columns > 1 ? `<w:cols w:space="720" w:num="${section.columns}"/>` : '';

  return (
    '<w:sectPr>' +
    `<w:pgSz w:w="${ptToTwips(width)}" w:h="${ptToTwips(height)}"${width > height ? ' w:orient="landscape"' : ''}/>` +
    `<w:pgMar w:top="${ptToTwips(margins.top)}" w:right="${ptToTwips(margins.right)}" w:bottom="${ptToTwips(margins.bottom)}" w:left="${ptToTwips(margins.left)}" w:header="720" w:footer="720" w:gutter="0"/>` +
    cols +
    '<w:docGrid w:linePitch="360"/>' +
    '</w:sectPr>'
  );
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/** Default output file name derived from the document title, sanitized. */
export function getDefaultDocxFileName(doc: RePageDocument): string {
  const raw = (doc.metadata.title || '').trim();
  const sanitized = raw.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  const base = sanitized.length > 0 ? sanitized : 'RePage_Document';
  return `${base.slice(0, 120)}.docx`;
}

export async function exportDocumentToDocx(
  doc: RePageDocument,
  options: DocxExportOptions = {},
): Promise<DocxExportResult> {
  const ctx: Ctx = {
    report: { paragraphCount: 0, headingCount: 0, tableCount: 0, tableCellCount: 0, imageCount: 0, notes: [], warnings: [] },
    media: [],
    nextRelId: 2, // rId1 is reserved for styles.xml
    nextDrawingId: 1,
    emittedStories: new Set(),
    chainsFlattened: 0,
    shapesSkipped: 0,
    listParagraphsFlattened: 0,
    borderedParagraphs: 0,
  };

  const bodyParts: string[] = [];

  const emitStory = (storyId: string, defaults: FrameDefaults) => {
    if (ctx.emittedStories.has(storyId)) return;
    const story = doc.stories[storyId];
    if (!story) return;
    ctx.emittedStories.add(storyId);
    for (const node of story.content.content) {
      bodyParts.push(paragraphXml(node, defaults, ctx));
    }
  };

  // 1. The primary body story leads (it is the document body in the app;
  //    frame-placed stories follow in page order).
  if (doc.stories[PRIMARY_STORY_ID]) {
    emitStory(PRIMARY_STORY_ID, {});
  }

  // Header/footer stories are referenced from sections, not pages.
  const headerFooterStoryIds = new Set<string>();
  for (const s of doc.sections ?? []) {
    if (s.headerStoryId) headerFooterStoryIds.add(s.headerStoryId);
    if (s.footerStoryId) headerFooterStoryIds.add(s.footerStoryId);
  }

  // 2. Pages in order, objects in page order.
  for (const pageId of doc.pageOrder) {
    const page = doc.pages[pageId];
    if (!page) continue;
    for (const objId of page.objectOrder) {
      const obj = doc.objects[objId];
      if (!obj || obj.hidden) continue;
      switch (obj.type) {
        case 'text-frame': {
          const frame = obj as TextFrameObject;
          const isChainLink = !!(frame.nextFrameId || frame.previousFrameId);
          if (isChainLink && !ctx.emittedStories.has(frame.storyId) && frame.previousFrameId) {
            // Mid-chain frame reached before its head: the head emits it.
            break;
          }
          if (isChainLink && !frame.previousFrameId && !ctx.emittedStories.has(frame.storyId)) {
            ctx.chainsFlattened += 1;
          }
          emitStory(frame.storyId, {
            fontFamily: frame.fontFamily,
            fontSize: frame.fontSize,
            color: frame.color,
            lineHeight: frame.lineHeight,
          });
          break;
        }
        case 'table':
          bodyParts.push(tableXml(obj as TableObject, ctx));
          break;
        case 'image-frame': {
          const xml = imageParagraphXml(obj as ImageFrameObject, doc, ctx);
          if (xml) bodyParts.push(xml);
          break;
        }
        case 'rectangle': {
          ctx.shapesSkipped += 1;
          if (obj.storyId) emitStory(obj.storyId, {});
          break;
        }
        default:
          break;
      }
    }
  }

  // 3. Header/footer + unplaced stories: counted, never silently dropped.
  let headerFooterCount = 0;
  for (const id of headerFooterStoryIds) {
    if (doc.stories[id] && !ctx.emittedStories.has(id)) headerFooterCount += 1;
  }
  if (headerFooterCount > 0) {
    ctx.report.notes.push(
      `${headerFooterCount} header/footer stor${headerFooterCount === 1 ? 'y was' : 'ies were'} not exported (DOCX headers/footers are not generated).`,
    );
  }
  let unplaced = 0;
  for (const id of Object.keys(doc.stories)) {
    if (!ctx.emittedStories.has(id) && !headerFooterStoryIds.has(id)) unplaced += 1;
  }
  if (unplaced > 0) {
    ctx.report.notes.push(
      `${unplaced} stor${unplaced === 1 ? 'y is' : 'ies are'} not placed on any page and ${unplaced === 1 ? 'was' : 'were'} not exported.`,
    );
  }
  if (ctx.chainsFlattened > 0) {
    ctx.report.notes.push(
      `${ctx.chainsFlattened} linked text-frame chain(s) exported as continuous text (frame chain structure has no DOCX equivalent).`,
    );
  }
  if (ctx.shapesSkipped > 0) {
    ctx.report.notes.push(
      `${ctx.shapesSkipped} shape object(s) skipped (shapes have no DOCX equivalent); any text they carried was exported as body text.`,
    );
  }
  if (ctx.listParagraphsFlattened > 0) {
    ctx.report.notes.push(
      `${ctx.listParagraphsFlattened} list paragraph(s) exported as plain paragraphs (list numbering is not generated).`,
    );
  }
  if (ctx.borderedParagraphs > 0) {
    ctx.report.notes.push(
      `${ctx.borderedParagraphs} paragraph border(s) not exported (paragraph borders are not generated).`,
    );
  }
  if (doc.masterPages && Object.keys(doc.masterPages).length > 0) {
    ctx.report.notes.push('Master-page decorations were not exported (DOCX has no master pages).');
  }
  if (doc.footnotes && Object.keys(doc.footnotes).length > 0) {
    ctx.report.notes.push(
      `${Object.keys(doc.footnotes).length} footnote(s) not exported (DOCX footnotes are not generated).`,
    );
  }

  const sectPr = sectionPrXml(doc, ctx);
  if (bodyParts.length === 0) bodyParts.push('<w:p/>');

  const documentXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    `<w:body>${bodyParts.join('')}${sectPr}</w:body></w:document>`;

  // ---- Package assembly ----
  const exts = new Set(ctx.media.map((m) => m.path.split('.').pop()!));
  const contentTypeForExt = (ext: string): string =>
    Object.values(MEDIA_TYPES).find((v) => v.ext === ext)?.contentType ?? 'image/png';
  let contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>';
  for (const ext of exts) {
    contentTypes += `<Default Extension="${ext}" ContentType="${contentTypeForExt(ext)}"/>`;
  }
  contentTypes +=
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
    '</Types>';

  const rootRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
    '</Relationships>';

  let docRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';
  for (const m of ctx.media) {
    docRels += `<Relationship Id="${m.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.path.split('/').pop()}"/>`;
  }
  docRels += '</Relationships>';

  const coreXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
    'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    `<dc:title>${esc(doc.metadata.title || '')}</dc:title>` +
    '<dc:creator>RePage</dc:creator><cp:lastModifiedBy>RePage</cp:lastModifiedBy>' +
    `<dcterms:created xsi:type="dcterms:W3CDTF">${esc(doc.metadata.createdAt || new Date().toISOString())}</dcterms:created>` +
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${esc(doc.metadata.modifiedAt || new Date().toISOString())}</dcterms:modified>` +
    '</cp:coreProperties>';

  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rootRels);
  zip.file('docProps/core.xml', coreXml);
  zip.file('word/document.xml', documentXml);
  zip.file('word/styles.xml', buildStylesXml());
  zip.file('word/_rels/document.xml.rels', docRels);
  for (const m of ctx.media) zip.file(m.path, m.bytes);

  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });

  return {
    bytes,
    fileName: options.fileName ?? getDefaultDocxFileName(doc),
    report: ctx.report,
  };
}
