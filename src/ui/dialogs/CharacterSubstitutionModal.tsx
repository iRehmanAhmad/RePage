import React, { useState } from 'react';
import type { RePageDocument } from '../../domain/document/types';
import { substituteDocumentCharacters } from '../../domain/language/characterSubstitutionEngine';
import type { UiLanguage } from '../i18n/menuTranslation';

export interface CharacterSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  onCommitDocument: (updatedDoc: RePageDocument, logMsg: string) => void;
  lang: UiLanguage;
}

export function CharacterSubstitutionModal({
  isOpen,
  onClose,
  document,
  onCommitDocument,
  lang,
}: CharacterSubstitutionModalProps) {
  const [scope, setScope] = useState<'document' | 'story'>('document');
  const [selectedFixes, setSelectedFixes] = useState<Record<string, boolean>>({
    arabicKaf: true,
    arabicYeh: true,
    tehMarbuta: true,
    punctuation: true,
  });

  if (!isOpen) return null;

  const result = substituteDocumentCharacters(document);
  const isUr = lang === 'ur';

  const handleApplyFixes = () => {
    onCommitDocument(result.doc, 'Character & Punctuation Substitution');
    onClose();
  };

  const totalFixes = (selectedFixes.arabicKaf || selectedFixes.arabicYeh || selectedFixes.tehMarbuta ? result.arabicReplacements : 0) +
    (selectedFixes.punctuation ? result.punctuationReplacements : 0);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: '460px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '20px',
          color: '#f8fafc',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', color: '#38bdf8', fontWeight: 700 }}>
            {isUr ? 'حروف اور علامات کی اصلاح (Character Correction)' : 'Character & Punctuation Correction'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scope Selector */}
        <div
          style={{
            backgroundColor: '#020617',
            padding: '8px 12px',
            borderRadius: '6px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#94a3b8' }}>{isUr ? 'دائرہ کار (Scope):' : 'Scope:'}</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="modalScope"
                value="document"
                checked={scope === 'document'}
                onChange={() => setScope('document')}
              />
              <span>{isUr ? 'مکمل دستاویز' : 'Whole Document'}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="modalScope"
                value="story"
                checked={scope === 'story'}
                onChange={() => setScope('story')}
              />
              <span>{isUr ? 'موجودہ تحریر' : 'Current Story'}</span>
            </label>
          </div>
        </div>

        {/* Per-Fix Checkbox Review List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '6px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={selectedFixes.arabicKaf}
                  onChange={(e) => setSelectedFixes((prev) => ({ ...prev, arabicKaf: e.target.checked }))}
                />
                <span>{isUr ? 'عربی کاف (ك ➔ ک) اور یاء (ي ➔ ی)' : 'Arabic Kaaf & Yaa (ك, ي ➔ ک, ی)'}</span>
              </span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>{result.arabicReplacements}</span>
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={selectedFixes.punctuation}
                  onChange={(e) => setSelectedFixes((prev) => ({ ...prev, punctuation: e.target.checked }))}
                />
                <span>{isUr ? 'اردو علاماتِ اوقاف (؟، ،)' : 'Urdu Punctuation (؟, ،)'}</span>
              </span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>{result.punctuationReplacements}</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleApplyFixes}
            disabled={totalFixes === 0}
            style={{
              backgroundColor: totalFixes > 0 ? '#10b981' : '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: totalFixes > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {isUr ? `اصلاحات لاگو کریں (${totalFixes})` : `Apply Fixes (${totalFixes})`}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isUr ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
