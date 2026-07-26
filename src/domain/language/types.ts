export type LanguageToolCategory =
  | 'spelling'
  | 'proofread'
  | 'transliteration'
  | 'normalization'
  | 'character-fix';

export type LanguageToolScope =
  | { kind: 'selection'; storyId: string; from: number; to: number }
  | { kind: 'story'; storyId: string }
  | { kind: 'document' };

export interface LanguageChange {
  id: string;
  storyId: string;
  from: number;
  to: number;
  replacement: string;
  reason: string;
  category: LanguageToolCategory;
  confidence?: number | undefined;
  originalText?: string | undefined;
}
