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
import { sanitizeHtmlMarkup } from './sanitizer';
import { detectTextDirection } from './textImporter';
import {
  assembleImportedDocument,
  cleanImportTitle,
  countStoryWords,
  imageMarkerParagraph,
  type AssemblyBlock,
  type DocumentImportResult,
  type ImportedImageData,
} from './storyAssembler';

/**
 * HTML importer.
 *
 * Markup is sanitized first (scripts, styles, event handlers and executable
 * URLs are stripped by `sanitizeHtmlMarkup`), then walked with a recursive
 * DOM traversal — the document model only ever receives text runs and marks,
 * so no markup of any kind can leak into canonical content.
 *
 * Supported: p / h1–h6 (style presets) / ul / ol (literal markers, like the
 * DOCX importer) / blockquote (quote preset) / strong / em / u / s / sub /
 * sup / inline font size, color and family / alignment and dir attributes.
 * Tables lose their structure (counted + reported; cell text is kept as
 * paragraphs). Only `data:` URI images are imported (decoded and placed on
 * dedicated image pages, like DOCX); external images are counted + reported.
 */

export interface HtmlParseStats {
  headingCount: number;
  listItemCount: number;
  /** Images successfully decoded from data: URIs. */
  imageCount: number;
  /** Images not imported (external src, unsupported encoding, over limits). */
  droppedImageCount: number;
  tableCount: number;
}

export interface HtmlParseResult {
  blocks: AssemblyBlock[];
  stats: HtmlParseStats;
  warnings: string[];
}

const MAX_IMPORTED_IMAGES = 100;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

const HEADING_STYLE_IDS: Record<string, string> = {
  H1: 'heading1',
  H2: 'heading2',
  H3: 'subheading',
  H4: 'subheading',
  H5: 'subheading',
  H6: 'subheading',
};

const BLOCK_CONTAINERS = new Set([
  'DIV',
  'SECTION',
  'ARTICLE',
  'MAIN',
  'HEADER',
  'FOOTER',
  'NAV',
  'ASIDE',
  'FIGURE',
  'FIGCAPTION',
  'FIELDSET',
  'ADDRESS',
  'DETAILS',
  'SUMMARY',
]);

const SKIP_ELEMENTS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'SVG',
  'HEAD',
  'TITLE',
  'META',
  'LINK',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'BUTTON',
]);

interface ParaMeta {
  alignment?: TextAlignment | undefined;
  direction?: TextDirection | undefined;
  styleId?: string | undefined;
  indentLevel?: number | undefined;
}

interface WalkCtx {
  marks: TextMark[];
  listDepth: number;
  quote: boolean;
}

function alignmentFromValue(raw: string | null | undefined): TextAlignment | undefined {
  switch ((raw ?? '').trim().toLowerCase()) {
    case 'left':
      return 'left';
    case 'right':
      return 'right';
    case 'center':
      return 'center';
    case 'justify':
      return 'justify';
    case 'start':
      return 'start';
    case 'end':
      return 'end';
    default:
      return undefined;
  }
}

function blockMeta(el: Element): ParaMeta {
  const meta: ParaMeta = {};
  const dir = el.getAttribute('dir');
  if (dir === 'rtl' || dir === 'ltr') meta.direction = dir;
  const align =
    alignmentFromValue((el as HTMLElement).style?.textAlign) ??
    alignmentFromValue(el.getAttribute('align'));
  if (align) meta.alignment = align;
  return meta;
}

function marksForElement(el: Element, base: TextMark[]): TextMark[] {
  const marks = [...base];
  const tag = el.tagName;
  const add = (mark: TextMark) => {
    if (!marks.some((m) => m.type === mark.type)) marks.push(mark);
  };

  if (tag === 'B' || tag === 'STRONG') add({ type: 'bold' });
  if (tag === 'I' || tag === 'EM') add({ type: 'italic' });
  if (tag === 'U') add({ type: 'underline' });
  if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') add({ type: 'strikethrough' });
  if (tag === 'SUB') add({ type: 'subscript' });
  if (tag === 'SUP') add({ type: 'superscript' });
  if (tag === 'MARK') add({ type: 'highlight', color: '#ffff00' });

  const style = (el as HTMLElement).style;
  if (style) {
    const weight = style.fontWeight;
    if (weight === 'bold' || weight === 'bolder' || (weight !== '' && parseInt(weight, 10) >= 600)) {
      add({ type: 'bold' });
    }
    if (style.fontStyle === 'italic' || style.fontStyle === 'oblique') {
      add({ type: 'italic' });
    }
    const decoration = `${style.textDecorationLine ?? ''} ${style.textDecoration ?? ''}`;
    if (decoration.includes('underline')) add({ type: 'underline' });
    if (decoration.includes('line-through')) add({ type: 'strikethrough' });
    if (style.fontSize) {
      const size = parseFloat(style.fontSize);
      if (!Number.isNaN(size) && size > 0) add({ type: 'fontSize', size });
    }
    if (style.color) add({ type: 'color', color: style.color });
    if (style.fontFamily) {
      add({ type: 'fontFamily', family: style.fontFamily.replace(/['"]/g, '') });
    }
  }

  if (tag === 'FONT') {
    const color = el.getAttribute('color');
    if (color) add({ type: 'color', color });
    const face = el.getAttribute('face');
    if (face) add({ type: 'fontFamily', family: face });
    const sizeAttr = el.getAttribute('size');
    if (sizeAttr) {
      const legacy = parseInt(sizeAttr, 10);
      const pt = [8, 10, 12, 14, 18, 24, 36][Math.min(7, Math.max(1, legacy)) - 1];
      if (pt) add({ type: 'fontSize', size: pt });
    }
  }

  return marks;
}

function marksEqual(a: TextMark[] | undefined, b: TextMark[] | undefined): boolean {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
}

function decodeDataUriImage(src: string): ImportedImageData | null {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(src.trim());
  if (!match) return null;
  const mediaType = (match[1] ?? '').toLowerCase();
  if (!mediaType.startsWith('image/') || !match[2]) return null;
  let bytes: Uint8Array;
  try {
    const binary = atob(match[3]!.replace(/\s+/g, ''));
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
  } catch {
    return null;
  }
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;
  return { name: '', mediaType, bytes };
}

function imageName(img: ImportedImageData, el: Element, index: number): string {
  const ext =
    img.mediaType === 'image/jpeg'
      ? 'jpg'
      : img.mediaType === 'image/svg+xml'
        ? 'svg'
        : (img.mediaType.split('/')[1] ?? 'png');
  const alt = (el.getAttribute('alt') ?? '').replace(/[\\/:*?"<>|]/g, '').trim();
  const base = alt.length > 0 ? alt.slice(0, 60) : `image-${index}`;
  return /\.[a-z0-9]+$/i.test(base) ? base : `${base}.${ext}`;
}

export function parseHtmlBlocks(
  htmlContent: string,
  options: ImportOptions = {},
): HtmlParseResult {
  const stats: HtmlParseStats = {
    headingCount: 0,
    listItemCount: 0,
    imageCount: 0,
    droppedImageCount: 0,
    tableCount: 0,
  };
  const warnings: string[] = [];
  const blocks: AssemblyBlock[] = [];

  const sanitizedHtml = sanitizeHtmlMarkup(htmlContent);
  const defaultDir = options.defaultDirection ?? 'rtl';

  if (typeof DOMParser === 'undefined') {
    // Non-DOM fallback: strip tags, one paragraph per non-empty line.
    const textOnly = sanitizedHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    for (const line of textOnly.split('\n')) {
      const text = line.trim();
      if (!text) continue;
      blocks.push({
        kind: 'paragraph',
        node: {
          type: 'paragraph',
          direction: detectTextDirection(text, defaultDir),
          alignment: 'start',
          content: [{ type: 'text', text }],
        },
      });
    }
    return { blocks, stats, warnings };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedHtml, 'text/html');
  const body = doc.body;
  if (!body) return { blocks, stats, warnings };

  // ---- paragraph buffer ----
  let buffer: InlineNode[] = [];

  function bufferText(): string {
    return buffer.map((n) => (n.type === 'text' ? n.text : '')).join('');
  }

  function appendText(raw: string, ctx: WalkCtx) {
    const text = raw.replace(/[ \t\r\n\f]+/g, ' ');
    if (!text) return;
    const marks = ctx.marks.length > 0 ? [...ctx.marks] : undefined;
    const last = buffer[buffer.length - 1];
    if (last && last.type === 'text' && marksEqual(last.marks, marks)) {
      last.text += text;
    } else {
      buffer.push({ type: 'text', text, marks });
    }
  }

  function flushParagraph(meta: ParaMeta = {}) {
    // Trim collapsed-space edges (rendering semantics, not text normalization:
    // only ASCII spaces produced by whitespace collapsing are affected).
    const first = buffer[0];
    if (first && first.type === 'text') {
      first.text = first.text.replace(/^ +/, '');
      if (first.text === '') buffer.shift();
    }
    const last = buffer[buffer.length - 1];
    if (last && last.type === 'text') {
      last.text = last.text.replace(/ +$/, '');
      if (last.text === '') buffer.pop();
    }
    const hasContent = buffer.some(
      (n) => n.type === 'hardBreak' || (n.type === 'text' && n.text.length > 0),
    );
    if (!hasContent) {
      buffer = [];
      return;
    }
    const text = bufferText();
    blocks.push({
      kind: 'paragraph',
      node: {
        type: 'paragraph',
        direction: meta.direction ?? detectTextDirection(text, defaultDir),
        alignment: meta.alignment ?? 'start',
        ...(meta.styleId ? { styleId: meta.styleId } : {}),
        ...(meta.indentLevel ? { indentLevel: meta.indentLevel } : {}),
        content: buffer,
      },
    });
    buffer = [];
  }

  function processImage(el: Element) {
    flushParagraph();
    const src = el.getAttribute('src') ?? '';
    const decoded = src.startsWith('data:') ? decodeDataUriImage(src) : null;
    if (decoded && stats.imageCount < MAX_IMPORTED_IMAGES) {
      decoded.name = imageName(decoded, el, stats.imageCount + 1);
      stats.imageCount++;
      blocks.push({ kind: 'image', image: decoded });
    } else {
      stats.droppedImageCount++;
    }
  }

  function processTable(tableEl: Element) {
    flushParagraph();
    stats.tableCount++;
    // Structure is dropped (counted + reported); cell text survives as one
    // paragraph per row. Nested tables' rows are included in the outer walk —
    // acceptable for a text-preserving fallback.
    tableEl.querySelectorAll('tr').forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll('td, th').forEach((cell) => {
        const text = (cell.textContent ?? '').replace(/[ \t\r\n\f]+/g, ' ').trim();
        if (text) cells.push(text);
      });
      if (cells.length > 0) {
        const text = cells.join(' | ');
        blocks.push({
          kind: 'paragraph',
          node: {
            type: 'paragraph',
            direction: detectTextDirection(text, defaultDir),
            alignment: 'start',
            content: [{ type: 'text', text }],
          },
        });
      }
    });
  }

  /**
   * Inline-mode traversal used inside list items: block children are
   * flattened into the item paragraph (their text joins with a separating
   * space) so the item marker never ends up orphaned in its own paragraph.
   * Nested lists are handled by the caller.
   */
  function processInlineNode(node: Node, ctx: WalkCtx) {
    if (node.nodeType === 3) {
      appendText(node.textContent ?? '', ctx);
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.tagName;
    if (SKIP_ELEMENTS.has(tag)) return;
    if (tag === 'BR') {
      buffer.push({ type: 'hardBreak' });
      return;
    }
    if (tag === 'IMG') {
      processImage(el);
      return;
    }
    const isBlock =
      BLOCK_CONTAINERS.has(tag) || tag === 'P' || tag === 'BLOCKQUOTE' || /^H[1-6]$/.test(tag);
    const existing = bufferText();
    if (isBlock && existing.trim().length > 0 && !existing.endsWith(' ')) {
      appendText(' ', ctx);
    }
    const inlineCtx: WalkCtx = { ...ctx, marks: marksForElement(el, ctx.marks) };
    el.childNodes.forEach((child) => processInlineNode(child, inlineCtx));
  }

  function processListItem(li: Element, marker: string, ctx: WalkCtx) {
    flushParagraph();
    buffer.push({ type: 'text', text: marker });
    li.childNodes.forEach((child) => {
      if (
        child.nodeType === 1 &&
        ((child as Element).tagName === 'UL' || (child as Element).tagName === 'OL')
      ) {
        flushParagraph({ indentLevel: ctx.listDepth });
        processList(child as Element, { ...ctx, listDepth: ctx.listDepth + 1 });
      } else {
        processInlineNode(child, ctx);
      }
    });
    flushParagraph({ indentLevel: ctx.listDepth });
  }

  function processList(listEl: Element, ctx: WalkCtx) {
    flushParagraph();
    const ordered = listEl.tagName === 'OL';
    let counter = ordered ? parseInt(listEl.getAttribute('start') ?? '1', 10) || 1 : 1;
    listEl.childNodes.forEach((child) => {
      if (child.nodeType !== 1) return;
      const el = child as Element;
      if (el.tagName === 'LI') {
        stats.listItemCount++;
        const marker = ordered ? `${counter++}. ` : '• ';
        processListItem(el, marker, ctx);
      } else if (el.tagName === 'UL' || el.tagName === 'OL') {
        processList(el, { ...ctx, listDepth: ctx.listDepth + 1 });
      } else {
        processElement(el, ctx);
      }
    });
    flushParagraph();
  }

  function processElement(el: Element, ctx: WalkCtx) {
    const tag = el.tagName;
    if (SKIP_ELEMENTS.has(tag)) return;

    if (tag === 'BR') {
      buffer.push({ type: 'hardBreak' });
      return;
    }
    if (tag === 'IMG') {
      processImage(el);
      return;
    }
    if (tag === 'HR') {
      flushParagraph();
      return;
    }
    if (tag === 'TABLE') {
      processTable(el);
      return;
    }
    if (tag === 'UL' || tag === 'OL') {
      processList(el, ctx);
      return;
    }
    if (tag === 'PRE') {
      flushParagraph();
      const text = el.textContent ?? '';
      if (text.trim()) {
        blocks.push({
          kind: 'paragraph',
          node: {
            type: 'paragraph',
            direction: detectTextDirection(text, defaultDir),
            alignment: 'start',
            content: [{ type: 'text', text }],
          },
        });
      }
      return;
    }
    if (tag === 'P' || /^H[1-6]$/.test(tag) || tag === 'LI') {
      flushParagraph();
      const meta = blockMeta(el);
      if (tag !== 'P' && tag !== 'LI') {
        meta.styleId = HEADING_STYLE_IDS[tag];
        stats.headingCount++;
      } else if (ctx.quote) {
        meta.styleId = 'quote';
      }
      el.childNodes.forEach((child) => processNode(child, ctx));
      flushParagraph(meta);
      return;
    }
    if (tag === 'BLOCKQUOTE') {
      flushParagraph();
      const quoteCtx: WalkCtx = { ...ctx, quote: true };
      el.childNodes.forEach((child) => processNode(child, quoteCtx));
      // Leftover inline content directly inside the blockquote.
      flushParagraph({ ...blockMeta(el), styleId: 'quote' });
      return;
    }
    if (BLOCK_CONTAINERS.has(tag)) {
      flushParagraph();
      el.childNodes.forEach((child) => processNode(child, ctx));
      flushParagraph();
      return;
    }
    // Inline element: extend marks and walk children.
    const inlineCtx: WalkCtx = { ...ctx, marks: marksForElement(el, ctx.marks) };
    el.childNodes.forEach((child) => processNode(child, inlineCtx));
  }

  function processNode(node: Node, ctx: WalkCtx) {
    if (node.nodeType === 3) {
      appendText(node.textContent ?? '', ctx);
    } else if (node.nodeType === 1) {
      processElement(node as Element, ctx);
    }
    // Comments and other node types carry no document content.
  }

  const rootCtx: WalkCtx = { marks: [], listDepth: 0, quote: false };
  body.childNodes.forEach((child) => processNode(child, rootCtx));
  flushParagraph();

  return { blocks, stats, warnings };
}

// ---------------------------------------------------------------------------
// Story-level importer (legacy contract, kept for existing callers)
// ---------------------------------------------------------------------------

export function importHtml(
  htmlContent: string,
  options: ImportOptions = {},
): ImportTextResult {
  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  validateResourceLimits(new Blob([htmlContent]).size, limits);

  const { blocks, warnings } = parseHtmlBlocks(htmlContent, options);

  const paragraphs: ParagraphNode[] = blocks.map((block) =>
    block.kind === 'paragraph' ? block.node : imageMarkerParagraph(block.image.name),
  );

  const finalParagraphs =
    paragraphs.length > 0 ? paragraphs : [paragraph('', options.defaultDirection ?? 'rtl')];

  if (finalParagraphs.length > limits.maxParagraphCount) {
    throw new Error(
      `Paragraph count (${finalParagraphs.length}) exceeds resource limit of ${limits.maxParagraphCount}`,
    );
  }

  const story: RichTextDocument = {
    type: 'doc',
    content: finalParagraphs,
  };

  const fullText = finalParagraphs
    .map((p) => p.content.map((c: InlineNode) => (c.type === 'text' ? c.text : '')).join(''))
    .join(' ');
  const words = fullText.trim().split(/\s+/).filter(Boolean);

  return {
    type: 'story',
    story,
    paragraphCount: story.content.length,
    wordCount: words.length,
    detectedFormat: 'html',
    warnings,
  };
}

// ---------------------------------------------------------------------------
// End-to-end document importer
// ---------------------------------------------------------------------------

/**
 * End-to-end HTML import: markup -> validated canonical RePageDocument plus
 * an honest import report (same contract as `importDocxFile`). Input is
 * sanitized before parsing and only text runs/marks reach the document
 * model — scripts, styles and event handlers cannot leak through.
 */
export async function importHtmlFile(
  data: string | ArrayBuffer | Uint8Array,
  filename = 'document.html',
  options: ImportOptions = {},
): Promise<DocumentImportResult> {
  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };

  let htmlContent: string;
  if (typeof data === 'string') {
    htmlContent = data;
  } else {
    htmlContent = new TextDecoder('utf-8').decode(data);
  }
  validateResourceLimits(new Blob([htmlContent]).size, limits);

  const { blocks, stats, warnings } = parseHtmlBlocks(htmlContent, options);

  const paragraphCount = blocks.filter((b) => b.kind === 'paragraph').length;
  if (paragraphCount > limits.maxParagraphCount) {
    throw new Error(
      `Paragraph count (${paragraphCount}) exceeds resource limit of ${limits.maxParagraphCount}`,
    );
  }

  const dropped: string[] = [];
  if (stats.tableCount > 0) {
    dropped.push(
      `${stats.tableCount} table(s): structure dropped, cell text kept as paragraphs`,
    );
  }
  if (stats.droppedImageCount > 0) {
    dropped.push(
      `${stats.droppedImageCount} image(s) skipped (only embedded data: images are imported)`,
    );
  }
  if (stats.imageCount > 0) {
    dropped.push(
      `${stats.imageCount} image(s) placed on dedicated image pages (inline anchoring approximate)`,
    );
  }

  const storyParagraphs = blocks
    .filter((b): b is { kind: 'paragraph'; node: ParagraphNode } => b.kind === 'paragraph')
    .map((b) => b.node);

  const { document } = await assembleImportedDocument({
    title: cleanImportTitle(filename, 'Imported HTML document'),
    storyName: 'Imported HTML content',
    blocks,
    fallbackParagraph: paragraph('', options.defaultDirection ?? 'rtl'),
  });

  return {
    document,
    report: {
      filename,
      paragraphCount,
      wordCount: countStoryWords(storyParagraphs),
      headingCount: stats.headingCount,
      listItemCount: stats.listItemCount,
      tableCount: stats.tableCount,
      imageCount: stats.imageCount,
      footnoteCount: 0,
      pageCount: document.pageOrder.length,
      dropped,
      warnings,
    },
  };
}
