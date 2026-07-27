import React from 'react';
import type { RePageDocument } from '../../domain/document/types';
import type { ParagraphNode, TextRun, TextMark } from '../../domain/rich-text/types';

export interface WebReadingViewProps {
  document: RePageDocument;
  zoomLevel?: number;
  activeFontFamily?: string;
  activeFontSize?: number;
  lang?: 'ur' | 'en';
}

function extractRunStyles(marks?: TextMark[]): React.CSSProperties {
  if (!marks || !Array.isArray(marks)) {
    return {
      fontFamily: 'Jameel Noori Nastaliq, "Noto Nastaliq Urdu", serif',
      color: '#f8fafc',
    };
  }

  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let isStrikethrough = false;
  let fontFamily = 'Jameel Noori Nastaliq, "Noto Nastaliq Urdu", serif';
  let fontSize: number | undefined;
  let color = '#f8fafc';
  let highlight: string | undefined;

  for (const mark of marks) {
    if (mark.type === 'bold') isBold = true;
    else if (mark.type === 'italic') isItalic = true;
    else if (mark.type === 'underline') isUnderline = true;
    else if (mark.type === 'strikethrough') isStrikethrough = true;
    else if (mark.type === 'fontFamily') fontFamily = mark.family;
    else if (mark.type === 'fontSize') fontSize = mark.size;
    else if (mark.type === 'color') color = mark.color;
    else if (mark.type === 'highlight') highlight = mark.color;
  }

  return {
    fontFamily,
    fontSize: fontSize ? `${fontSize}pt` : undefined,
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
    textDecoration: [
      isUnderline ? 'underline' : '',
      isStrikethrough ? 'line-through' : '',
    ].filter(Boolean).join(' ') || undefined,
    color,
    backgroundColor: highlight,
  };
}

function renderTextRun(run: TextRun, key: string): React.ReactNode {
  const style = extractRunStyles(run.marks);
  return (
    <span key={key} style={style}>
      {run.text}
    </span>
  );
}

function renderParagraph(p: ParagraphNode, pIndex: number): React.ReactNode {
  const align = p.alignment || 'right';
  const dir: 'rtl' | 'ltr' = p.direction === 'ltr' ? 'ltr' : 'rtl';

  return (
    <p
      key={`p-${pIndex}`}
      style={{
        textAlign: align === 'start' ? (dir === 'rtl' ? 'right' : 'left') : align,
        direction: dir,
        lineHeight: 1.8,
        marginBottom: '14px',
        marginTop: 0,
        fontSize: '16pt',
        fontFamily: 'Jameel Noori Nastaliq, "Noto Nastaliq Urdu", serif',
      }}
    >
      {p.content.map((inline, iIdx) => {
        if (inline.type === 'text') {
          return renderTextRun(inline, `inline-${pIndex}-${iIdx}`);
        }
        return null;
      })}
    </p>
  );
}

export const WebReadingView: React.FC<WebReadingViewProps> = ({
  document,
  zoomLevel = 100,
  lang = 'ur',
}) => {
  const primaryStory = document.stories['primary-body-story'] || Object.values(document.stories)[0];

  return (
    <div
      data-testid="web-reading-view"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '24px 16px',
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'top center',
      }}
    >
      <article
        style={{
          width: '100%',
          maxWidth: '820px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '40px 48px',
          color: '#f8fafc',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          direction: lang === 'ur' ? 'rtl' : 'ltr',
        }}
      >
        <header
          style={{
            borderBottom: '1px solid #334155',
            paddingBottom: '16px',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ fontSize: '22px', margin: 0, fontWeight: 700, color: '#38bdf8' }}>
            {document.metadata.title || (lang === 'ur' ? 'ویب ریڈنگ ویو' : 'Web Reading View')}
          </h1>
          <span style={{ fontSize: '12px', color: '#94a3b8', backgroundColor: '#0f172a', padding: '4px 10px', borderRadius: '12px', border: '1px solid #334155' }}>
            🌐 {lang === 'ur' ? 'کنٹینیوئس ویب ریڈر' : 'Continuous Web Reader'}
          </span>
        </header>

        {primaryStory && primaryStory.content && primaryStory.content.content ? (
          primaryStory.content.content.map((p, idx) => renderParagraph(p, idx))
        ) : (
          <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '30px' }}>
            {lang === 'ur' ? 'دستاویز میں کوئی مواد موجود نہیں ہے۔' : 'No document content available.'}
          </div>
        )}
      </article>
    </div>
  );
};
