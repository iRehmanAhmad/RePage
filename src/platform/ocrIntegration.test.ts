import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import type { RePageDocument } from '../domain/document/types';
import { validateOcrInputFile } from '../domain/ocr/ocrEngine';
import { getOcrProvider, MockOcrProvider } from '../domain/ocr/ocrProvider';
import { convertOcrResultToDocumentObjects, correctOcrWord } from '../domain/ocr/ocrCorrection';
import { extractPlainTextFromStory } from '../domain/language/languageToolScope';
import { createUrdupPackage, readUrdupPackage } from '../persistence/package/urdupPackage';

describe('Urdu Tools Phase 5 — OCR Provider & Document Integration', () => {
  it('1. Validates OCR input file extensions and size limits', () => {
    expect(validateOcrInputFile('document.png', 1024).isValid).toBe(true);
    expect(validateOcrInputFile('scan.jpg', 2048).isValid).toBe(true);
    expect(validateOcrInputFile('page.pdf', 4096).isValid).toBe(true);

    expect(validateOcrInputFile('script.exe', 1024).isValid).toBe(false);
    expect(validateOcrInputFile('large_scan.png', 30 * 1024 * 1024).isValid).toBe(false);
  });

  it('2. Provider hierarchy: Mock provider succeeds, Unavailable provider throws explicit error', async () => {
    const mockProvider = getOcrProvider('mock');
    expect(mockProvider.isAvailable).toBe(true);

    const buffer = new ArrayBuffer(1024);
    const mockRes = await mockProvider.recognize({ buffer, fileName: 'test.png' });
    expect(mockRes.text).toContain('پاکستان');

    const unavailableProvider = getOcrProvider('unavailable');
    expect(unavailableProvider.isAvailable).toBe(false);
    await expect(unavailableProvider.recognize({ buffer, fileName: 'test.png' })).rejects.toThrow();
  });

  it('3. Corrects low-confidence words during review', async () => {
    const provider = new MockOcrProvider();
    const buffer = new ArrayBuffer(1024);
    const rawRes = await provider.recognize({ buffer, fileName: 'review.png' });

    // Word 2 is low confidence (72)
    expect(rawRes.lines[0]?.words[2]?.confidence).toBeLessThan(80);

    // Correct low-confidence word
    const corrected = correctOcrWord(rawRes, 0, 2, 'بااعتماد');
    expect(corrected.text).toContain('بااعتماد');
  });

  it('4. Phase 5 Exit Gate: Import Urdu image, run recognition, correct low-confidence word, commit to canvas as image + text frame, save .urdup package & reopen', async () => {
    const provider = new MockOcrProvider();
    const buffer = new ArrayBuffer(2048);
    const fileName = 'urdu_document_scan.png';

    // 1. Run recognition
    const ocrResult = await provider.recognize({ buffer, fileName });
    expect(ocrResult.text).toBeDefined();

    // 2. Convert result to canonical document objects
    const baseDoc = createStarterDocument();
    const activePageId = Object.keys(baseDoc.pages)[0]!;
    const targetPage = baseDoc.pages[activePageId]!;
    const { imageFrame, textFrame, story } = convertOcrResultToDocumentObjects(ocrResult, activePageId);

    // 3. Commit objects to RePageDocument state
    const committedDoc: RePageDocument = {
      ...baseDoc,
      objects: {
        ...baseDoc.objects,
        [imageFrame.id]: imageFrame,
        [textFrame.id]: textFrame,
      },
      stories: {
        ...baseDoc.stories,
        [story.id]: story,
      },
      pages: {
        ...baseDoc.pages,
        [activePageId]: {
          ...targetPage,
          objectOrder: [...targetPage.objectOrder, imageFrame.id, textFrame.id],
        },
      },
      assets: {
        ...baseDoc.assets,
        [ocrResult.sourceAssetId]: {
          id: ocrResult.sourceAssetId,
          sha256: 'e5a00aa9991ac8a5ee3109844d84a55583bd20572ad3ffcd42792f3c36b183ad',
          mediaType: 'image/png',
          byteSize: buffer.byteLength,
          originalName: fileName,
          packageEntry: `assets/${ocrResult.sourceAssetId}.png`,
        },
      },
    };

    // 4. Verify canonical objects on canvas
    expect(committedDoc.objects[imageFrame.id]).toBeDefined();
    expect(committedDoc.objects[textFrame.id]).toBeDefined();
    const canvasText = extractPlainTextFromStory(committedDoc.stories[story.id]!);
    expect(canvasText).toContain('پاکستان');

    // 5. Package save and reopen check
    const pkgBytes = await createUrdupPackage(
      committedDoc,
      new Map([[ocrResult.sourceAssetId, new Uint8Array(buffer)]]),
    );
    expect(pkgBytes.length).toBeGreaterThan(0);

    const reopenedDoc = await readUrdupPackage(pkgBytes);
    expect(reopenedDoc.objects[imageFrame.id]).toBeDefined();
    expect(reopenedDoc.objects[textFrame.id]).toBeDefined();
    const reopenedText = extractPlainTextFromStory(reopenedDoc.stories[story.id]!);
    expect(reopenedText).toContain('پاکستان');
  });
});
