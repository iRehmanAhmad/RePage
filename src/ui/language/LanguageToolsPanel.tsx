import React, { useState } from 'react';
import { checkUrduText } from '../../domain/language/urduSpellchecker';
import { lookupUrduWord } from '../../domain/language/urduDictionary';
import { proofreadUrduText } from '../../domain/language/urduProofreader';
import { romanToUrdu, urduToRoman } from '../../domain/language/transliteration';
import { previewNormalization } from '../../domain/language/characterNormalization';

export interface LanguageToolsPanelProps {
  initialText?: string;
  onClose?: () => void;
  onApplyText?: (newText: string) => void;
}

export const LanguageToolsPanel: React.FC<LanguageToolsPanelProps> = ({
  initialText = '',
  onClose,
  onApplyText,
}) => {
  const [activeTab, setActiveTab] = useState<'proofread' | 'dictionary' | 'transliterate' | 'normalize'>('proofread');
  const [text, setText] = useState(initialText);

  // Dictionary Tab State
  const [dictQuery, setDictQuery] = useState('');
  const [dictResult, setDictResult] = useState<ReturnType<typeof lookupUrduWord>>(null);

  // Transliteration Tab State
  const [romanInput, setRomanInput] = useState('shukriya pakistan');
  const [transliteratedOutput, setTransliteratedOutput] = useState(romanToUrdu('shukriya pakistan'));

  // Proofread Results
  const spellingErrors = checkUrduText(text);
  const proofreadIssues = proofreadUrduText(text);
  const normPreview = previewNormalization(text);

  return (
    <div className="fixed inset-y-12 right-6 w-[450px] bg-slate-900 text-slate-100 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden font-sans">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <span>🌐</span> اردو زبان کے آلات (Language Tools)
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-700/50"
          >
            ✕ بند کریں
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 text-xs bg-slate-900/80">
        <button
          onClick={() => setActiveTab('proofread')}
          className={`flex-1 py-2 font-medium border-b-2 ${
            activeTab === 'proofread' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          املاء و تصحیح ({spellingErrors.length + proofreadIssues.length})
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={`flex-1 py-2 font-medium border-b-2 ${
            activeTab === 'dictionary' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          لغت (Dictionary)
        </button>
        <button
          onClick={() => setActiveTab('transliterate')}
          className={`flex-1 py-2 font-medium border-b-2 ${
            activeTab === 'transliterate' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          رومن اردو
        </button>
        <button
          onClick={() => setActiveTab('normalize')}
          className={`flex-1 py-2 font-medium border-b-2 ${
            activeTab === 'normalize' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          نرمائلائزیشن ({normPreview.replacementCount})
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs dir-rtl">
        {/* Tab 1: Proofread */}
        {activeTab === 'proofread' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-1">متن کی جانچ (Input Text):</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-24 p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                placeholder="جانچ کے لیے اردو متن یہاں لکھیں..."
              />
            </div>

            {spellingErrors.length === 0 && proofreadIssues.length === 0 ? (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded text-emerald-300 text-center">
                ✨ املاء اور زبان کی کوئی غلطی نہیں ملی!
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-300">ملاخطہ کردہ نشاندہیاں:</h4>
                {spellingErrors.map((err, idx) => (
                  <div key={`spell-${idx}`} className="p-2 bg-rose-950/40 border border-rose-900/60 rounded space-y-1">
                    <div className="flex justify-between font-semibold text-rose-400">
                      <span>املاء کی غلطی: "{err.word}"</span>
                    </div>
                    {err.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center mt-1">
                        <span className="text-slate-400">تجویز:</span>
                        {err.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const updated = text.replace(err.word, sug);
                              setText(updated);
                              if (onApplyText) onApplyText(updated);
                            }}
                            className="px-2 py-0.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded text-[11px]"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {proofreadIssues.map((issue, idx) => (
                  <div key={`proof-${idx}`} className="p-2 bg-amber-950/40 border border-amber-900/60 rounded space-y-1">
                    <div className="text-amber-400 font-medium">{issue.description}</div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>اصل: <code className="text-rose-300">{issue.originalSnippet}</code></span>
                      <button
                        onClick={() => {
                          const updated = text.replace(issue.originalSnippet, issue.replacementSuggestion);
                          setText(updated);
                          if (onApplyText) onApplyText(updated);
                        }}
                        className="px-2 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 rounded"
                      >
                        تبدیل کریں ("{issue.replacementSuggestion}")
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Dictionary */}
        {activeTab === 'dictionary' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={dictQuery}
                onChange={(e) => setDictQuery(e.target.value)}
                placeholder="لفظ تلاش کریں (مثلاً: پاکستان، علم)..."
                className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => setDictResult(lookupUrduWord(dictQuery))}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
              >
                تلاش
              </button>
            </div>

            {dictResult ? (
              <div className="p-3 bg-slate-800 border border-slate-700 rounded space-y-2">
                <div className="text-base font-bold text-emerald-400">{dictResult.word}</div>
                {dictResult.grammaticalCategory && (
                  <span className="inline-block px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px]">
                    {dictResult.grammaticalCategory}
                  </span>
                )}
                <div className="text-slate-200 mt-1">{dictResult.definition}</div>
              </div>
            ) : (
              <div className="text-slate-400 text-center py-6">
                لغت میں لفظ تلاش کرنے کے لیے اوپر ٹائپ کریں۔
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Transliteration */}
        {activeTab === 'transliterate' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-1">رومن اردو (Roman Input):</label>
              <input
                type="text"
                value={romanInput}
                onChange={(e) => {
                  setRomanInput(e.target.value);
                  setTransliteratedOutput(romanToUrdu(e.target.value));
                }}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500 ltr text-left"
                placeholder="e.g. shukriya pakistan..."
              />
            </div>

            <div className="p-3 bg-slate-800 border border-slate-700 rounded space-y-1">
              <label className="block text-slate-400 text-[10px]">اردو نستعلیق (Nastaliq Output):</label>
              <div className="text-lg font-bold text-emerald-400 dir-rtl">{transliteratedOutput}</div>
            </div>

            <div className="pt-2 border-t border-slate-700">
              <button
                onClick={() => {
                  const roman = urduToRoman(text);
                  setRomanInput(roman);
                  setTransliteratedOutput(text);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded font-medium"
              >
                موجودہ اردو متن کو رومن میں تبدیل کریں
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Normalization */}
        {activeTab === 'normalize' && (
          <div className="space-y-4">
            <div className="p-2 bg-slate-800 rounded border border-slate-700 text-slate-300">
              غیر نقصان دہ نرمائلائزیشن عربی/فارسی کاف (ك) اور یاء (ي) کو معياری اردو (ک/ی) میں تبدیل کرتی ہے۔
            </div>

            {normPreview.replacementCount > 0 ? (
              <div className="space-y-3">
                <div className="text-amber-400 font-medium">
                  {normPreview.replacementCount} حروف کی تبدیلی کے امکانات ملے:
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] max-h-40 overflow-y-auto space-y-1">
                  {normPreview.segments.map((seg, i) =>
                    seg.type === 'replaced' ? (
                      <div key={i} className="text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded">
                        <span className="line-through text-rose-400">{seg.originalText}</span> ➔{' '}
                        <span className="font-bold text-emerald-400">{seg.normalizedText}</span> ({seg.reason})
                      </div>
                    ) : null,
                  )}
                </div>

                <button
                  onClick={() => {
                    const normalized = normPreview.normalizedText;
                    setText(normalized);
                    if (onApplyText) onApplyText(normalized);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded"
                >
                  نرمائلائزیشن کا اطلاق کریں ({normPreview.replacementCount} تبدیلیاں)
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded text-emerald-300 text-center">
                متن پہلے سے مکمل معیاری اردو پر مشتمل ہے۔
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
