import { OcrPageResult } from './ocrEngine';
import { ImageFrameObject, TextFrameObject } from '../document/types';
import { createRichTextFromPlainText } from '../rich-text/types';

export function correctOcrWord(
  pageResult: OcrPageResult,
  lineIdx: number,
  wordIdx: number,
  correctedWord: string,
): OcrPageResult {
  if (lineIdx < 0 || lineIdx >= pageResult.lines.length) return pageResult;
  const targetLine = pageResult.lines[lineIdx];
  if (!targetLine || wordIdx < 0 || wordIdx >= targetLine.words.length) return pageResult;

  const updatedLines = pageResult.lines.map((line, lIdx) => {
    if (lIdx !== lineIdx) return line;

    const updatedWords = line.words.map((w, wIdx) => {
      if (wIdx !== wordIdx) return w;

      return {
        ...w,
        word: correctedWord,
        confidence: 100, // Explicitly corrected by user
        isUncertain: false,
      };
    });

    const newText = updatedWords.map((w) => w.word).join(' ');
    const newConf = Math.round(
      updatedWords.reduce((sum, w) => sum + w.confidence, 0) / Math.max(1, updatedWords.length),
    );

    return {
      ...line,
      text: newText,
      confidence: newConf,
      words: updatedWords,
    };
  });

  let totalConf = 0;
  let totalWords = 0;
  let uncertainCount = 0;

  updatedLines.forEach((l) => {
    l.words.forEach((w) => {
      totalConf += w.confidence;
      totalWords++;
      if (w.isUncertain) uncertainCount++;
    });
  });

  const overallConfidence = Math.round(totalConf / Math.max(1, totalWords));
  const fullText = updatedLines.map((l) => l.text).join('\n');

  return {
    ...pageResult,
    lines: updatedLines,
    overallConfidence,
    text: fullText,
    uncertainWordCount: uncertainCount,
  };
}

export function convertOcrResultToDocumentObjects(
  pageResult: OcrPageResult,
  pageId: string,
): {
  imageFrame: ImageFrameObject;
  textFrame: TextFrameObject;
} {
  const timestamp = Date.now();

  // Preserved source image background asset frame
  const imageFrame: ImageFrameObject = {
    id: `img-ocr-${timestamp}`,
    type: 'image',
    name: `OCR Source Image (${pageResult.fileName})`,
    pageId,
    frame: { x: 50, y: 50, width: 500, height: 350, rotation: 0 },
    assetId: pageResult.sourceAssetId,
    fitMode: 'contain',
    opacity: 0.25, // Faded background reference
    locked: true,
  };

  // Primary recognized Urdu text frame
  const storyId = `story-ocr-${timestamp}`;
  const textFrame: TextFrameObject = {
    id: `txt-ocr-${timestamp}`,
    type: 'text',
    name: `OCR Recognized Story (${pageResult.fileName})`,
    pageId,
    frame: { x: 50, y: 50, width: 500, height: 350, rotation: 0 },
    storyId,
    richText: createRichTextFromPlainText(pageResult.text, 'rtl'),
    verticalAlignment: 'top',
    columnCount: 1,
    columnGap: 12,
  };

  return { imageFrame, textFrame };
}
