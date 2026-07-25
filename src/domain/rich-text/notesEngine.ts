
export type NoteType = 'footnote' | 'endnote';

export interface NoteSeparatorStyle {
  lineWidthPt: number; // Default: 1 pt
  lineLengthPercent: number; // Default: 33% column width
  alignment: 'start' | 'center' | 'end'; // Default: 'start' (RTL right)
  color: string; // Default: '#000000'
}

export interface NoteItem {
  id: string;
  number: number;
  symbol?: string | undefined;
  text: string;
  type: NoteType;
  storyId: string;
  createdAt: string;
}

export const DEFAULT_NOTE_SEPARATOR_STYLE: NoteSeparatorStyle = {
  lineWidthPt: 1,
  lineLengthPercent: 33,
  alignment: 'start',
  color: '#000000',
};

const documentNotesRegistry: Map<string, NoteItem[]> = new Map();
const documentNoteStyles: Map<string, NoteSeparatorStyle> = new Map();

export function getDocumentNotes(docId: string): NoteItem[] {
  return documentNotesRegistry.get(docId) ?? [];
}

export function getFootnoteSeparatorStyle(docId: string): NoteSeparatorStyle {
  return documentNoteStyles.get(docId) ?? { ...DEFAULT_NOTE_SEPARATOR_STYLE };
}

export function updateFootnoteSeparatorStyle(docId: string, style: Partial<NoteSeparatorStyle>): NoteSeparatorStyle {
  const current = getFootnoteSeparatorStyle(docId);
  const updated = { ...current, ...style };
  documentNoteStyles.set(docId, updated);
  return updated;
}

export function insertFootnote(
  docId: string,
  storyId: string,
  text: string,
  symbol?: string,
): NoteItem {
  const notes = getDocumentNotes(docId);
  const footnoteCount = notes.filter((n) => n.type === 'footnote').length;

  const note: NoteItem = {
    id: `note-fn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    number: footnoteCount + 1,
    symbol,
    text,
    type: 'footnote',
    storyId,
    createdAt: new Date().toISOString(),
  };

  notes.push(note);
  documentNotesRegistry.set(docId, notes);
  return note;
}

export function insertEndnote(
  docId: string,
  storyId: string,
  text: string,
  symbol?: string,
): NoteItem {
  const notes = getDocumentNotes(docId);
  const endnoteCount = notes.filter((n) => n.type === 'endnote').length;

  const note: NoteItem = {
    id: `note-en-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    number: endnoteCount + 1,
    symbol,
    text,
    type: 'endnote',
    storyId,
    createdAt: new Date().toISOString(),
  };

  notes.push(note);
  documentNotesRegistry.set(docId, notes);
  return note;
}

// Bi-directional conversion: Footnotes -> Endnotes
export function convertFootnotesToEndnotes(docId: string): { convertedCount: number } {
  const notes = getDocumentNotes(docId);
  let convertedCount = 0;

  const updatedNotes = notes.map((note) => {
    if (note.type === 'footnote') {
      convertedCount++;
      return { ...note, type: 'endnote' as NoteType };
    }
    return note;
  });

  documentNotesRegistry.set(docId, updatedNotes);
  return { convertedCount };
}

// Bi-directional conversion: Endnotes -> Footnotes
export function convertEndnotesToFootnotes(docId: string): { convertedCount: number } {
  const notes = getDocumentNotes(docId);
  let convertedCount = 0;

  const updatedNotes = notes.map((note) => {
    if (note.type === 'endnote') {
      convertedCount++;
      return { ...note, type: 'footnote' as NoteType };
    }
    return note;
  });

  documentNotesRegistry.set(docId, updatedNotes);
  return { convertedCount };
}

export function generateFootnoteSeparatorCss(style: NoteSeparatorStyle): string {
  const alignStyle = style.alignment === 'center' ? 'margin: 0 auto;' : style.alignment === 'end' ? 'margin-left: auto; margin-right: 0;' : 'margin-right: auto; margin-left: 0;';
  return `width: ${style.lineLengthPercent}%; height: ${style.lineWidthPt}pt; background-color: ${style.color}; ${alignStyle}`;
}
