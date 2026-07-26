import type { OcrInput, OcrOptions, OcrPageResult } from './ocrEngine';

export interface OcrProvider {
  id: string;
  name: string;
  isAvailable: boolean;
  recognize(input: OcrInput, options?: OcrOptions): Promise<OcrPageResult>;
}

export class MockOcrProvider implements OcrProvider {
  id = 'mock';
  name = 'Mock Urdu OCR Engine (Test Environment)';
  isAvailable = true;

  async recognize(input: OcrInput, _options?: OcrOptions): Promise<OcrPageResult> {
    const fileName = input.fileName || 'scan.png';
    const sourceAssetId = `asset-ocr-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}-${input.buffer.byteLength}`;

    const words = [
      { word: 'پاکستان', confidence: 98, bbox: { x: 100, y: 100, width: 120, height: 40 }, isUncertain: false },
      { word: 'ایک', confidence: 95, bbox: { x: 230, y: 100, width: 50, height: 40 }, isUncertain: false },
      { word: 'با‌اعتماد', confidence: 72, bbox: { x: 290, y: 100, width: 110, height: 40 }, isUncertain: true }, // Low confidence for review!
      { word: 'ملک', confidence: 96, bbox: { x: 410, y: 100, width: 60, height: 40 }, isUncertain: false },
      { word: 'ہے۔', confidence: 99, bbox: { x: 480, y: 100, width: 40, height: 40 }, isUncertain: false },
    ];

    const lines = [
      {
        lineIndex: 0,
        text: 'پاکستان ایک با‌اعتماد ملک ہے۔',
        confidence: 92,
        words,
      },
    ];

    return {
      sourceAssetId,
      fileName,
      overallConfidence: 92,
      lines,
      text: 'پاکستان ایک با‌اعتماد ملک ہے۔',
      uncertainWordCount: 1,
      imageDimensions: { width: 1200, height: 1600 },
    };
  }
}

export class UnavailableOcrProvider implements OcrProvider {
  id = 'unavailable';
  name = 'Offline OCR Engine';
  isAvailable = false;

  async recognize(_input: OcrInput, _options?: OcrOptions): Promise<OcrPageResult> {
    throw new Error(
      'مقامی OCR انجن دستیاب نہیں ہے۔ براے کرم کوئی تصویری فائل منتخب کریں یا OCR انجن کی ترتیب درست کریں۔ (Local OCR engine unavailable. Please select an image file or configure an offline OCR provider.)',
    );
  }
}

const registeredProviders: Map<string, OcrProvider> = new Map([
  ['mock', new MockOcrProvider()],
  ['unavailable', new UnavailableOcrProvider()],
]);

export function getOcrProvider(id = 'mock'): OcrProvider {
  return registeredProviders.get(id) || new UnavailableOcrProvider();
}

/**
 * Returns the best available non-mock OCR provider.
 * Falls back to UnavailableOcrProvider when no real engine is registered.
 * Production UI should use this instead of getOcrProvider('mock').
 */
export function getConfiguredOcrProvider(): OcrProvider {
  for (const provider of registeredProviders.values()) {
    if (provider.id !== 'mock' && provider.id !== 'unavailable' && provider.isAvailable) {
      return provider;
    }
  }
  return new UnavailableOcrProvider();
}

export function registerOcrProvider(provider: OcrProvider): void {
  registeredProviders.set(provider.id, provider);
}
