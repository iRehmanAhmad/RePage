import { z } from 'zod';

const finiteNumber = z.number().finite();
const nonNegativeNumber = finiteNumber.nonnegative();
const positiveNumber = finiteNumber.positive();

const insetsSchema = z.object({
  top: nonNegativeNumber,
  right: nonNegativeNumber,
  bottom: nonNegativeNumber,
  left: nonNegativeNumber,
});

const frameSchema = z.object({
  x: finiteNumber,
  y: finiteNumber,
  width: positiveNumber,
  height: positiveNumber,
  rotation: finiteNumber,
});

import { richTextDocumentSchema } from '../rich-text/types';

const storySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  content: richTextDocumentSchema,
});

const baseObjectSchema = z.object({
  id: z.string().min(1),
  pageId: z.string().min(1),
  name: z.string(),
  frame: frameSchema,
  locked: z.boolean(),
  hidden: z.boolean(),
  opacity: z.number().min(0).max(1),
});

const textFrameSchema = baseObjectSchema.extend({
  type: z.literal('text-frame'),
  storyId: z.string().min(1),
  fontFamily: z.string().min(1),
  fontSize: positiveNumber,
  color: z.string().min(1),
  lineHeight: positiveNumber,
  padding: insetsSchema,
  sequenceIndex: z.number().int().nonnegative().optional(),
  nextFrameId: z.string().min(1).nullable().optional(),
  previousFrameId: z.string().min(1).nullable().optional(),
  overflow: z.boolean().optional(),
  columns: z.number().int().positive().optional(),
  columnGap: nonNegativeNumber.optional(),
});

const rectangleSchema = baseObjectSchema.extend({
  type: z.literal('rectangle'),
  fill: z.string(),
  stroke: z.string(),
  strokeWidth: nonNegativeNumber,
  cornerRadius: nonNegativeNumber,
});

const imageFrameSchema = baseObjectSchema.extend({
  type: z.literal('image-frame'),
  assetId: z.string().min(1).nullable(),
  fit: z.enum(['contain', 'cover', 'stretch']),
});

export const documentSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  metadata: z.object({
    title: z.string().min(1),
    createdAt: z.iso.datetime(),
    modifiedAt: z.iso.datetime(),
    locale: z.enum(['ur-PK', 'en']),
  }),
  settings: z.object({
    measurementUnit: z.enum(['pt', 'mm', 'in']),
  }),
  pageOrder: z.array(z.string().min(1)).min(1),
  pages: z.record(
    z.string(),
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      width: positiveNumber,
      height: positiveNumber,
      margins: insetsSchema,
      bleed: insetsSchema,
      background: z.string().min(1),
      objectOrder: z.array(z.string().min(1)),
    }),
  ),
  objects: z.record(
    z.string(),
    z.discriminatedUnion('type', [textFrameSchema, rectangleSchema, imageFrameSchema]),
  ),
  stories: z.record(z.string(), storySchema),
  styles: z.record(z.string(), z.unknown()),
  assets: z.record(
    z.string(),
    z.object({
      id: z.string().min(1),
      sha256: z.string().regex(/^[a-f0-9]{64}$/i),
      mediaType: z.string().min(1),
      byteSize: z.number().int().nonnegative(),
      originalName: z.string(),
      packageEntry: z.string().min(1),
    }),
  ),
});

export function validateDocumentReferences(value: z.infer<typeof documentSchema>): string[] {
  const errors: string[] = [];
  const orderedPages = new Set(value.pageOrder);

  if (orderedPages.size !== value.pageOrder.length) {
    errors.push('Page order contains duplicate page IDs.');
  }

  for (const pageId of value.pageOrder) {
    if (!value.pages[pageId]) {
      errors.push(`Page order references missing page ${pageId}.`);
    }
  }

  for (const [pageId, page] of Object.entries(value.pages)) {
    if (page.id !== pageId) {
      errors.push(`Page key ${pageId} does not match page ID ${page.id}.`);
    }

    const objectIds = new Set(page.objectOrder);
    if (objectIds.size !== page.objectOrder.length) {
      errors.push(`Page ${pageId} contains duplicate object IDs.`);
    }

    for (const objectId of page.objectOrder) {
      const object = value.objects[objectId];
      if (!object) {
        errors.push(`Page ${pageId} references missing object ${objectId}.`);
      } else if (object.pageId !== pageId) {
        errors.push(`Object ${objectId} belongs to a different page.`);
      }
    }
  }

  for (const object of Object.values(value.objects)) {
    if (!value.pages[object.pageId]) {
      errors.push(`Object ${object.id} references missing page ${object.pageId}.`);
    }
    if (object.type === 'text-frame' && !value.stories[object.storyId]) {
      errors.push(`Text frame ${object.id} references missing story ${object.storyId}.`);
    }
    if (object.type === 'image-frame' && object.assetId && !value.assets[object.assetId]) {
      errors.push(`Image frame ${object.id} references missing asset ${object.assetId}.`);
    }
  }

  return errors;
}

export function parseDocument(input: unknown) {
  const parsed = documentSchema.parse(input);
  const referenceErrors = validateDocumentReferences(parsed);

  if (referenceErrors.length > 0) {
    throw new Error(referenceErrors.join(' '));
  }

  return parsed;
}
