import React, { useState } from 'react';
import type { RePageDocument } from '../../domain/document/types';
import type { UiLanguage } from '../i18n/menuTranslation';
import { AppIcon } from '../icons/AppIcon';
import { getCharacterStyles } from '../../domain/rich-text/characterStyles';
import type { CharacterStyle } from '../../domain/rich-text/styles';

export interface StylesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  onApplyStyle?: (styleId: string) => void;
  lang: UiLanguage;
  /** User rename overrides for style display names. */
  styleNameOverrides?: Record<string, string>;
  /** Style ids hidden from the ribbon gallery via "Remove from Style Gallery". */
  hiddenStyleIds?: string[];
  /** Toggles a style's visibility in the ribbon gallery (restore path). */
  onToggleGalleryVisibility?: (styleId: string) => void;
  /** Character styles (batch 12): true when the editor has a text selection to apply to. */
  hasTextSelection?: boolean;
  onApplyCharacterStyle?: (styleId: string | undefined) => void;
  onCreateCharacterStyle?: (name: string) => CharacterStyle | void;
  onUpdateCharacterStyle?: (styleId: string, patch: Partial<Omit<CharacterStyle, 'id'>>) => void;
  onDeleteCharacterStyle?: (styleId: string) => void;
}

export function StylesManagerModal({
  isOpen,
  onClose,
  document,
  onApplyStyle,
  lang,
  styleNameOverrides,
  hiddenStyleIds,
  onToggleGalleryVisibility,
  hasTextSelection,
  onApplyCharacterStyle,
  onCreateCharacterStyle,
  onUpdateCharacterStyle,
  onDeleteCharacterStyle,
}: StylesManagerModalProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('normal');
  const [selectedCharStyleId, setSelectedCharStyleId] = useState<string | null>(null);
  const [charEditDraft, setCharEditDraft] = useState<CharacterStyle | null>(null);
  const [newCharStyleName, setNewCharStyleName] = useState('');
  const [confirmDeleteCharId, setConfirmDeleteCharId] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultStyles = [
    { id: 'normal', name: 'Normal (عام متن)', font: 'Noto Nastaliq Urdu', size: 16, lineSpacing: 1.5, alignment: 'right' },
    { id: 'heading-1', name: 'Heading 1 (عنوان ۱)', font: 'Noto Nastaliq Urdu', size: 24, lineSpacing: 1.3, alignment: 'right' },
    { id: 'heading-2', name: 'Heading 2 (عنوان ۲)', font: 'Noto Nastaliq Urdu', size: 20, lineSpacing: 1.4, alignment: 'right' },
    { id: 'heading-3', name: 'Heading 3 (عنوان ۳)', font: 'Noto Nastaliq Urdu', size: 16, lineSpacing: 1.5, alignment: 'right' },
    { id: 'poetry', name: 'Poetry (شاعری / غزل)', font: 'Noto Nastaliq Urdu', size: 18, lineSpacing: 2.0, alignment: 'center' },
    { id: 'quote', name: 'Quote (اقتباس)', font: 'Noto Nastaliq Urdu', size: 15, lineSpacing: 1.8, alignment: 'center' },
    { id: 'quran', name: 'Quran / Hadith (آیات و احادیث)', font: 'Amiri', size: 18, lineSpacing: 1.8, alignment: 'center' },
  ].map((s) => ({
    ...s,
    // A user rename replaces the whole label; otherwise keep the bilingual base name.
    displayName: styleNameOverrides?.[s.id] ?? s.name,
  }));

  const filteredStyles = defaultStyles.filter((s) =>
    s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.displayName.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  const activeStyleObj = defaultStyles.find((s) => s.id === selectedStyleId) || defaultStyles[0];
  const isUr = lang === 'ur';

  // Character styles (batch 12): the document registry is the source of
  // truth; App owns all mutations through editor/commands.
  const characterStyles = getCharacterStyles(document);
  const charStyleList = Object.values(characterStyles);
  const selectedCharStyle = selectedCharStyleId
    ? characterStyles[selectedCharStyleId]
    : undefined;

  const charPreviewStyle = (s: CharacterStyle): React.CSSProperties => ({
    fontFamily: s.fontFamily,
    fontSize: s.fontSize ? `${Math.min(22, s.fontSize)}px` : undefined,
    color: s.color,
    fontWeight: s.bold ? 700 : undefined,
    fontStyle: s.italic ? 'italic' : undefined,
    textDecoration: s.underline ? 'underline' : undefined,
  });

  const smallBtn: React.CSSProperties = {
    backgroundColor: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '10px',
    fontWeight: 600,
    cursor: 'pointer',
  };
  const smallInput: React.CSSProperties = {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '4px 8px',
    color: '#f8fafc',
    fontSize: '11px',
    outline: 'none',
    boxSizing: 'border-box',
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
        zIndex: 99999,
      }}
    >
      <div
        style={{
          width: '460px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '18px 22px',
          color: '#f8fafc',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          fontSize: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 700 }}>
            {isUr ? 'اردو اسٹائلز منیجر (Styles Manager)' : 'Urdu Styles Manager'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
            }}
          >
            <AppIcon name="dismiss" size={16} />
          </button>
        </div>

        {/* Filter Input */}
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder={isUr ? 'اسٹائل تلاش کریں...' : 'Search styles...'}
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '6px 10px',
              color: '#f8fafc',
              fontSize: '11px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Style List */}
        <div
          style={{
            height: '170px',
            overflowY: 'auto',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '6px',
            marginBottom: '12px',
          }}
        >
          {filteredStyles.map((style) => {
            const isSelected = selectedStyleId === style.id;
            const isHiddenFromGallery = hiddenStyleIds?.includes(style.id) ?? false;
            return (
              <div
                key={style.id}
                onClick={() => setSelectedStyleId(style.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? '#10b981' : 'transparent',
                  color: isSelected ? '#ffffff' : '#e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontWeight: 600, fontFamily: style.font }}>{style.displayName}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', opacity: 0.85 }}>
                    {style.font} ({style.size}pt)
                  </span>
                  {onToggleGalleryVisibility && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleGalleryVisibility(style.id);
                      }}
                      title={isHiddenFromGallery
                        ? (isUr ? 'اسٹائل گیلری میں واپس دکھائیں' : 'Show in style gallery')
                        : (isUr ? 'اسٹائل گیلری سے چھپائیں' : 'Hide from style gallery')}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: isHiddenFromGallery ? '#f59e0b' : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: '2px',
                      }}
                    >
                      <AppIcon name={isHiddenFromGallery ? 'eye-off' : 'eye'} size={14} />
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Preview Box */}
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
          {isUr ? 'اسٹائل کی لائیو نمائش:' : 'Style Preview:'}
        </div>
        <div
          style={{
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '10px 14px',
            minHeight: '48px',
            backgroundColor: '#0f172a',
            color: activeStyleObj?.id.includes('heading') ? '#38bdf8' : activeStyleObj?.id === 'quran' ? '#34d399' : '#f8fafc',
            fontFamily: activeStyleObj?.font || 'Noto Nastaliq Urdu',
            fontSize: `${Math.min(20, activeStyleObj?.size || 16)}px`,
            lineHeight: `${activeStyleObj?.lineSpacing || 1.5}`,
            textAlign: (activeStyleObj?.alignment || 'right') as any,
            direction: 'rtl',
            overflow: 'hidden',
            marginBottom: '14px',
          }}
        >
          اردو رسم الخط اور اسٹائلز کا نمونہ
        </div>


        {/* Character Styles (batch 12) */}
        {onApplyCharacterStyle && onCreateCharacterStyle && (
          <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
              {isUr ? 'حرفی اسٹائلز (Character Styles)' : 'Character Styles'}
            </div>

            <div
              style={{
                maxHeight: '120px',
                overflowY: 'auto',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '6px',
                marginBottom: '8px',
              }}
            >
              {charStyleList.map((s) => {
                const isSel = selectedCharStyleId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedCharStyleId(s.id);
                      setConfirmDeleteCharId(null);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      backgroundColor: isSel ? '#0f766e' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '3px',
                    }}
                  >
                    <span style={charPreviewStyle(s)}>{s.name}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {[s.fontFamily, s.fontSize ? `${s.fontSize}pt` : null, s.language === 'ur' ? 'اردو' : s.language === 'en' ? 'EN' : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </div>
                );
              })}
              {charStyleList.length === 0 && (
                <div style={{ padding: '6px 10px', color: '#94a3b8', fontSize: '11px' }}>
                  {isUr ? 'کوئی حرفی اسٹائل نہیں' : 'No character styles yet'}
                </div>
              )}
            </div>

            {/* Selected style preview */}
            {selectedCharStyle && (
              <div
                style={{
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  marginBottom: '8px',
                  direction: selectedCharStyle.language === 'en' ? 'ltr' : 'rtl',
                  ...charPreviewStyle(selectedCharStyle),
                }}
              >
                {selectedCharStyle.language === 'en' ? 'Sample text 123' : 'نمونہ متن ۱۲۳'}
              </div>
            )}

            {/* Actions for the selected style */}
            {selectedCharStyle && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                <button
                  type="button"
                  style={{ ...smallBtn, backgroundColor: hasTextSelection ? '#10b981' : '#475569', color: '#ffffff' }}
                  disabled={!hasTextSelection}
                  title={hasTextSelection ? undefined : (isUr ? 'پہلے متن منتخب کریں' : 'Select text first')}
                  onClick={() => onApplyCharacterStyle(selectedCharStyle.id)}
                >
                  {isUr ? 'منتخب متن پر لاگو کریں' : 'Apply to Selection'}
                </button>
                <button
                  type="button"
                  style={smallBtn}
                  disabled={!hasTextSelection}
                  onClick={() => onApplyCharacterStyle(undefined)}
                >
                  {isUr ? 'اسٹائل ہٹائیں' : 'Clear Style'}
                </button>
                <button
                  type="button"
                  style={smallBtn}
                  onClick={() => setCharEditDraft({ ...selectedCharStyle })}
                >
                  {isUr ? 'ترمیم' : 'Edit'}
                </button>
                {confirmDeleteCharId === selectedCharStyle.id ? (
                  <button
                    type="button"
                    style={{ ...smallBtn, backgroundColor: '#b91c1c', color: '#ffffff' }}
                    onClick={() => {
                      onDeleteCharacterStyle?.(selectedCharStyle.id);
                      setSelectedCharStyleId(null);
                      setConfirmDeleteCharId(null);
                    }}
                  >
                    {isUr ? 'یقینی حذف؟ متن ویسا ہی رہے گا' : 'Confirm delete? Text keeps its look'}
                  </button>
                ) : (
                  <button
                    type="button"
                    style={{ ...smallBtn, backgroundColor: '#7f1d1d', color: '#fecaca' }}
                    onClick={() => setConfirmDeleteCharId(selectedCharStyle.id)}
                  >
                    {isUr ? 'حذف کریں' : 'Delete'}
                  </button>
                )}
              </div>
            )}

            {/* Edit form */}
            {charEditDraft && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    value={charEditDraft.name}
                    onChange={(e) => setCharEditDraft({ ...charEditDraft, name: e.target.value })}
                    placeholder={isUr ? 'اسٹائل کا نام' : 'Style name'}
                    style={{ ...smallInput, flex: 2 }}
                  />
                  <input
                    type="text"
                    value={charEditDraft.fontFamily ?? ''}
                    onChange={(e) => setCharEditDraft({ ...charEditDraft, fontFamily: e.target.value || undefined })}
                    placeholder={isUr ? 'فونٹ' : 'Font family'}
                    style={{ ...smallInput, flex: 2 }}
                  />
                  <input
                    type="number"
                    value={charEditDraft.fontSize ?? ''}
                    onChange={(e) => setCharEditDraft({ ...charEditDraft, fontSize: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder={isUr ? 'سائز' : 'Size'}
                    style={{ ...smallInput, flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="color"
                    value={charEditDraft.color ?? '#000000'}
                    onChange={(e) => setCharEditDraft({ ...charEditDraft, color: e.target.value })}
                    style={{ width: '34px', height: '26px', padding: 0, border: '1px solid #334155', borderRadius: '4px', background: 'transparent' }}
                  />
                  {(['bold', 'italic', 'underline'] as const).map((prop) => (
                    <label key={prop} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#cbd5e1' }}>
                      {prop}
                      <select
                        value={charEditDraft[prop] === undefined ? '' : charEditDraft[prop] ? 'on' : 'off'}
                        onChange={(e) =>
                          setCharEditDraft({
                            ...charEditDraft,
                            [prop]: e.target.value === '' ? undefined : e.target.value === 'on',
                          })
                        }
                        style={smallInput}
                      >
                        <option value="">{isUr ? 'وراثتی' : 'Inherit'}</option>
                        <option value="on">{isUr ? 'آن' : 'On'}</option>
                        <option value="off">{isUr ? 'آف' : 'Off'}</option>
                      </select>
                    </label>
                  ))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#cbd5e1' }}>
                    {isUr ? 'زبان' : 'Language'}
                    <select
                      value={charEditDraft.language ?? ''}
                      onChange={(e) =>
                        setCharEditDraft({
                          ...charEditDraft,
                          language: e.target.value === '' ? undefined : (e.target.value as 'ur' | 'en'),
                        })
                      }
                      style={smallInput}
                    >
                      <option value="">—</option>
                      <option value="ur">{isUr ? 'اردو' : 'Urdu'}</option>
                      <option value="en">{isUr ? 'انگریزی' : 'English'}</option>
                    </select>
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button type="button" style={smallBtn} onClick={() => setCharEditDraft(null)}>
                    {isUr ? 'کنسل' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    style={{ ...smallBtn, backgroundColor: '#10b981', color: '#ffffff' }}
                    onClick={() => {
                      const { id, ...patch } = charEditDraft;
                      onUpdateCharacterStyle?.(id, patch);
                      setCharEditDraft(null);
                    }}
                  >
                    {isUr ? 'محفوظ کریں' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Create from selection */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={newCharStyleName}
                onChange={(e) => setNewCharStyleName(e.target.value)}
                placeholder={isUr ? 'نئے اسٹائل کا نام...' : 'New style name...'}
                style={{ ...smallInput, flex: 1 }}
              />
              <button
                type="button"
                style={{ ...smallBtn, backgroundColor: hasTextSelection ? '#0f766e' : '#475569', color: '#ffffff' }}
                disabled={!hasTextSelection || !newCharStyleName.trim()}
                title={hasTextSelection ? undefined : (isUr ? 'پہلے متن منتخب کریں' : 'Select text first')}
                onClick={() => {
                  const created = onCreateCharacterStyle(newCharStyleName.trim());
                  if (created) setSelectedCharStyleId(created.id);
                  setNewCharStyleName('');
                }}
              >
                {isUr ? 'منتخب فارمیٹنگ سے بنائیں' : 'Create from Selection'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
              color: '#cbd5e1',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isUr ? 'کنسل' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (onApplyStyle) onApplyStyle(selectedStyleId);
              onClose();
            }}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 18px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isUr ? 'اسٹائل لاگو کریں' : 'Apply Style'}
          </button>
        </div>
      </div>
    </div>
  );
}
