import React, { useState } from 'react';
import type { RePageDocument } from '../../domain/document/types';
import { getSectionForPage } from '../../domain/layout/sectionEngine';
import { createId } from '../../domain/document/ids';

interface HeaderFooterModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RePageDocument;
  activePageId: string;
  onApply: (updatedDoc: RePageDocument, message: string) => void;
  lang?: 'ur' | 'en';
}

export const HeaderFooterModal: React.FC<HeaderFooterModalProps> = ({
  isOpen,
  onClose,
  document,
  activePageId,
  onApply,
  lang = 'ur',
}) => {
  const isUr = lang === 'ur';
  const section = getSectionForPage(document, activePageId);
  const activePage = document.pages[activePageId];

  // Retrieve current header/footer stories
  const currentHeaderStory = section.headerStoryId ? document.stories[section.headerStoryId] : undefined;
  const currentFooterStory = section.footerStoryId ? document.stories[section.footerStoryId] : undefined;

  const getStoryText = (story: typeof currentHeaderStory) => {
    if (!story || !story.content || !story.content.content) return '';
    return story.content.content
      .map((p) =>
        (p.content || [])
          .filter((node): node is { type: 'text'; text: string } => node.type === 'text')
          .map((node) => node.text)
          .join(''),
      )
      .join('\n');
  };

  const [headerText, setHeaderText] = useState(() => getStoryText(currentHeaderStory));
  const [footerText, setFooterText] = useState(() => getStoryText(currentFooterStory));
  const [numberingStyle, setNumberingStyle] = useState<'urdu' | 'western' | 'abjad'>(
    section.pageNumbering?.style || 'urdu',
  );
  const [restartAtSection, setRestartAtSection] = useState(section.pageNumbering?.restartAtSection || false);
  const [startAt, setStartAt] = useState(section.pageNumbering?.startAt || 1);
  const [masterPageId, setMasterPageId] = useState<string>(activePage?.masterPageId || '');

  if (!isOpen) return null;

  const handleSave = () => {
    let nextDoc = { ...document };

    // Update Header Story
    let headerStoryId = section.headerStoryId;
    if (headerText.trim().length > 0) {
      if (!headerStoryId || !nextDoc.stories[headerStoryId]) {
        headerStoryId = createId('story');
      }
      nextDoc = {
        ...nextDoc,
        stories: {
          ...nextDoc.stories,
          [headerStoryId]: {
            id: headerStoryId,
            name: `Section Header (${section.id})`,
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: headerText }],
                },
              ],
            },
          },
        },
      };
    } else {
      headerStoryId = undefined;
    }

    // Update Footer Story
    let footerStoryId = section.footerStoryId;
    if (footerText.trim().length > 0) {
      if (!footerStoryId || !nextDoc.stories[footerStoryId]) {
        footerStoryId = createId('story');
      }
      nextDoc = {
        ...nextDoc,
        stories: {
          ...nextDoc.stories,
          [footerStoryId]: {
            id: footerStoryId,
            name: `Section Footer (${section.id})`,
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: footerText }],
                },
              ],
            },
          },
        },
      };
    } else {
      footerStoryId = undefined;
    }

    // Update Section Header/Footer and Page Numbering
    const sections = nextDoc.sections || [];
    const secIndex = sections.findIndex((s) => s.id === section.id);
    if (secIndex !== -1) {
      const updatedSections = [...sections];
      updatedSections[secIndex] = {
        ...updatedSections[secIndex]!,
        headerStoryId,
        footerStoryId,
        pageNumbering: {
          style: numberingStyle,
          startAt: Math.max(1, Number(startAt) || 1),
          restartAtSection,
          prefix: '',
          suffix: '',
        },
      };
      nextDoc = { ...nextDoc, sections: updatedSections };
    }

    // Update Master Page Assignment for current page
    if (activePage) {
      nextDoc = {
        ...nextDoc,
        pages: {
          ...nextDoc.pages,
          [activePageId]: {
            ...activePage,
            masterPageId: masterPageId || null,
          },
        },
      };
    }

    onApply(nextDoc, isUr ? 'ہیڈر، فوٹر اور ماسٹر پیج میں تبدیلیاں' : 'Updated Header, Footer, and Master Page settings');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          color: '#f8fafc',
          borderRadius: '12px',
          padding: '24px',
          width: '520px',
          maxWidth: '92vw',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          direction: 'rtl',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#38bdf8' }}>
            📜 {isUr ? 'ہیڈر، فوٹر اور ماسٹر پیج سیٹنگز' : 'Header, Footer & Master Page Setup'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
          >
            ✕ {isUr ? 'بند کریں' : 'Close'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
          {/* Header Story Text */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
              {isUr ? 'سیکشن ہیڈر متن (Header Text):' : 'Section Header Text:'}
            </label>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder={isUr ? 'مثلاً: باب ۱ — اردو ادب کی تاریخ' : 'e.g. History of Urdu Literature...'}
              style={{ width: '100%', padding: '8px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', outline: 'none' }}
            />
          </div>

          {/* Footer Story Text */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
              {isUr ? 'سیکشن فوٹر متن (Footer Text):' : 'Section Footer Text:'}
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder={isUr ? 'مثلاً: ری پیج سٹوڈیو پبلشنگ' : 'e.g. RePage Studio Publishing...'}
              style={{ width: '100%', padding: '8px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', outline: 'none' }}
            />
          </div>

          {/* Page Numbering Options */}
          <div style={{ display: 'flex', gap: '12px', backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px', fontSize: '12px' }}>
                {isUr ? 'نمبرنگ کا انداز:' : 'Page Numbering Style:'}
              </label>
              <select
                value={numberingStyle}
                onChange={(e) => setNumberingStyle(e.target.value as any)}
                style={{ width: '100%', padding: '6px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc' }}
              >
                <option value="urdu">اردو (۰، ۱، ۲)</option>
                <option value="abjad">ابجد (ا، ب، ج)</option>
                <option value="western">Western (1, 2, 3)</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '22px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={restartAtSection}
                  onChange={(e) => setRestartAtSection(e.target.checked)}
                  style={{ accentColor: '#38bdf8' }}
                />
                <span>{isUr ? 'سیکشن پر دوبارہ شروع کریں' : 'Restart at Section'}</span>
              </label>
            </div>

            {restartAtSection && (
              <div style={{ width: '70px' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px', fontSize: '12px' }}>
                  {isUr ? 'شروعات:' : 'Start:'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={startAt}
                  onChange={(e) => setStartAt(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc' }}
                />
              </div>
            )}
          </div>

          {/* Master Page Assignment */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
              {isUr ? 'ماسٹر پیج منتخب کریں (Master Page):' : 'Assigned Master Page:'}
            </label>
            <select
              value={masterPageId}
              onChange={(e) => setMasterPageId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc' }}
            >
              <option value="">{isUr ? 'کوئی نہیں (No Master Page)' : 'None (No Master Page)'}</option>
              {Object.values(document.masterPages || {}).map((master) => (
                <option key={master.id} value={master.id}>
                  {master.name} ({master.id})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSave}
            style={{ marginTop: '10px', width: '100%', padding: '10px', backgroundColor: '#0284c7', border: '1px solid #38bdf8', color: '#ffffff', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
          >
            ✓ {isUr ? 'سیٹنگز کا اطلاق کریں' : 'Apply Header/Footer/Master Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
