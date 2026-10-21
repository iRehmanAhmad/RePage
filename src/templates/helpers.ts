/**
 * Shared builder primitives for the Pakistani template gallery.
 *
 * Every helper works in typographic points (the canonical unit of the
 * document model). Templates express layout in millimetres/inches and
 * convert with `mm()` / `inch()`. Nothing here touches the viewport —
 * these are pure document builders, so output stays viewport-independent
 * per the architecture boundaries.
 */
import { createId } from '../domain/document/ids';
import { createDefaultSection } from '../domain/layout/sectionEngine';
import { inchesToPoints, millimetresToPoints } from '../domain/geometry/units';
import type {
  ObjectId,
  Page,
  PageId,
  RePageDocument,
  RectangleObject,
  StoryId,
  TableCell,
  TableObject,
  TableRow,
  TextFrameObject,
} from '../domain/document/types';
import type {
  ParagraphNode,
  TextAlignment,
  TextDirection,
  TextMark,
  TextRun,
} from '../domain/rich-text/types';

export const mm = (n: number): number => millimetresToPoints(n);
export const inch = (n: number): number => inchesToPoints(n);

/** Preflight-safe fonts (registered, OFL-licensed). */
export const FONT_NASTALEEQ = 'Noto Nastaliq Urdu';
export const FONT_DECORATIVE = 'Gulzar';

export interface PageSpec {
  widthPt: number;
  heightPt: number;
  marginPt: number;
}

export const A4_SPEC: PageSpec = { widthPt: mm(210), heightPt: mm(297), marginPt: mm(15) };
export const A4_LANDSCAPE_SPEC: PageSpec = { widthPt: mm(297), heightPt: mm(210), marginPt: mm(12) };
export const A5_SPEC: PageSpec = { widthPt: mm(148), heightPt: mm(210), marginPt: mm(12) };
export const CARD_5X7_SPEC: PageSpec = { widthPt: inch(5), heightPt: inch(7), marginPt: mm(10) };

export interface FrameRectMm {
  x: number;
  y: number;
  w: number;
  h: number;
}

function zeroInsets() {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

/** Creates a fresh single-page document for a template. */
export function newTemplateDocument(title: string, spec: PageSpec): RePageDocument {
  const now = new Date().toISOString();
  const pageId = createId('page');
  const page: Page = {
    id: pageId,
    name: 'صفحہ ۱',
    width: spec.widthPt,
    height: spec.heightPt,
    margins: {
      top: spec.marginPt,
      right: spec.marginPt,
      bottom: spec.marginPt,
      left: spec.marginPt,
    },
    bleed: zeroInsets(),
    background: '#ffffff',
    objectOrder: [],
  };
  return {
    schemaVersion: 1,
    id: createId('doc'),
    metadata: { title, createdAt: now, modifiedAt: now, locale: 'ur-PK' },
    settings: { measurementUnit: 'mm' },
    pageOrder: [pageId],
    pages: { [pageId]: page },
    objects: {},
    stories: {},
    styles: {},
    assets: {},
    sections: [createDefaultSection(pageId)],
  };
}

/** The single page id of a single-page template document. */
export function templatePageId(doc: RePageDocument): PageId {
  const id = doc.pageOrder[0];
  if (!id || !doc.pages[id]) throw new Error('Template document has no pages.');
  return id;
}

export interface ParaOptions {
  align?: TextAlignment | undefined;
  direction?: TextDirection | undefined;
  size?: number | undefined;
  bold?: boolean | undefined;
  color?: string | undefined;
  spaceAfter?: number | undefined;
  spaceBefore?: number | undefined;
  lineHeight?: number | undefined;
  fontFamily?: string | undefined;
}

/** Builds one paragraph with optional run-level formatting. */
export function para(text: string, opts: ParaOptions = {}): ParagraphNode {
  const marks: TextMark[] = [];
  if (opts.bold) marks.push({ type: 'bold' });
  if (opts.size !== undefined) marks.push({ type: 'fontSize', size: opts.size });
  if (opts.fontFamily) marks.push({ type: 'fontFamily', family: opts.fontFamily });
  if (opts.color) marks.push({ type: 'color', color: opts.color });
  const run: TextRun = { type: 'text', text };
  if (marks.length > 0) run.marks = marks;
  return {
    type: 'paragraph',
    direction: opts.direction ?? 'rtl',
    alignment: opts.align ?? 'start',
    lineHeight: opts.lineHeight,
    spaceBefore: opts.spaceBefore,
    spaceAfter: opts.spaceAfter,
    content: text ? [run] : [],
  };
}

/** An empty paragraph that renders as a ruled (underlined) answer line. */
export function ruledLine(spaceAfter = 10): ParagraphNode {
  return {
    type: 'paragraph',
    direction: 'rtl',
    alignment: 'start',
    spaceAfter,
    border: { side: 'bottom', color: '#94a3b8', width: 1, style: 'solid' },
    content: [],
  };
}

export interface TextFrameOptions {
  fontSize?: number | undefined;
  fontFamily?: string | undefined;
  color?: string | undefined;
  lineHeight?: number | undefined;
  columns?: number | undefined;
  columnGapMm?: number | undefined;
  paddingMm?: number | undefined;
  name?: string | undefined;
}

/**
 * Adds a story + text frame to the page. Returns the frame id.
 * Frame rect is given in millimetres from the page's top-left corner.
 */
export function addTextFrame(
  doc: RePageDocument,
  pageId: PageId,
  rect: FrameRectMm,
  paragraphs: ParagraphNode[],
  opts: TextFrameOptions = {},
): ObjectId {
  const page = doc.pages[pageId];
  if (!page) throw new Error(`Page ${pageId} does not exist.`);
  const storyId: StoryId = createId('story');
  doc.stories[storyId] = {
    id: storyId,
    name: opts.name ?? 'Template story',
    content: { type: 'doc', content: paragraphs },
  };
  const frameId = createId('frame');
  const pad = opts.paddingMm ?? 2;
  const frame: TextFrameObject = {
    id: frameId,
    pageId,
    name: opts.name ?? 'Template text frame',
    frame: {
      x: mm(rect.x),
      y: mm(rect.y),
      width: mm(rect.w),
      height: mm(rect.h),
      rotation: 0,
    },
    locked: false,
    hidden: false,
    opacity: 1,
    type: 'text-frame',
    storyId,
    fontFamily: opts.fontFamily ?? FONT_NASTALEEQ,
    fontSize: opts.fontSize ?? 14,
    color: opts.color ?? '#111827',
    lineHeight: opts.lineHeight ?? 1.6,
    padding: { top: mm(pad), right: mm(pad), bottom: mm(pad), left: mm(pad) },
    columns: opts.columns,
    columnGap: opts.columnGapMm !== undefined ? mm(opts.columnGapMm) : undefined,
    rtlColumnOrder: true,
  };
  doc.objects[frameId] = frame;
  page.objectOrder.push(frameId);
  return frameId;
}

export interface RectOptions {
  fill?: string | undefined;
  stroke?: string | undefined;
  strokeWidth?: number | undefined;
  cornerRadius?: number | undefined;
  name?: string | undefined;
}

/** Adds a rectangle (rule, border, decorative panel) to the page. */
export function addRect(
  doc: RePageDocument,
  pageId: PageId,
  rect: FrameRectMm,
  opts: RectOptions = {},
): ObjectId {
  const page = doc.pages[pageId];
  if (!page) throw new Error(`Page ${pageId} does not exist.`);
  const id = createId('rect');
  const obj: RectangleObject = {
    id,
    pageId,
    name: opts.name ?? 'Template rectangle',
    frame: { x: mm(rect.x), y: mm(rect.y), width: mm(rect.w), height: mm(rect.h), rotation: 0 },
    locked: false,
    hidden: false,
    opacity: 1,
    type: 'rectangle',
    fill: opts.fill ?? 'none',
    stroke: opts.stroke ?? '#111827',
    strokeWidth: opts.strokeWidth ?? 1,
    cornerRadius: opts.cornerRadius ?? 0,
  };
  doc.objects[id] = obj;
  page.objectOrder.push(id);
  return id;
}

/** Point-exact rectangle variant for borders that must hug the page edges. */
export function addPageBorderExact(
  doc: RePageDocument,
  pageId: PageId,
  insetPt: number,
  strokeWidth = 1.5,
): ObjectId {
  const page = doc.pages[pageId];
  if (!page) throw new Error(`Page ${pageId} does not exist.`);
  const id = createId('rect');
  const obj: RectangleObject = {
    id,
    pageId,
    name: 'Page border',
    frame: {
      x: insetPt,
      y: insetPt,
      width: page.width - insetPt * 2,
      height: page.height - insetPt * 2,
      rotation: 0,
    },
    locked: false,
    hidden: false,
    opacity: 1,
    type: 'rectangle',
    fill: 'none',
    stroke: '#1f2937',
    strokeWidth,
    cornerRadius: 0,
  };
  doc.objects[id] = obj;
  page.objectOrder.push(id);
  return id;
}

/** A thin horizontal rule spanning the content width at the given y (mm). */
export function addHorizontalRule(
  doc: RePageDocument,
  pageId: PageId,
  yMm: number,
  xMm: number,
  widthMm: number,
  strokeWidth = 1,
): ObjectId {
  return addRect(doc, pageId, { x: xMm, y: yMm, w: widthMm, h: 0.4 }, {
    fill: '#1f2937',
    stroke: '#1f2937',
    strokeWidth,
    name: 'Horizontal rule',
  });
}

export interface TableCellSpecObject {
  text: string;
  bold?: boolean | undefined;
  align?: TextAlignment | undefined;
  size?: number | undefined;
  backgroundColor?: string | undefined;
}

/** A table cell: plain text, or text with per-cell formatting. */
export type TableCellSpec = string | TableCellSpecObject;

export interface AddTableOptions {
  name?: string | undefined;
  /** Height of each row in points; frame height = rows × rowHeightPt. Default 30. */
  rowHeightPt?: number | undefined;
  /** Default cell font size in points. Default 12. */
  fontSize?: number | undefined;
  borderColor?: string | undefined;
}

/**
 * Adds a REAL table object — the same model shape the app's own table
 * commands build (rows of cells carrying rich-text documents), so users
 * can edit every cell after inserting the template. The rect is given in
 * millimetres; height is derived from the row count.
 */
export function addTable(
  doc: RePageDocument,
  pageId: PageId,
  rect: { x: number; y: number; w: number },
  rows: TableCellSpec[][],
  opts: AddTableOptions = {},
): ObjectId {
  const page = doc.pages[pageId];
  if (!page) throw new Error(`Page ${pageId} does not exist.`);
  const rowHeightPt = opts.rowHeightPt ?? 30;
  const tableRows: TableRow[] = rows.map((rowSpec) => ({
    id: createId('row'),
    cells: rowSpec.map((cellSpec): TableCell => {
      const spec: TableCellSpecObject = typeof cellSpec === 'string' ? { text: cellSpec } : cellSpec;
      return {
        id: createId('cell'),
        content: {
          type: 'doc',
          content: [
            para(spec.text, {
              align: spec.align ?? 'center',
              size: spec.size ?? opts.fontSize ?? 12,
              bold: spec.bold ?? false,
            }),
          ],
        },
        backgroundColor: spec.backgroundColor ?? '#ffffff',
      };
    }),
  }));
  const id = createId('table');
  const table: TableObject = {
    id,
    pageId,
    name: opts.name ?? 'Template table',
    frame: {
      x: mm(rect.x),
      y: mm(rect.y),
      width: mm(rect.w),
      height: tableRows.length * rowHeightPt,
      rotation: 0,
    },
    locked: false,
    hidden: false,
    opacity: 1,
    type: 'table',
    rows: tableRows,
    cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
    borderColor: opts.borderColor ?? '#64748b',
    borderWidth: 1,
  };
  doc.objects[id] = table;
  page.objectOrder.push(id);
  return id;
}

/** Counts paragraphs across all stories whose plain text includes `needle`. */
export function countParagraphsContaining(doc: RePageDocument, needle: string): number {
  let count = 0;
  for (const story of Object.values(doc.stories)) {
    for (const p of story.content.content) {
      const text = p.content
        .map((n) => (n.type === 'text' ? n.text : ''))
        .join('');
      if (text.includes(needle)) count += 1;
    }
  }
  return count;
}

/** True when every paragraph in every story uses the given alignment. */
export function allParagraphsAligned(doc: RePageDocument, align: TextAlignment): boolean {
  let seen = 0;
  for (const story of Object.values(doc.stories)) {
    for (const p of story.content.content) {
      if (p.content.length === 0) continue;
      seen += 1;
      if (p.alignment !== align) return false;
    }
  }
  return seen > 0;
}
