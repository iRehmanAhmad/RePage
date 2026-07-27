import React from 'react';
import type { PageObject, RePageDocument } from '../../domain/document/types';
import type { UiLanguage } from '../i18n/menuTranslation';
import { AppIcon, type AppIconName } from '../icons/AppIcon';

export interface SelectionPaneProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  activePageId: string;
  selectedObjectId: string | null;
  onSelectObject: (objectId: string | null) => void;
  onToggleVisibility: (objectId: string) => void;
  onToggleLock: (objectId: string) => void;
  onReorderObject: (objectId: string, action: 'forward' | 'backward' | 'front' | 'back') => void;
  lang?: UiLanguage;
  width?: number | undefined;
  onWidthChange?: ((width: number) => void) | undefined;
}

export function SelectionPane({
  isOpen,
  onClose,
  document,
  activePageId,
  selectedObjectId,
  onSelectObject,
  onToggleVisibility,
  onToggleLock,
  onReorderObject,
  lang = 'en',
  width = 260,
  onWidthChange,
}: SelectionPaneProps) {
  if (!isOpen) return null;

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(180, Math.min(480, startWidth + deltaX));
      onWidthChange?.(newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const page = document.pages[activePageId];
  if (!page) return null;

  const objectsOnPage = page.objectOrder
    .slice()
    .reverse() // Top layer first
    .map((id) => document.objects[id])
    .filter(Boolean) as PageObject[];

  const getObjectIcon = (type: string): AppIconName => {
    switch (type) {
      case 'text-frame':
        return 'text-add';
      case 'rectangle':
        return 'square';
      case 'image-frame':
        return 'image';
      case 'table':
        return 'table';
      default:
        return 'document';
    }
  };

  return (
    <aside
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        backgroundColor: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: '#f8fafc',
        fontSize: '12px',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Right Resizer Drag Handle */}
      <div
        onMouseDown={handleMouseDownResize}
        title="Drag to resize Selection Pane width"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '5px',
          cursor: 'col-resize',
          zIndex: 25,
          backgroundColor: 'transparent',
        }}
      />

      {/* Pane Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600,
          backgroundColor: '#1e293b',
        }}
      >
        <span>{lang === 'ur' ? 'انتخابی پینل (Selection Pane)' : 'Selection & Layers'}</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          <AppIcon name="dismiss" />
        </button>
      </div>

      {/* Reorder Action Toolbar */}
      {selectedObjectId && (
        <div
          style={{
            padding: '6px 10px',
            borderBottom: '1px solid #334155',
            backgroundColor: '#0284c7',
            display: 'flex',
            justifyContent: 'space-around',
          }}
        >
          <button
            type="button"
            onClick={() => onReorderObject(selectedObjectId, 'front')}
            title="Bring to Front"
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <AppIcon name="arrow-up" />
          </button>
          <button
            type="button"
            onClick={() => onReorderObject(selectedObjectId, 'forward')}
            title="Bring Forward"
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <AppIcon name="arrow-up" />
          </button>
          <button
            type="button"
            onClick={() => onReorderObject(selectedObjectId, 'backward')}
            title="Send Backward"
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <AppIcon name="arrow-down" />
          </button>
          <button
            type="button"
            onClick={() => onReorderObject(selectedObjectId, 'back')}
            title="Send to Back"
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <AppIcon name="arrow-down" />
          </button>
        </div>
      )}

      {/* Object Layers List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {objectsOnPage.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>
            {lang === 'ur' ? 'اس صفحہ پر کوئی عنصر نہیں' : 'No inserted objects on this page'}
          </div>
        ) : (
          objectsOnPage.map((obj) => {
            const isSelected = obj.id === selectedObjectId;
            return (
              <div
                key={obj.id}
                onClick={() => onSelectObject(obj.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? '#1e3a8a' : '#1e293b',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid transparent',
                  marginBottom: '6px',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name={getObjectIcon(obj.type)} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {obj.name || obj.id}
                </span>

                {/* Eye Visibility Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(obj.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: obj.hidden ? '#64748b' : '#38bdf8',
                    cursor: 'pointer',
                  }}
                  title={obj.hidden ? 'Show Object' : 'Hide Object'}
                >
                  <AppIcon name={obj.hidden ? 'eye-off' : 'eye'} />
                </button>

                {/* Lock Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(obj.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: obj.locked ? '#f43f5e' : '#64748b',
                    cursor: 'pointer',
                  }}
                  title={obj.locked ? 'Unlock Object' : 'Lock Object'}
                >
                  <AppIcon name={obj.locked ? 'lock' : 'unlock'} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
