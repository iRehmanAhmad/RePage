import { describe, expect, it } from 'vitest';
import { createStarterDocument, PRIMARY_STORY_ID } from '../../domain/document/createDocument';
import type { ImageFrameObject, TextFrameObject } from '../../domain/document/types';
import { addImageFrame, addTextBox } from '../../editor/commands/documentCommands';
import {
  setImageAdjustmentsCommand,
  setImageCropCommand,
  setTextOnPathCommand,
} from '../../editor/commands/objectCommands';
import { setParagraphJustificationModeCommand } from '../../editor/commands/storyBreakCommands';
import { addDocumentIgnoredWordCommand } from '../../editor/commands/languageCommands';
import { createUrdupPackage, readUrdupPackage } from './urdupPackage';

/**
 * Phase 4 batch 8: the two new persisted document extras — image crop
 * insets and the per-document spellcheck ignore list — must survive the
 * .urdup package round-trip exactly.
 */
describe('.urdup package — crop + document ignore list', () => {
  it('round-trips image crop insets and spellcheckIgnoredWords unchanged', async () => {
    const starter = createStarterDocument();
    const pageId = starter.pageOrder[0]!;
    const img = addImageFrame(starter, pageId, 'photo.png', undefined, 200, 150);

    let doc = setImageCropCommand(img.document, img.objectId, {
      left: 0.12,
      top: 0.05,
      right: 0.2,
      bottom: 0.1,
    });
    doc = addDocumentIgnoredWordCommand(doc, 'پکستان');
    doc = addDocumentIgnoredWordCommand(doc, 'recieve');

    const bytes = await createUrdupPackage(doc);
    const reopened = await readUrdupPackage(bytes);

    expect(reopened).toEqual(doc);
    const frame = reopened.objects[img.objectId] as ImageFrameObject;
    expect(frame.crop).toEqual({ left: 0.12, top: 0.05, right: 0.2, bottom: 0.1 });
    expect(reopened.metadata.spellcheckIgnoredWords).toEqual(['پکستان', 'recieve']);
  });
});

/**
 * Phase 4 batch 11: the new persisted fields — image adjustments,
 * text-on-a-circle config, paragraph justification mode, and the new
 * page-number styles — must survive the .urdup round-trip exactly.
 */
describe('.urdup package — batch 11 fields', () => {
  it('round-trips adjustments, textOnPath and justificationMode unchanged', async () => {
    const starter = createStarterDocument();
    const pageId = starter.pageOrder[0]!;
    const img = addImageFrame(starter, pageId, 'photo.png', undefined, 200, 150);
    const box = addTextBox(img.document, pageId);

    let doc = setImageAdjustmentsCommand(box.document, img.objectId, {
      brightness: 125,
      contrast: 85,
      flipH: true,
      flipV: false,
    });
    doc = setTextOnPathCommand(doc, box.objectId, {
      kind: 'circle',
      startAngleDeg: 45,
      flip: true,
    });
    doc = setParagraphJustificationModeCommand(doc, PRIMARY_STORY_ID, 0, 'space');
    // New page-number styles persist on the section settings.
    doc = {
      ...doc,
      sections: (doc.sections ?? []).map((s, i) =>
        i === 0
          ? { ...s, pageNumbering: { ...s.pageNumbering, style: 'abjad' as const } }
          : s,
      ),
    };

    const bytes = await createUrdupPackage(doc);
    const reopened = await readUrdupPackage(bytes);

    expect(reopened).toEqual(doc);
    expect((reopened.objects[img.objectId] as ImageFrameObject).adjustments).toEqual({
      brightness: 125,
      contrast: 85,
      flipH: true,
      flipV: false,
    });
    expect((reopened.objects[box.objectId] as TextFrameObject).textOnPath).toEqual({
      kind: 'circle',
      startAngleDeg: 45,
      flip: true,
    });
    expect(
      reopened.stories[PRIMARY_STORY_ID]!.content.content[0]!.justificationMode,
    ).toBe('space');
    expect(reopened.sections![0]!.pageNumbering.style).toBe('abjad');
  });
});

/**
 * Phase 4 batch 12: character styles — a run's characterStyleId reference
 * and the document's character-style registry (including the language
 * field) must survive the .urdup round-trip exactly.
 */
describe('.urdup package — batch 12 character styles', () => {
  it('round-trips characterStyleId runs and the style registry unchanged', async () => {
    const starter = createStarterDocument();
    const story = starter.stories[PRIMARY_STORY_ID]!;
    const doc = {
      ...starter,
      styles: {
        characterStyles: {
          school_name: {
            id: 'school_name',
            name: 'اسکول کا نام',
            fontFamily: 'Noto Nastaliq Urdu',
            fontSize: 20,
            bold: true,
            color: '#1d4ed8',
            language: 'ur',
          },
        },
      },
      stories: {
        ...starter.stories,
        [PRIMARY_STORY_ID]: {
          ...story,
          content: {
            type: 'doc' as const,
            content: [
              {
                type: 'paragraph' as const,
                direction: 'rtl' as const,
                content: [
                  { type: 'text' as const, text: 'GPS ', characterStyleId: 'school_name' },
                  { type: 'text' as const, text: 'plain' },
                ],
              },
            ],
          },
        },
      },
    };

    const bytes = await createUrdupPackage(doc);
    const reopened = await readUrdupPackage(bytes);

    expect(reopened).toEqual(doc);
    const registry = (reopened.styles as { characterStyles: Record<string, { language?: string }> })
      .characterStyles;
    expect(registry['school_name']?.language).toBe('ur');
    const firstRun = reopened.stories[PRIMARY_STORY_ID]!.content.content[0]!.content[0]!;
    expect(firstRun.type === 'text' ? firstRun.characterStyleId : undefined).toBe('school_name');
  });
});
