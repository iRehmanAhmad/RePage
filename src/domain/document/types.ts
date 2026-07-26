import type { RichTextDocument } from '../rich-text/types';

export type DocumentId = string;
export type PageId = string;
export type ObjectId = string;
export type StoryId = string;
export type AssetId = string;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface DocumentMetadata {
  title: string;
  createdAt: string;
  modifiedAt: string;
  locale: 'ur-PK' | 'en';
}

export type MasterPageId = string;

export interface MasterPage {
  id: MasterPageId;
  name: string;
  width: number;
  height: number;
  margins: Insets;
  objectOrder: ObjectId[];
  objects: Record<ObjectId, PageObject>;
}

export interface Page {
  id: PageId;
  name: string;
  width: number;
  height: number;
  margins: Insets;
  bleed: Insets;
  background: string;
  objectOrder: ObjectId[];
  masterPageId?: MasterPageId | null | undefined;
  masterOverrides?: Record<ObjectId, Partial<PageObject>> | undefined;
}

export type TextWrapMode = 'inline' | 'square' | 'tight' | 'top-bottom' | 'behind' | 'in-front';

export interface ObjectAnchor {
  storyId: StoryId;
  paragraphIndex: number;
  offsetPercent: number;
}

export interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BasePageObject {
  id: ObjectId;
  pageId: PageId;
  name: string;
  frame: Rect;
  locked: boolean;
  hidden: boolean;
  opacity: number;
  positioning?: 'inline' | 'floating' | undefined;
  anchor?: ObjectAnchor | undefined;
  wrapMode?: TextWrapMode | undefined;
  wrapDistance?: Insets | undefined;
  rotation?: number | undefined;
}

export interface TextFrameObject extends BasePageObject {
  type: 'text-frame';
  storyId: StoryId;
  fontFamily: string;
  fontSize: number;
  color: string;
  lineHeight: number;
  padding: Insets;
  sequenceIndex?: number | undefined;
  nextFrameId?: ObjectId | null | undefined;
  previousFrameId?: ObjectId | null | undefined;
  overflow?: boolean | undefined;
  columns?: number | undefined;
  columnGap?: number | undefined;
  verticalAlignment?: 'top' | 'middle' | 'bottom' | undefined;
  rtlColumnOrder?: boolean | undefined;
}

export type ShapeKind =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'ellipse'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'hexagon'
  | 'callout'
  | 'line';

export interface RectangleObject extends BasePageObject {
  type: 'rectangle';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  storyId?: StoryId;
  shapeKind?: ShapeKind;
}

export interface ImageFrameObject extends BasePageObject {
  type: 'image-frame';
  assetId: AssetId | null;
  fit: 'contain' | 'cover' | 'stretch';
  crop?: CropBounds | undefined;
}

export interface TableCell {
  id: string;
  content: unknown;
  colSpan?: number | undefined;
  rowSpan?: number | undefined;
  backgroundColor?: string | undefined;
}

export interface TableRow {
  id: string;
  cells: TableCell[];
}

export interface TableObject extends BasePageObject {
  type: 'table';
  rows: TableRow[];
  cellPadding?: Insets | undefined;
  borderColor?: string | undefined;
  borderWidth?: number | undefined;
}

export type PageObject = TextFrameObject | RectangleObject | ImageFrameObject | TableObject;

export interface TextStory {
  id: StoryId;
  name: string;
  content: RichTextDocument;
}

export interface AssetReference {
  id: AssetId;
  sha256: string;
  mediaType: string;
  byteSize: number;
  originalName: string;
  packageEntry: string;
  dataUrl?: string;
}

export type ViewMode = 'print' | 'web' | 'draft';

export type SectionBreakType = 'next-page' | 'continuous';

export interface SectionBreak {
  id: string;
  type: SectionBreakType;
  orientation?: 'portrait' | 'landscape';
  width?: number;
  height?: number;
  margins?: Insets;
  columns?: number;
  columnGap?: number;
  headerStoryId?: StoryId;
  footerStoryId?: StoryId;
}

export interface HeaderFooterConfig {
  differentFirstPage?: boolean;
  differentOddEven?: boolean;
  headerDistance?: number;
  footerDistance?: number;
}

export interface FootnoteEntry {
  id: string;
  number: number;
  text: string;
  pageId: PageId;
}

export interface Bookmark {
  id: string;
  name: string;
  storyId: StoryId;
  paragraphIndex: number;
  pageId?: PageId | undefined;
}

export interface Caption {
  id: string;
  objectId: ObjectId;
  type: 'figure' | 'table' | 'equation';
  number: number;
  label: string;
  text: string;
}

export interface IndexEntry {
  id: string;
  term: string;
  subterm?: string | undefined;
  pageId: PageId;
  formattedPageNumber: string;
}

export interface TrackedRevision {
  id: string;
  type: 'insert' | 'delete' | 'format';
  author: string;
  timestamp: string;
  text: string;
  paragraphIndex: number;
}

export interface RePageDocument {
  schemaVersion: 1;
  id: DocumentId;
  metadata: DocumentMetadata;
  settings: {
    measurementUnit: 'pt' | 'mm' | 'in';
    viewMode?: ViewMode;
    showRulers?: boolean;
  };
  pageOrder: PageId[];
  pages: Record<PageId, Page>;
  objects: Record<ObjectId, PageObject>;
  stories: Record<StoryId, TextStory>;
  styles: Record<string, unknown>;
  assets: Record<AssetId, AssetReference>;
  masterPages?: Record<MasterPageId, MasterPage> | undefined;
  sections?: SectionBreak[];
  footnotes?: Record<string, FootnoteEntry>;
  endnotes?: Record<string, FootnoteEntry>;
  headerFooterConfig?: HeaderFooterConfig;
  bookmarks?: Record<string, Bookmark>;
  captions?: Record<string, Caption>;
  indexEntries?: IndexEntry[];
  revisions?: TrackedRevision[];
}

export type UrduPageDocument = RePageDocument;
