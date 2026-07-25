import React from 'react';
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
  if (!isOpen) return null;

  const result = substituteDocumentCharacters(document);
  const isUr = lang === 'ur';

  const handleApplyFixes = () => {
    onCommitDocument(result.doc, 'Character & Punctuation Substitution');
    onClose();
  };

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
          width: '420px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '8px',
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
            {isUr ? 'عربی/اردو حروف اور علامات کی اصلاح' : 'Character & Punctuation Correction'}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.5 }}>
            {isUr
              ? 'یہ ٹول دستاویز میں غیر معیاری عربی حروف (ك، ي، ه) کو اردو کے معیاری حروف (ک، ی، ہ) اور انگریزی علاماتِ اوقاف (؟، ،) سے بدلتا ہے۔'
              : 'This tool replaces non-standard Arabic characters (ك, ي, ه) with native Urdu characters (ک, ی, ہ) and corrects punctuation marks.'}
          </p>

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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{isUr ? 'عربی حروف کی اصلاحات:' : 'Arabic letter replacements:'}</span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>{result.arabicReplacements}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{isUr ? 'علاماتِ اوقاف کی اصلاحات:' : 'Punctuation corrections:'}</span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>{result.punctuationReplacements}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleApplyFixes}
            disabled={result.arabicReplacements === 0 && result.punctuationReplacements === 0}
            style={{
              backgroundColor:
                result.arabicReplacements > 0 || result.punctuationReplacements > 0
                  ? '#10b981'
                  : '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor:
                result.arabicReplacements > 0 || result.punctuationReplacements > 0
                  ? 'pointer'
                  : 'not-allowed',
            }}
          >
            {isUr ? 'اصلاحات لاگو کریں' : 'Apply Corrections'}
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
