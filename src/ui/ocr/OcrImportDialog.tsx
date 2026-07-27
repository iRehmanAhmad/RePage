import React, { useState, useRef } from 'react';
import type { UiLanguage } from '../i18n/menuTranslation';
import { validateOcrInputFile, type OcrPageResult } from '../../domain/ocr/ocrEngine';
import { getConfiguredOcrProvider, getOcrProvider } from '../../domain/ocr/ocrProvider';

export interface OcrImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRecognitionComplete: (result: OcrPageResult, fileBuffer: ArrayBuffer, fileName: string) => void;
  lang: UiLanguage;
}

export function OcrImportDialog({
  isOpen,
  onClose,
  onRecognitionComplete,
  lang,
}: OcrImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<'urd' | 'eng' | 'auto'>('urd');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isUr = lang === 'ur';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateOcrInputFile(file.name, file.size);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid file');
      setSelectedFile(null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
  };

  const handleStartOcr = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      // Use real provider if available, fall back to mock for demo purposes
      const configured = getConfiguredOcrProvider();
      const provider = configured.isAvailable
        ? configured
        : getOcrProvider('mock');

      const result = await provider.recognize({
        buffer,
        fileName: selectedFile.name,
      }, {
        language: ocrLanguage,
      });

      setIsProcessing(false);
      onRecognitionComplete(result, buffer, selectedFile.name);
      onClose();
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : 'OCR Failed';
      setErrorMessage(msg);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
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
            📷 {isUr ? 'اردو تصویری متن شناسی (OCR Import)' : 'Urdu Image OCR Import'}
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

        {/* Preview Mode Banner — shown when no real OCR engine is configured */}
        {!getConfiguredOcrProvider().isAvailable && (
          <div
            style={{
              backgroundColor: '#422006',
              border: '1px solid #92400e',
              color: '#fbbf24',
              padding: '8px 12px',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            ⚠️ {isUr
              ? 'پیش نظارہ/ڈیمو — کوئی حقیقی OCR انجن ترتیب نہیں ہے۔ نتائج فرضی ہیں۔'
              : 'Preview/Demo Mode — No real OCR engine configured. Results are simulated.'}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              backgroundColor: '#450a0a',
              border: '1px solid #991b1b',
              color: '#fca5a5',
              padding: '8px 12px',
              borderRadius: '6px',
              marginBottom: '12px',
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* File Selection Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #334155',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: '16px',
            backgroundColor: '#020617',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>📄</span>
          {selectedFile ? (
            <span style={{ fontWeight: 700, color: '#10b981' }}>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          ) : (
            <span style={{ color: '#94a3b8' }}>
              {isUr ? 'تصویری یا سکین شدہ PDF فائل منتخب کرنے کے لیے یہاں کلک کریں (PNG, JPEG, WebP, PDF)' : 'Click to select scanned image or PDF file (PNG, JPEG, WebP, PDF)'}
            </span>
          )}
        </div>

        {/* OCR Language Selector */}
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '10px 12px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#94a3b8' }}>{isUr ? 'زبان (OCR Language):' : 'Language:'}</span>
          <select
            value={ocrLanguage}
            onChange={(e) => setOcrLanguage(e.target.value as 'urd' | 'eng' | 'auto')}
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              outline: 'none',
            }}
          >
            <option value="urd">Urdu Nastaliq (اردو)</option>
            <option value="eng">English (انگریزی)</option>
            <option value="auto">Auto-detect Mixed (اردو + English)</option>
          </select>
        </div>

        {/* Dialog Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleStartOcr}
            disabled={!selectedFile || isProcessing}
            style={{
              backgroundColor: selectedFile && !isProcessing ? '#10b981' : '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: selectedFile && !isProcessing ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isProcessing ? (
              <>
                <span>⏳</span>
                <span>{isUr ? 'پروسیسنگ...' : 'Processing OCR...'}</span>
              </>
            ) : (
              <span>{isUr ? 'متن شناسی شروع کریں' : 'Start OCR Recognition'}</span>
            )}
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
            {isUr ? 'منسوخ کریں' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
