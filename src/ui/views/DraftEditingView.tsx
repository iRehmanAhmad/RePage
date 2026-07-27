import React from 'react';
import { AppIcon } from '../icons/AppIcon';
import type { RePageDocument } from '../../domain/document/types';
import { DocumentBodyEditor } from '../editor/DocumentBodyEditor';

export interface DraftEditingViewProps {
  document: RePageDocument;
  activeFontFamily?: string | undefined;
  activeFontSize?: number | undefined;
  pendingChar?: string | null | undefined;
  bodyEditorFocusRequest?: number | undefined;
  onCommitStory: (storyId: string, updatedContent: any) => void;
  onRequestBodyFocus?: (() => void) | undefined;
  onSelectionChange?: ((info: any) => void) | undefined;
  onEditorReady?: ((editor: any) => void) | undefined;
  lang?: 'ur' | 'en' | undefined;
}

export const DraftEditingView: React.FC<DraftEditingViewProps> = ({
  document,
  activeFontFamily,
  activeFontSize,
  pendingChar,
  bodyEditorFocusRequest,
  onCommitStory,
  onSelectionChange,
  onEditorReady,
  lang = 'ur',
}) => {
  const primaryStory = document.stories['primary-body-story'] || Object.values(document.stories)[0];
  const sections = document.sections || [];

  return (
    <div
      data-testid="draft-editing-view"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 24px',
      }}
    >
      {/* Draft View Header Badge */}
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '8px 8px 0 0',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#94a3b8',
          fontSize: '12px',
        }}
      >
        <span style={{ fontWeight: 600, color: '#f59e0b' }}>
          <AppIcon name="edit" /> {lang === 'ur' ? 'ڈرافٹ ایڈیٹنگ ویو (صفحہ کے حاشیے اور گرافکس مخفی ہیں)' : 'Draft Editing View (Page margins & graphics hidden)'}
        </span>
        <span>
          {sections.length} {lang === 'ur' ? 'سیکشنز' : 'Section(s)'}
        </span>
      </div>

      {/* Editor Surface */}
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          padding: '24px 32px',
          color: '#f8fafc',
          minHeight: '600px',
        }}
      >
        {sections.map((section, idx) => (
          <div key={section.id} style={{ marginBottom: '24px' }}>
            {idx > 0 && (
              <div
                style={{
                  margin: '20px 0',
                  padding: '6px 12px',
                  backgroundColor: '#334155',
                  border: '1px dashed #64748b',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#f1f5f9',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              >
                <AppIcon name="cut" /> {lang === 'ur' ? `سیکشن بریک (${section.breakType})` : `Section Break (${section.breakType})`}
              </div>
            )}

            {primaryStory && (
              <DocumentBodyEditor
                story={primaryStory}
                fontFamily={activeFontFamily ?? 'Noto Nastaliq Urdu'}
                fontSize={activeFontSize ?? 18}
                color="#f8fafc"
                pendingChar={pendingChar ?? null}
                focusRequest={bodyEditorFocusRequest ?? 0}
                onCommit={(updatedContent) => onCommitStory(primaryStory.id, updatedContent)}
                onSelectionChange={onSelectionChange}
                onEditorReady={onEditorReady}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
