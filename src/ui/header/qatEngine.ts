export type QatItemKey =
  | 'save'
  | 'undo'
  | 'redo'
  | 'open'
  | 'saveAs'
  | 'preflight'
  | 'pdf'
  | 'epub'
  | 'ocr'
  | 'langTools'
  | 'collab';

export interface QatDefinition {
  key: QatItemKey;
  icon: string;
  labelEn: string;
  labelUr: string;
  defaultEnabled: boolean;
}

export const QAT_CATALOG: QatDefinition[] = [
  { key: 'save', icon: '💾', labelEn: 'Save', labelUr: 'محفوظ', defaultEnabled: true },
  { key: 'undo', icon: '↩', labelEn: 'Undo', labelUr: 'منسوخ', defaultEnabled: true },
  { key: 'redo', icon: '↪', labelEn: 'Redo', labelUr: 'دوبارہ', defaultEnabled: true },
  { key: 'open', icon: '📂', labelEn: 'Open', labelUr: 'کھولیں', defaultEnabled: true },
  { key: 'saveAs', icon: '💾', labelEn: 'Save As', labelUr: 'نام سے محفوظ', defaultEnabled: false },
  { key: 'preflight', icon: '🔍', labelEn: 'Preflight', labelUr: 'پری فلائٹ', defaultEnabled: false },
  { key: 'pdf', icon: '📄', labelEn: 'Export PDF', labelUr: 'PDF برآمد', defaultEnabled: false },
  { key: 'epub', icon: '📚', labelEn: 'Export ePUB', labelUr: 'ePUB برآمد', defaultEnabled: false },
  { key: 'ocr', icon: '📷', labelEn: 'Urdu OCR', labelUr: 'متن شناسی', defaultEnabled: false },
  { key: 'langTools', icon: '🌐', labelEn: 'Language Tools', labelUr: 'اردو آلات', defaultEnabled: false },
  { key: 'collab', icon: '👥', labelEn: 'Collaboration', labelUr: 'تعاون روم', defaultEnabled: false },
];

const QAT_STORAGE_KEY = 'repage_qat_items_v1';

export function getInitialQatItems(): QatItemKey[] {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(QAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as QatItemKey[];
        }
      }
    } catch {
      // Fallback
    }
  }
  return QAT_CATALOG.filter((item) => item.defaultEnabled).map((item) => item.key);
}

export function saveQatItems(items: QatItemKey[]): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(QAT_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }
}
