import React, { useState, useMemo } from 'react';
import type { RePageDocument } from '../../domain/document/types';
import { getScopeSpans } from '../../domain/language/languageToolScope';
import type { LanguageChange, LanguageToolScope } from '../../domain/language/types';
import { checkUrduText } from '../../domain/language/urduSpellchecker';
import { lookupUrduWord } from '../../domain/language/urduDictionary';
import { addPersonalWord, isPersonalWord, loadPersonalDictionary } from '../../domain/language/personalDictionary';
import { proofreadUrduText } from '../../domain/language/urduProofreader';
import { romanToUrdu, urduToRoman } from '../../domain/language/transliteration';
import { previewNormalization } from '../../domain/language/characterNormalization';

export interface SelectionInfo {
  storyId: string;
  from: number;
  to: number;
  selectedText: string;
}

export interface LanguageToolsPanelProps {
  document: RePageDocument;
  activeSelection?: SelectionInfo | null | undefined;
  initialTab?: 'proofread' | 'dictionary' | 'transliterate' | 'normalize' | 'spelling' | undefined;
  onApplyChanges?: (changes: LanguageChange[]) => void;
  onClose?: () => void;
}

export const LanguageToolsPanel: React.FC<LanguageToolsPanelProps> = ({
  document,
  activeSelection,
  initialTab = 'proofread',
  onApplyChanges,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'proofread' | 'dictionary' | 'transliterate' | 'normalize'>(
    initialTab === 'dictionary'
      ? 'dictionary'
      : initialTab === 'transliterate'
        ? 'transliterate'
        : initialTab === 'normalize'
          ? 'normalize'
          : 'proofread',
  );

  const hasSelection = Boolean(activeSelection && activeSelection.selectedText.trim().length > 0);
  const [scopeKind, setScopeKind] = useState<'selection' | 'story' | 'document'>(
    hasSelection ? 'selection' : 'story',
  );

  const activeStoryId = activeSelection?.storyId || 'primary-body-story';

  const currentScope: LanguageToolScope = useMemo(() => {
    if (scopeKind === 'selection' && hasSelection && activeSelection) {
      return {
        kind: 'selection',
        storyId: activeSelection.storyId,
        from: activeSelection.from,
        to: activeSelection.to,
      };
    }
    if (scopeKind === 'story') {
      return { kind: 'story', storyId: activeStoryId };
    }
    return { kind: 'document' };
  }, [scopeKind, hasSelection, activeSelection, activeStoryId]);

  // Extract spans for active scope
  const targetSpans = useMemo(() => getScopeSpans(document, currentScope), [document, currentScope]);

  const concatenatedText = useMemo(
    () => targetSpans.map((s) => s.text).join('\n'),
    [targetSpans],
  );

  // Ignored finding tokens for current session
  const [ignoredTokens, setIgnoredTokens] = useState<Set<string>>(new Set());
  const [ignoredOnceIndices, setIgnoredOnceIndices] = useState<Set<number>>(new Set());

  // Personal Dictionary State
  const [personalWords, setPersonalWords] = useState<string[]>(() => loadPersonalDictionary());

  // Dictionary Tab State
  const [dictQuery, setDictQuery] = useState('');
  const [dictResult, setDictResult] = useState<ReturnType<typeof lookupUrduWord>>(null);

  // Transliteration Tab State
  const [romanInput, setRomanInput] = useState('');
  const [transliteratedOutput, setTransliteratedOutput] = useState('');

  // Proofread & Analysis Results on real document text
  const rawSpellingErrors = useMemo(() => checkUrduText(concatenatedText), [concatenatedText]);
  const proofreadIssues = useMemo(() => proofreadUrduText(concatenatedText), [concatenatedText]);
  const normPreview = useMemo(() => previewNormalization(concatenatedText), [concatenatedText]);

  // Filter out ignored words
  const spellingErrors = useMemo(
    () =>
      rawSpellingErrors.filter(
        (err, idx) =>
          !ignoredTokens.has(err.word) &&
          !ignoredOnceIndices.has(err.index + idx) &&
          !isPersonalWord(err.word),
      ),
    [rawSpellingErrors, ignoredTokens, ignoredOnceIndices],
  );

  // Structured Finding Summary Counts
  const punctuationCount = useMemo(
    () => proofreadIssues.filter((i) => i.description.includes('رموز') || i.description.includes('وقف')).length,
    [proofreadIssues],
  );
  const spaceCount = useMemo(
    () => proofreadIssues.filter((i) => i.description.includes('سپیس') || i.description.includes('فاصلہ')).length,
    [proofreadIssues],
  );

  const handleAddWordToPersonalDict = (word: string) => {
    const next = addPersonalWord(word);
    setPersonalWords([...next]);
  };

  const handleIgnoreOnce = (errIndex: number) => {
    setIgnoredOnceIndices((prev) => new Set([...prev, errIndex]));
  };

  const handleIgnoreAll = (word: string) => {
    setIgnoredTokens((prev) => new Set([...prev, word]));
  };

  // Helper to build LanguageChange objects relative to exact document stories
  const handleApplySingleReplacement = (
    originalText: string,
    replacement: string,
    reason: string,
    category: LanguageChange['category'],
  ) => {
    if (!onApplyChanges) return;

    const changes: LanguageChange[] = [];

    for (const span of targetSpans) {
      let searchOffset = 0;
      while (searchOffset < span.fullText.length) {
        const foundIdx = span.fullText.indexOf(originalText, searchOffset);
        if (foundIdx === -1) break;

        // Check if found index is within scope bounds
        if (foundIdx >= span.scopeFrom && foundIdx + originalText.length <= span.scopeTo) {
          changes.push({
            id: `change_${Date.now()}_${Math.random()}`,
            storyId: span.storyId,
            from: foundIdx,
            to: foundIdx + originalText.length,
            replacement,
            reason,
            category,
            originalText,
          });

          // If selection scope, apply first match in selection
          if (scopeKind === 'selection') break;
        }
        searchOffset = foundIdx + Math.max(1, originalText.length);
      }

      if (scopeKind === 'selection' && changes.length > 0) break;
    }

    if (changes.length > 0) {
      onApplyChanges(changes);
    }
  };

  const handleApplyAllNormalizations = () => {
    if (!onApplyChanges || normPreview.replacementCount === 0) return;

    const changes: LanguageChange[] = [];

    for (const span of targetSpans) {
      let charIdx = 0;
      const text = span.text;

      for (let i = 0; i < text.length; i++) {
        const char = text[i]!;
        if (char === 'ك') {
          const absoluteIdx = span.scopeFrom + charIdx;
          changes.push({
            id: `norm_${Date.now()}_${i}`,
            storyId: span.storyId,
            from: absoluteIdx,
            to: absoluteIdx + 1,
            replacement: 'ک',
            reason: 'Arabic Kaaf to Urdu',
            category: 'normalization',
            originalText: 'ك',
          });
        } else if (char === 'ي') {
          const absoluteIdx = span.scopeFrom + charIdx;
          changes.push({
            id: `norm_${Date.now()}_${i}`,
            storyId: span.storyId,
            from: absoluteIdx,
            to: absoluteIdx + 1,
            replacement: 'ی',
            reason: 'Arabic Yaa to Urdu',
            category: 'normalization',
            originalText: 'ي',
          });
        }
        charIdx++;
      }
    }

    if (changes.length > 0) {
      onApplyChanges(changes);
    }
  };

  return (
    <div className="fixed inset-y-12 right-6 w-[470px] bg-slate-900 text-slate-100 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden font-sans">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <span>🌐</span> اردو زبان کے آلات (Language Tools)
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-700/50"
          >
            ✕ بند کریں
          </button>
        )}
      </div>

      {/* Scope Selector & Finding Summary Bar */}
      <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">دائرہ کار (Scope):</span>
          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-1 cursor-pointer ${!hasSelection ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <input
                type="radio"
                name="languageScope"
                value="selection"
                disabled={!hasSelection}
                checked={scopeKind === 'selection'}
                onChange={() => setScopeKind('selection')}
                className="accent-emerald-500"
              />
              <span>انتخاب ({activeSelection ? activeSelection.selectedText.length : 0})</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="languageScope"
                value="story"
                checked={scopeKind === 'story'}
                onChange={() => setScopeKind('story')}
                className="accent-emerald-500"
              />
              <span>موجودہ تحریر</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="languageScope"
                value="document"
                checked={scopeKind === 'document'}
                onChange={() => setScopeKind('document')}
                className="accent-emerald-500"
              />
              <span>مکمل دستاویز</span>
            </label>
          </div>
        </div>

        {/* Structured Summary Badges */}
        <div className="flex gap-2 pt-1 border-t border-slate-800/60 text-[11px] dir-rtl">
          <span className="px-2 py-0.5 bg-rose-950/60 border border-rose-900/60 text-rose-300 rounded font-medium">
            املاء: {spellingErrors.length}
          </span>
          <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-900/60 text-amber-300 rounded font-medium">
            رموزِ اوقاف: {punctuationCount}
          </span>
          <span className="px-2 py-0.5 bg-blue-950/60 border border-blue-900/60 text-blue-300 rounded font-medium">
            حروفی متبادلات: {normPreview.replacementCount}
          </span>
          <span className="px-2 py-0.5 bg-purple-950/60 border border-purple-900/60 text-purple-300 rounded font-medium">
            سپیس: {spaceCount}
          </span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-700 text-xs bg-slate-900/80" role="tablist" aria-label="Language Tools Tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'proofread'}
          aria-controls="panel-proofread"
          onClick={() => setActiveTab('proofread')}
          className={`flex-1 py-2 font-medium border-b-2 ${
            activeTab === 'proofread' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          املاء و تصحیح ({spellingErrors.length + proofreadIssues.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'dictionary'}
          aria-controls="panel-dictionary"
          onClick={() => setActiveTab('dictionary')}
          className={`flex-1 py-2 font-medium border-b-2 ${
            activeTab === 'dictionary' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          لغت (Dictionary)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'transliterate'}
          aria-controls="panel-transliterate"
          onClick={() => setActiveTab('transliterate')}
          className={`flex-1 py-2 font-medium border-b-2 ${
            activeTab === 'transliterate' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          رومن اردو
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'normalize'}
          aria-controls="panel-normalize"
          onClick={() => setActiveTab('normalize')}
          className={`flex-1 py-2 font-medium border-b-2 ${
            activeTab === 'normalize' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          حروف کی جانچ ({normPreview.replacementCount})
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs dir-rtl">
        {/* Tab 1: Proofread & Spelling */}
        {activeTab === 'proofread' && (
          <div className="space-y-4">
            <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded text-slate-300">
              مطلوبہ دائرہ کار کا متن ({concatenatedText.length} حروف):
              <div className="mt-1 p-2 bg-slate-950 border border-slate-800 rounded font-serif text-sm text-emerald-300 max-h-24 overflow-y-auto dir-rtl">
                {concatenatedText || 'کوئی متن منتخب نہیں ہے۔'}
              </div>
            </div>

            {spellingErrors.length === 0 && proofreadIssues.length === 0 ? (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded text-emerald-300 text-center">
                ✨ اس دائرہ کار میں املاء اور زبان کی کوئی غلطی نہیں ملی!
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-300">نشاندہیاں:</h4>
                {spellingErrors.map((err, idx) => (
                  <div key={`spell-${idx}`} className="p-3 bg-rose-950/40 border border-rose-900/60 rounded space-y-2">
                    <div className="flex justify-between font-semibold text-rose-400">
                      <span>املاء کی غلطی: "{err.word}"</span>
                    </div>

                    {/* Per-finding actions */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-rose-900/40 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleIgnoreOnce(err.index + idx)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600"
                      >
                        ایک بار نظر انداز
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIgnoreAll(err.word)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600"
                      >
                        دستاویز میں نظر انداز
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddWordToPersonalDict(err.word)}
                        className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800 font-medium"
                      >
                        + لغت میں شامل کریں
                      </button>
                    </div>

                    {err.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center mt-1">
                        <span className="text-slate-400">تجویز:</span>
                        {err.suggestions.map((sug, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => handleApplySingleReplacement(err.word, sug, `Spellcheck fix: ${err.word} -> ${sug}`, 'spelling')}
                            className="px-2 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 rounded text-[11px]"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {proofreadIssues.map((issue, idx) => (
                  <div key={`proof-${idx}`} className="p-2.5 bg-amber-950/40 border border-amber-900/60 rounded space-y-1.5">
                    <div className="text-amber-400 font-medium">{issue.description}</div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>اصل: <code className="text-rose-300">{issue.originalSnippet}</code></span>
                      <button
                        type="button"
                        onClick={() => handleApplySingleReplacement(issue.originalSnippet, issue.replacementSuggestion, issue.description, 'proofread')}
                        className="px-2.5 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 rounded font-medium"
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
                placeholder="لفظ تلاش کریں (مثلاً: پاکستان، علم، ترانہ)..."
                className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setDictResult(lookupUrduWord(dictQuery))}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
              >
                تلاش
              </button>
            </div>

            {dictResult ? (
              <div className="p-3 bg-slate-800 border border-slate-700 rounded space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-base font-bold text-emerald-400">{dictResult.word}</div>
                  <button
                    type="button"
                    onClick={() => handleAddWordToPersonalDict(dictResult.word)}
                    className="px-2 py-1 bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 rounded text-[11px]"
                  >
                    + ذاتی لغت میں شامل
                  </button>
                </div>
                {dictResult.grammaticalCategory && (
                  <span className="inline-block px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px]">
                    {dictResult.grammaticalCategory}
                  </span>
                )}
                <div className="text-slate-200 mt-1">{dictResult.definition}</div>

                {dictResult.synonyms && dictResult.synonyms.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/60 text-[11px] text-emerald-300">
                    <span className="text-slate-400">مترادفات (Synonyms): </span>
                    {dictResult.synonyms.join('، ')}
                  </div>
                )}
                {dictResult.antonyms && dictResult.antonyms.length > 0 && (
                  <div className="text-[11px] text-amber-300">
                    <span className="text-slate-400">متضادات (Antonyms): </span>
                    {dictResult.antonyms.join('، ')}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-6 space-y-2">
                <div>لغت میں لفظ تلاش کرنے کے لیے اوپر ٹائپ کریں۔</div>
                {personalWords.length > 0 && (
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                    ذاتی لغت کے جملہ الفاظ ({personalWords.length}): {personalWords.slice(0, 5).join('، ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Transliteration */}
        {activeTab === 'transliterate' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-1">رومن اردو درج کریں (Roman Input):</label>
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

            {transliteratedOutput && (
              <div className="p-3 bg-slate-800 border border-slate-700 rounded space-y-2">
                <label className="block text-slate-400 text-[10px]">اردو نستعلیق پیش نظارہ (Nastaliq Output):</label>
                <div className="text-lg font-bold text-emerald-400 dir-rtl">{transliteratedOutput}</div>
                <button
                  type="button"
                  onClick={() => {
                    if (scopeKind === 'selection' && activeSelection) {
                      handleApplySingleReplacement(
                        activeSelection.selectedText,
                        transliteratedOutput,
                        'Roman Urdu transliteration',
                        'transliteration',
                      );
                    }
                  }}
                  disabled={!hasSelection || scopeKind !== 'selection'}
                  className={`w-full py-2 rounded font-bold ${
                    hasSelection && scopeKind === 'selection'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  منتخب متن کو اس تبدیل شدہ اردو سے بدلیں
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => {
                  const roman = urduToRoman(concatenatedText);
                  setRomanInput(roman);
                  setTransliteratedOutput(concatenatedText);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded font-medium"
              >
                موجودہ دائرہ کار کے اردو متن کو رومن میں لائیں
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Character Normalization / Review */}
        {activeTab === 'normalize' && (
          <div className="space-y-4">
            <div className="p-2.5 bg-slate-800 rounded border border-slate-700 text-slate-300">
              اردو کریکٹر ریویو: غیر نقصان دہ تبدیلی کے ساتھ عربی کاف (ك) اور یاء (ي) کو معیاری اردو (ک/ی) میں لاتی ہے۔
            </div>

            {normPreview.replacementCount > 0 ? (
              <div className="space-y-3">
                <div className="text-amber-400 font-medium">
                  {normPreview.replacementCount} حروف کی تبدیلی کے امکانات ملے:
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] max-h-40 overflow-y-auto space-y-1">
                  {normPreview.segments.map((seg, i) =>
                    seg.type === 'replaced' && seg.originalText && seg.normalizedText ? (
                      <div key={i} className="text-amber-300 bg-amber-950/60 px-2 py-1 rounded flex justify-between items-center">
                        <span>
                          <span className="line-through text-rose-400">{seg.originalText}</span> ➔{' '}
                          <span className="font-bold text-emerald-400">{seg.normalizedText}</span> ({seg.reason})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplySingleReplacement(seg.originalText!, seg.normalizedText!, seg.reason || 'Normalization', 'normalization')}
                          className="px-2 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 rounded text-[10px]"
                        >
                          تبدیل
                        </button>
                      </div>
                    ) : null,
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleApplyAllNormalizations}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded"
                >
                  تمام کا اطلاق کریں ({normPreview.replacementCount} تبدیلیاں)
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded text-emerald-300 text-center">
                اس دائرہ کار کا متن پہلے سے مکمل معیاری اردو پر مشتمل ہے۔
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
