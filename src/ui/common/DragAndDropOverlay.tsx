import React, { useEffect, useState } from 'react';
import { AppIcon } from '../icons/AppIcon';
import type { UiLanguage } from '../i18n/menuTranslation';

interface DragAndDropOverlayProps {
  onFileDrop: (file: File) => void;
  children?: React.ReactNode;
  lang?: UiLanguage;
}

export function DragAndDropOverlay({ onFileDrop, children, lang = 'ur' }: DragAndDropOverlayProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    function handleDragOver(e: DragEvent) {
      e.preventDefault();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDraggingOver(true);
      }
    }

    function handleDragLeave(e: DragEvent) {
      e.preventDefault();
      if (e.relatedTarget === null) {
        setIsDraggingOver(false);
      }
    }

    function handleDrop(e: DragEvent) {
      e.preventDefault();
      setIsDraggingOver(false);

      const file = e.dataTransfer?.files[0];
      if (file && (file.name.endsWith('.urdup') || file.type.includes('zip') || file.name.endsWith('.pdf') || file.name.endsWith('.docx'))) {
        onFileDrop(file);
      }
    }

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFileDrop]);

  return (
    <>
      {children}
      {isDraggingOver && (
        <div
          aria-label={lang === 'ur' ? 'فائل ڈراپ کریں' : 'Drop file overlay'}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            border: '4px dashed #10b981',
            pointerEvents: 'none',
          }}
        >
          <AppIcon name="document-add" size={48} style={{ marginBottom: '16px' }} />
          <h2 style={{ margin: 0, fontSize: '24px', fontFamily: 'Noto Nastaliq Urdu, sans-serif' }}>
            {lang === 'ur' ? 'دستاویز یہاں ڈراپ کریں (.urdup / .pdf / .docx)' : 'Drop your document here (.urdup / .pdf / .docx)'}
          </h2>
          <p style={{ margin: '8px 0 0', opacity: 0.8 }}>{lang === 'ur' ? 'ری پیج اسٹوڈیو میں کھولنے کے لیے پیکج یا فائل ڈراپ کریں' : 'Drop package or file to open in RePage Studio'}</p>
        </div>
      )}
    </>
  );
}
