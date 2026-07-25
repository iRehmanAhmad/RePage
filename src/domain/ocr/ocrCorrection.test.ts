import { describe, expect, it } from 'vitest';
import { runUrduOcr } from './ocrEngine';
import { convertOcrResultToDocumentObjects, correctOcrWord } from './ocrCorrection';

describe('ocrCorrection', () => {
  it('updates word in OCR page result, sets confidence to 100%, and clears uncertainty flag', async () => {
    const dummyBuffer = new ArrayBuffer(512);
    const initial = await runUrduOcr(dummyBuffer, 'page1.png');

    const updated = correctOcrWord(initial, 1, 5, 'مہمترین');

    expect(updated.lines[1]!.words[5]!.word).toBe('مہمترین');
    expect(updated.lines[1]!.words[5]!.confidence).toBe(100);
    expect(updated.lines[1]!.words[5]!.isUncertain).toBe(false);
  });

  it('converts OCR result to canvas document objects preserving source image asset', async () => {
    const dummyBuffer = new ArrayBuffer(512);
    const result = await runUrduOcr(dummyBuffer, 'document_scan.jpg');

    const { imageFrame, textFrame } = convertOcrResultToDocumentObjects(result, 'page-1');

    expect(imageFrame.type).toBe('image');
    expect(imageFrame.assetId).toBe(result.sourceAssetId);
    expect(imageFrame.locked).toBe(true); // Source image preserved as background reference

    expect(textFrame.type).toBe('text');
    expect(textFrame.richText.content.length).toBeGreaterThan(0);
  });
});
