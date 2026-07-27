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
    <div
      style={{
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        color: '#f8fafc',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        width: '520px',
        maxWidth: '92vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'inherit',
        direction: 'rtl',
        zIndex: 1050,
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#34d399',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🌐</span> اردو زبان کے آلات (Language Tools)
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              color: '#94a3b8',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ✕ بند کریں
          </button>
        )}
      </div>

      {/* Scope Selector & Finding Summary Bar */}
      <div
        style={{
          padding: '10px 16px',
          backgroundColor: '#020617',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>دائرہ کار (Scope):</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: hasSelection ? 'pointer' : 'not-allowed', opacity: hasSelection ? 1 : 0.4 }}>
              <input
                type="radio"
                name="languageScope"
                value="selection"
                disabled={!hasSelection}
                checked={scopeKind === 'selection'}
                onChange={() => setScopeKind('selection')}
                style={{ accentColor: '#10b981' }}
              />
              <span>انتخاب ({activeSelection ? activeSelection.selectedText.length : 0})</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="languageScope"
                value="story"
                checked={scopeKind === 'story'}
                onChange={() => setScopeKind('story')}
                style={{ accentColor: '#10b981' }}
              />
              <span>موجودہ تحریر</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="languageScope"
                value="document"
                checked={scopeKind === 'document'}
                onChange={() => setScopeKind('document')}
                style={{ accentColor: '#10b981' }}
              />
              <span>مکمل دستاویز</span>
            </label>
          </div>
        </div>

        {/* Structured Summary Badges */}
        <div style={{ display: 'flex', gap: '6px', paddingTop: '6px', borderTop: '1px solid #1e293b', fontSize: '11px', direction: 'rtl' }}>
          <span style={{ padding: '2px 8px', backgroundColor: '#450a0a', border: '1px solid #991b1b', color: '#fca5a5', borderRadius: '4px', fontWeight: 600 }}>
            املاء: {spellingErrors.length}
          </span>
          <span style={{ padding: '2px 8px', backgroundColor: '#451a03', border: '1px solid #854d0e', color: '#fde047', borderRadius: '4px', fontWeight: 600 }}>
            رموزِ اوقاف: {punctuationCount}
          </span>
          <span style={{ padding: '2px 8px', backgroundColor: '#172554', border: '1px solid #1e40af', color: '#93c5fd', borderRadius: '4px', fontWeight: 600 }}>
            حروفی متبادلات: {normPreview.replacementCount}
          </span>
          <span style={{ padding: '2px 8px', backgroundColor: '#3b0764', border: '1px solid #7e22ce', color: '#e9d5ff', borderRadius: '4px', fontWeight: 600 }}>
            سپیس: {spaceCount}
          </span>
        </div>
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid #334155', fontSize: '12px', backgroundColor: '#0f172a' }} role="tablist" aria-label="Language Tools Tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'proofread'}
          aria-controls="panel-proofread"
          onClick={() => setActiveTab('proofread')}
          style={{
            flex: 1,
            padding: '10px 6px',
            fontWeight: 600,
            border: 'none',
            borderBottom: '2px solid ' + (activeTab === 'proofread' ? '#10b981' : 'transparent'),
            backgroundColor: activeTab === 'proofread' ? '#1e293b' : 'transparent',
            color: activeTab === 'proofread' ? '#34d399' : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          املاء و تصحیح ({spellingErrors.length + proofreadIssues.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'dictionary'}
          aria-controls="panel-dictionary"
          onClick={() => setActiveTab('dictionary')}
          style={{
            flex: 1,
            padding: '10px 6px',
            fontWeight: 600,
            border: 'none',
            borderBottom: '2px solid ' + (activeTab === 'dictionary' ? '#10b981' : 'transparent'),
            backgroundColor: activeTab === 'dictionary' ? '#1e293b' : 'transparent',
            color: activeTab === 'dictionary' ? '#34d399' : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          لغت (Dictionary)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'transliterate'}
          aria-controls="panel-transliterate"
          onClick={() => setActiveTab('transliterate')}
          style={{
            flex: 1,
            padding: '10px 6px',
            fontWeight: 600,
            border: 'none',
            borderBottom: '2px solid ' + (activeTab === 'transliterate' ? '#10b981' : 'transparent'),
            backgroundColor: activeTab === 'transliterate' ? '#1e293b' : 'transparent',
            color: activeTab === 'transliterate' ? '#34d399' : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          رومن اردو
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'normalize'}
          aria-controls="panel-normalize"
          onClick={() => setActiveTab('normalize')}
          style={{
            flex: 1,
            padding: '10px 6px',
            fontWeight: 600,
            border: 'none',
            borderBottom: '2px solid ' + (activeTab === 'normalize' ? '#10b981' : 'transparent'),
            backgroundColor: activeTab === 'normalize' ? '#1e293b' : 'transparent',
            color: activeTab === 'normalize' ? '#34d399' : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          حروف کی جانچ ({normPreview.replacementCount})
        </button>
      </div>

      {/* Content Body */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px', direction: 'rtl' }}>
        {/* Tab 1: Proofread & Spelling */}
        {activeTab === 'proofread' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '10px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#cbd5e1' }}>
              مطلوبہ دائرہ کار کا متن ({concatenatedText.length} حروف):
              <div style={{ marginTop: '6px', padding: '8px 12px', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '6px', fontSize: '13px', color: '#34d399', maxHeight: '96px', overflowY: 'auto', direction: 'rtl' }}>
                {concatenatedText || 'کوئی متن منتخب نہیں ہے۔'}
              </div>
            </div>

            {spellingErrors.length === 0 && proofreadIssues.length === 0 ? (
              <div style={{ padding: '12px', backgroundColor: '#064e3b', border: '1px solid #065f46', borderRadius: '8px', color: '#6ee7b7', textAlign: 'center' }}>
                ✨ اس دائرہ کار میں املاء اور زبان کی کوئی غلطی نہیں ملی!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontWeight: 600, color: '#f8fafc', margin: 0 }}>نشاندہیاں:</h4>
                {spellingErrors.map((err, idx) => (
                  <div key={`spell-${idx}`} style={{ padding: '12px', backgroundColor: '#450a0a', border: '1px solid #991b1b', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#fca5a5' }}>
                      <span>املاء کی غلطی: "{err.word}"</span>
                    </div>

                    {/* Per-finding actions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '6px', borderTop: '1px solid #7f1d1d', fontSize: '11px' }}>
                      <button
                        type="button"
                        onClick={() => handleIgnoreOnce(err.index + idx)}
                        style={{ padding: '4px 8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ایک بار نظر انداز
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIgnoreAll(err.word)}
                        style={{ padding: '4px 8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        دستاویز میں نظر انداز
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddWordToPersonalDict(err.word)}
                        style={{ padding: '4px 8px', backgroundColor: '#064e3b', border: '1px solid #047857', color: '#6ee7b7', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        + لغت میں شامل کریں
                      </button>
                    </div>

                    {err.suggestions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ color: '#cbd5e1' }}>تجویز:</span>
                        {err.suggestions.map((sug, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => handleApplySingleReplacement(err.word, sug, `Spellcheck fix: ${err.word} -> ${sug}`, 'spelling')}
                            style={{ padding: '4px 8px', backgroundColor: '#047857', border: '1px solid #059669', color: '#ffffff', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {proofreadIssues.map((issue, idx) => (
                  <div key={`proof-${idx}`} style={{ padding: '10px 12px', backgroundColor: '#451a03', border: '1px solid #854d0e', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ color: '#fde047', fontWeight: 600 }}>{issue.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f8fafc' }}>
                      <span>اصل: <code style={{ color: '#fca5a5' }}>{issue.originalSnippet}</code></span>
                      <button
                        type="button"
                        onClick={() => handleApplySingleReplacement(issue.originalSnippet, issue.replacementSuggestion, issue.description, 'proofread')}
                        style={{ padding: '4px 10px', backgroundColor: '#d97706', border: '1px solid #f59e0b', color: '#ffffff', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={dictQuery}
                onChange={(e) => setDictQuery(e.target.value)}
                placeholder="لفظ تلاش کریں (مثلاً: پاکستان، علم، ترانہ)..."
                style={{ flex: 1, padding: '8px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setDictResult(lookupUrduWord(dictQuery))}
                style={{ padding: '8px 16px', backgroundColor: '#059669', border: '1px solid #10b981', color: '#ffffff', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
              >
                تلاش
              </button>
            </div>

            {dictResult ? (
              <div style={{ padding: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>{dictResult.word}</div>
                  <button
                    type="button"
                    onClick={() => handleAddWordToPersonalDict(dictResult.word)}
                    style={{ padding: '4px 8px', backgroundColor: '#064e3b', border: '1px solid #047857', color: '#6ee7b7', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    + ذاتی لغت میں شامل
                  </button>
                </div>
                {dictResult.grammaticalCategory && (
                  <span style={{ display: 'inline-block', padding: '2px 6px', backgroundColor: '#334155', color: '#cbd5e1', borderRadius: '4px', fontSize: '10px', width: 'fit-content' }}>
                    {dictResult.grammaticalCategory}
                  </span>
                )}
                <div style={{ color: '#f8fafc', marginTop: '4px' }}>{dictResult.definition}</div>

                {dictResult.synonyms && dictResult.synonyms.length > 0 && (
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #334155', fontSize: '11px', color: '#6ee7b7' }}>
                    <span style={{ color: '#94a3b8' }}>مترادفات (Synonyms): </span>
                    {dictResult.synonyms.join('، ')}
                  </div>
                )}
                {dictResult.antonyms && dictResult.antonyms.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#fde047' }}>
                    <span style={{ color: '#94a3b8' }}>متضادات (Antonyms): </span>
                    {dictResult.antonyms.join('، ')}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>لغت میں لفظ تلاش کرنے کے لیے اوپر ٹائپ کریں۔</div>
                {personalWords.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#64748b', paddingTop: '8px', borderTop: '1px solid #1e293b' }}>
                    ذاتی لغت کے جملہ الفاظ ({personalWords.length}): {personalWords.slice(0, 5).join('، ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Transliteration */}
        {activeTab === 'transliterate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>رومن اردو درج کریں (Roman Input):</label>
              <input
                type="text"
                value={romanInput}
                onChange={(e) => {
                  setRomanInput(e.target.value);
                  setTransliteratedOutput(romanToUrdu(e.target.value));
                }}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', outline: 'none', direction: 'ltr', textAlign: 'left' }}
                placeholder="e.g. shukriya pakistan..."
              />
            </div>

            {transliteratedOutput && (
              <div style={{ padding: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '11px', fontWeight: 600 }}>اردو نستعلیق پیش نظارہ (Nastaliq Output):</label>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#34d399', direction: 'rtl' }}>{transliteratedOutput}</div>
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
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    border: '1px solid ' + (hasSelection && scopeKind === 'selection' ? '#10b981' : '#334155'),
                    backgroundColor: hasSelection && scopeKind === 'selection' ? '#059669' : '#1e293b',
                    color: hasSelection && scopeKind === 'selection' ? '#ffffff' : '#64748b',
                    cursor: hasSelection && scopeKind === 'selection' ? 'pointer' : 'not-allowed',
                  }}
                >
                  منتخب متن کو اس تبدیل شدہ اردو سے بدلیں
                </button>
              </div>
            )}

            <div style={{ paddingTop: '8px', borderTop: '1px solid #334155' }}>
              <button
                type="button"
                onClick={() => {
                  const roman = urduToRoman(concatenatedText);
                  setRomanInput(roman);
                  setTransliteratedOutput(concatenatedText);
                }}
                style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                موجودہ دائرہ کار کے اردو متن کو رومن میں لائیں
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Character Normalization / Review */}
        {activeTab === 'normalize' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '10px 12px', backgroundColor: '#1e293b', borderRadius: '6px', border: '1px solid #334155', color: '#cbd5e1' }}>
              اردو کریکٹر ریویو: غیر نقصان دہ تبدیلی کے ساتھ عربی کاف (ك) اور یاء (ي) کو معیاری اردو (ک/ی) میں لاتی ہے۔
            </div>

            {normPreview.replacementCount > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ color: '#fde047', fontWeight: 600 }}>
                  {normPreview.replacementCount} حروف کی تبدیلی کے امکانات ملے:
                </div>
                <div style={{ padding: '8px', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '6px', fontSize: '11px', maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {normPreview.segments.map((seg, i) =>
                    seg.type === 'replaced' && seg.originalText && seg.normalizedText ? (
                      <div key={i} style={{ color: '#fde047', backgroundColor: '#451a03', padding: '6px 10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <span style={{ textDecoration: 'line-through', color: '#fca5a5' }}>{seg.originalText}</span> ➔{' '}
                          <span style={{ fontWeight: 700, color: '#34d399' }}>{seg.normalizedText}</span> ({seg.reason})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplySingleReplacement(seg.originalText!, seg.normalizedText!, seg.reason || 'Normalization', 'normalization')}
                          style={{ padding: '3px 8px', backgroundColor: '#d97706', border: '1px solid #f59e0b', color: '#ffffff', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}
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
                  style={{ width: '100%', padding: '10px', backgroundColor: '#059669', border: '1px solid #10b981', color: '#ffffff', fontWeight: 700, borderRadius: '6px', cursor: 'pointer' }}
                >
                  تمام کا اطلاق کریں ({normPreview.replacementCount} تبدیلیاں)
                </button>
              </div>
            ) : (
              <div style={{ padding: '12px', backgroundColor: '#064e3b', border: '1px solid #065f46', borderRadius: '8px', color: '#6ee7b7', textAlign: 'center' }}>
                اس دائرہ کار کا متن پہلے سے مکمل معیاری اردو پر مشتمل ہے۔
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
