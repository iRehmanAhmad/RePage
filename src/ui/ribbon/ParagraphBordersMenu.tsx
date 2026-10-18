import React from 'react';
import { AppIcon } from '../icons/AppIcon';
import { DICTIONARY, type Translations } from '../i18n/menuTranslation';

export interface ParagraphBordersMenuProps {
  onSelectBorder: (side: 'bottom' | 'top' | 'left' | 'right' | 'box' | 'all' | 'none') => void;
  onClose: () => void;
  onOpenBorderDialog?: (() => void) | undefined;
  t?: Translations;
}

export const ParagraphBordersMenu: React.FC<ParagraphBordersMenuProps> = ({
  onSelectBorder,
  onClose,
  onOpenBorderDialog,
  t,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        zIndex: 9999,
        backgroundColor: 'var(--panel-bg)',
        color: 'var(--text-main)',
        border: '1px solid var(--panel-border)',
        borderRadius: '6px',
        boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.5)',
        minWidth: '160px',
        padding: '4px 0',
        fontSize: '11px',
      }}
    >
      <button
        onClick={() => { onSelectBorder('bottom'); onClose(); }}
        className="ribbon-menu-item"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
      >
        <AppIcon name="border-bottom" />
        <span>{(t ?? DICTIONARY.en).mnuBorderBottom}</span>
      </button>
      <button
        onClick={() => { onSelectBorder('top'); onClose(); }}
        className="ribbon-menu-item"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
      >
        <AppIcon name="border-top" />
        <span>{(t ?? DICTIONARY.en).mnuBorderTop}</span>
      </button>
      <button
        onClick={() => { onSelectBorder('left'); onClose(); }}
        className="ribbon-menu-item"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
      >
        <AppIcon name="border-left" />
        <span>{(t ?? DICTIONARY.en).mnuBorderLeft}</span>
      </button>
      <button
        onClick={() => { onSelectBorder('right'); onClose(); }}
        className="ribbon-menu-item"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
      >
        <AppIcon name="border-right" />
        <span>{(t ?? DICTIONARY.en).mnuBorderRight}</span>
      </button>

      <div style={{ height: '1px', backgroundColor: 'var(--panel-border)', margin: '4px 0' }} />

      <button
        onClick={() => { onSelectBorder('none'); onClose(); }}
        className="ribbon-menu-item"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
      >
        <AppIcon name="border-none" />
        <span>{(t ?? DICTIONARY.en).mnuBorderNone}</span>
      </button>
      <button
        onClick={() => { onSelectBorder('all'); onClose(); }}
        className="ribbon-menu-item"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
      >
        <AppIcon name="border-all" />
        <span>{(t ?? DICTIONARY.en).mnuBorderAll}</span>
      </button>
      <button
        onClick={() => { onSelectBorder('box'); onClose(); }}
        className="ribbon-menu-item"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
      >
        <AppIcon name="square" />
        <span>{(t ?? DICTIONARY.en).mnuBorderOutside}</span>
      </button>

      <div style={{ height: '1px', backgroundColor: 'var(--panel-border)', margin: '4px 0' }} />

      <button
        onClick={() => { onOpenBorderDialog?.(); onClose(); }}
        className="ribbon-menu-item"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
      >
        <AppIcon name="settings" />
        <span>{(t ?? DICTIONARY.en).mnuBordersShading}</span>
      </button>
    </div>
  );
};
