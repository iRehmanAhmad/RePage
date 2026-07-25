import { describe, expect, it } from 'vitest';
import { runUrduOcr, UNCERTAINTY_THRESHOLD_DEFAULT } from './ocrEngine';

describe('ocrEngine', () => {
  it('parses Urdu image/PDF OCR lines, word bounds, and confidence scores', async () => {
    const dummyBuffer = new ArrayBuffer(1024);
    const result = await runUrduOcr(dummyBuffer, 'sample_manuscript.png');

    expect(result.fileName).toBe('sample_manuscript.png');
    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.overallConfidence).toBeGreaterThan(0);
    expect(result.sourceAssetId).toContain('asset-ocr-sample_manuscript.png');
  });

  it('flags words below uncertainty threshold as uncertain (isUncertain=true)', async () => {
    const dummyBuffer = new ArrayBuffer(512);
    const result = await runUrduOcr(dummyBuffer, 'urdu_page.pdf', { uncertaintyThreshold: 75 });

    expect(result.uncertainWordCount).toBeGreaterThan(0);
    const uncertainWords = result.lines
      .flatMap((l) => l.words)
      .filter((w) => w.confidence < UNCERTAINTY_THRESHOLD_DEFAULT);

    expect(uncertainWords.every((w) => w.isUncertain === true)).toBe(true);
  });
});
