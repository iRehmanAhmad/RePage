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

export interface Page {
  id: PageId;
  name: string;
  width: number;
  height: number;
  margins: Insets;
  bleed: Insets;
  background: string;
  objectOrder: ObjectId[];
}

interface BasePageObject {
  id: ObjectId;
  pageId: PageId;
  name: string;
  frame: Rect;
  locked: boolean;
  hidden: boolean;
  opacity: number;
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
}

export interface RectangleObject extends BasePageObject {
  type: 'rectangle';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface ImageFrameObject extends BasePageObject {
  type: 'image-frame';
  assetId: AssetId | null;
  fit: 'contain' | 'cover' | 'stretch';
}

export type PageObject = TextFrameObject | RectangleObject | ImageFrameObject;

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
}

export interface RePageDocument {
  schemaVersion: 1;
  id: DocumentId;
  metadata: DocumentMetadata;
  settings: {
    measurementUnit: 'pt' | 'mm' | 'in';
  };
  pageOrder: PageId[];
  pages: Record<PageId, Page>;
  objects: Record<ObjectId, PageObject>;
  stories: Record<StoryId, TextStory>;
  styles: Record<string, unknown>;
  assets: Record<AssetId, AssetReference>;
}

export type UrduPageDocument = RePageDocument;
