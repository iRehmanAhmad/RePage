import React, { useEffect, useState } from 'react';

interface DragAndDropOverlayProps {
  onFileDrop: (file: File) => void;
}

export function DragAndDropOverlay({ onFileDrop }: DragAndDropOverlayProps) {
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
      if (file && (file.name.endsWith('.urdup') || file.type.includes('zip'))) {
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

  if (!isDraggingOver) return null;

  return (
    <div
      aria-label="Drop file overlay"
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
        border: '4px dashed #3b82f6',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
      <h2 style={{ margin: 0, fontSize: '24px', fontFamily: 'Noto Nastaliq Urdu, sans-serif' }}>
        دستاویز یہاں ڈراپ کریں (.urdup)
      </h2>
      <p style={{ margin: '8px 0 0', opacity: 0.8 }}>Drop `.urdup` package to open</p>
    </div>
  );
}
