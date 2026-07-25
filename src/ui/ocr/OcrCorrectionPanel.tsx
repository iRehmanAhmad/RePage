import React, { useState } from 'react';
import { OcrPageResult, OcrWordResult } from '../../domain/ocr/ocrEngine';
import { correctOcrWord } from '../../domain/ocr/ocrCorrection';

export interface OcrCorrectionPanelProps {
  ocrResult: OcrPageResult;
  onClose?: () => void;
  onCommitToDocument?: (updatedResult: OcrPageResult) => void;
}

export const OcrCorrectionPanel: React.FC<OcrCorrectionPanelProps> = ({
  ocrResult: initialResult,
  onClose,
  onCommitToDocument,
}) => {
  const [ocrResult, setOcrResult] = useState<OcrPageResult>(initialResult);
  const [selectedWordLoc, setSelectedWordLoc] = useState<{ lineIdx: number; wordIdx: number } | null>(null);
  const [editingText, setEditingText] = useState('');

  const selectedWord: OcrWordResult | null =
    selectedWordLoc !== null && ocrResult.lines[selectedWordLoc.lineIdx]
      ? ocrResult.lines[selectedWordLoc.lineIdx]!.words[selectedWordLoc.wordIdx] ?? null
      : null;

  const handleSelectWord = (lineIdx: number, wordIdx: number) => {
    setSelectedWordLoc({ lineIdx, wordIdx });
    const target = ocrResult.lines[lineIdx]?.words[wordIdx];
    if (target) setEditingText(target.word);
  };

  const handleSaveWordCorrection = () => {
    if (selectedWordLoc === null) return;
    const updated = correctOcrWord(
      ocrResult,
      selectedWordLoc.lineIdx,
      selectedWordLoc.wordIdx,
      editingText,
    );
    setOcrResult(updated);
    setSelectedWordLoc(null);
  };

  return (
    <div className="fixed inset-6 bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📷</span>
          <div>
            <h2 className="text-base font-bold text-emerald-400">
              اردو تصویر / PDF متن شناسی (Urdu OCR & Correction)
            </h2>
            <p className="text-xs text-slate-400">
              فائل: <span className="text-slate-200">{ocrResult.fileName}</span> | مجموعی اعتماد (Overall Confidence):{' '}
              <span
                className={`font-bold ${
                  ocrResult.overallConfidence >= 85
                    ? 'text-emerald-400'
                    : ocrResult.overallConfidence >= 70
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {ocrResult.overallConfidence}%
              </span>{' '}
              | مشکوک الفاظ: <span className="font-bold text-rose-400">{ocrResult.uncertainWordCount}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCommitToDocument && (
            <button
              onClick={() => onCommitToDocument(ocrResult)}
              disabled={ocrResult.uncertainWordCount > 0}
              title={
                ocrResult.uncertainWordCount > 0
                  ? 'صفحے پر شامل کرنے سے پہلے تمام مشکوک الفاظ کی تصحیح کریں'
                  : 'صفحے پر شامل کریں'
              }
              className={`px-4 py-2 text-xs font-bold rounded flex items-center gap-1.5 transition ${
                ocrResult.uncertainWordCount > 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
              }`}
            >
              <span>صفحے پر شامل کریں (Commit to Page)</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            >
              ✕ بند کریں
            </button>
          )}
        </div>
      </div>

      {/* Main Side-by-Side Verification Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Preserved Source Image View */}
        <div className="w-1/2 p-4 bg-slate-900/60 border-r border-slate-800 flex flex-col">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex justify-between items-center">
            <span>اصل تصویر (Preserved Source Image):</span>
            <span className="text-[10px] text-emerald-400">باقاعدہ محفوظ شدہ اصل اثاثہ</span>
          </div>

          <div className="flex-1 relative bg-slate-950 rounded border border-slate-800 overflow-hidden flex items-center justify-center p-4 dir-rtl">
            <div className="relative w-full h-full max-w-[500px] max-h-[350px] bg-slate-900 border border-dashed border-slate-700 rounded flex flex-col justify-around p-4">
              <div className="text-center text-slate-500 text-xs mb-2">[محفوظ شدہ اصل تصویر کا منظر]</div>
              {/* Highlight Bounding Boxes */}
              {ocrResult.lines.map((line, lIdx) => (
                <div key={lIdx} className="flex justify-end gap-2 border-b border-slate-800/50 pb-2">
                  {line.words.map((w, wIdx) => {
                    const isSelected = selectedWordLoc?.lineIdx === lIdx && selectedWordLoc?.wordIdx === wIdx;
                    return (
                      <span
                        key={wIdx}
                        onClick={() => handleSelectWord(lIdx, wIdx)}
                        className={`px-1.5 py-0.5 rounded text-xs cursor-pointer border transition ${
                          isSelected
                            ? 'ring-2 ring-emerald-400 bg-emerald-950 border-emerald-500 font-bold'
                            : w.isUncertain
                            ? 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {w.word}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Side-by-Side Recognized Urdu Text & Corrections */}
        <div className="w-1/2 p-4 bg-slate-950 flex flex-col dir-rtl space-y-4 overflow-y-auto">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-xs font-semibold text-slate-300">شناخت شدہ اردو متن اور تصحیح:</h3>
            <div className="flex gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> 85%+
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> 70-84%
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> &lt;70% (مشکوک)
              </span>
            </div>
          </div>

          {/* Interactive Word Corrections */}
          <div className="space-y-3 flex-1">
            {ocrResult.lines.map((line, lIdx) => (
              <div key={lIdx} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                <div className="text-xs text-slate-400 font-mono">سطر {lIdx + 1}:</div>
                <div className="flex flex-wrap gap-1.5 items-center leading-relaxed">
                  {line.words.map((w, wIdx) => {
                    const isSelected = selectedWordLoc?.lineIdx === lIdx && selectedWordLoc?.wordIdx === wIdx;
                    return (
                      <button
                        key={wIdx}
                        onClick={() => handleSelectWord(lIdx, wIdx)}
                        className={`px-2 py-1 rounded text-xs transition flex items-center gap-1 ${
                          isSelected
                            ? 'ring-2 ring-emerald-400 bg-emerald-950 text-emerald-200 border border-emerald-500 font-bold'
                            : w.isUncertain
                            ? 'bg-rose-950/90 text-rose-200 border border-rose-600 font-bold'
                            : w.confidence >= 85
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            : 'bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-800'
                        }`}
                      >
                        <span>{w.word}</span>
                        {w.isUncertain && <span className="text-[10px] text-rose-400">❓</span>}
                        <span className="text-[9px] opacity-60">({w.confidence}%)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Word Editing Control Box */}
          {selectedWord && selectedWordLoc && (
            <div className="p-3 bg-slate-900 border border-emerald-500/50 rounded-xl space-y-2 shadow-xl">
              <div className="text-xs font-bold text-emerald-400 flex justify-between">
                <span>منتخب لفظ کی تصحیح:</span>
                <span>اعتماد: {selectedWord.confidence}%</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveWordCorrection}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded"
                >
                  تصحیح محفوظ کریں
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
