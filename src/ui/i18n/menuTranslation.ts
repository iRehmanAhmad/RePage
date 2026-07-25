export type UiLanguage = 'en' | 'ur';

export interface Translations {
  // Tabs
  tabHome: string;
  tabInsert: string;
  tabUrduTools: string;
  tabPageLayout: string;
  tabCollab: string;
  tabExportView: string;

  // Common Actions
  open: string;
  save: string;
  saveAs: string;
  recent: string;
  preflight: string;
  undo: string;
  redo: string;
  select: string;
  textFrame: string;
  shape: string;
  imageFrame: string;

  // Home Ribbon
  fontFamily: string;
  fontSize: string;
  kashida: string;
  alignRight: string;
  alignCenter: string;
  alignLeft: string;
  alignJustify: string;

  // Insert Ribbon
  addPage: string;
  removePage: string;
  masterPage: string;
  addFootnote: string;
  addEndnote: string;

  // Urdu Tools Ribbon
  spellcheck: string;
  dictionary: string;
  proofread: string;
  transliteration: string;
  normalization: string;
  ocr: string;

  // Page Layout Ribbon
  pageSize: string;
  margins: string;
  columns: string;
  pageNumbering: string;

  // Collab & Export Ribbon
  collabRoom: string;
  shareLink: string;
  exportPdf: string;
  exportEpub: string;

  // Inspector & Status
  inspectorProps: string;
  inspectorType: string;
  inspectorTools: string;
  inspectorExport: string;
  pageCount: string;
  themeDark: string;
  themeLight: string;
  themeSystem: string;
  langEnglish: string;
  langUrdu: string;
}

export const DICTIONARY: Record<UiLanguage, Translations> = {
  ur: {
    tabHome: 'اہم (Home)',
    tabInsert: 'درج کریں (Insert)',
    tabUrduTools: 'اردو آلات (Urdu Tools)',
    tabPageLayout: 'صفحہ بندی (Layout)',
    tabCollab: 'باہمی تعاون (Collab)',
    tabExportView: 'برآمد و منظر (Export)',

    open: 'کھولیں',
    save: 'محفوظ',
    saveAs: 'محفوظ کریں',
    recent: 'حالیہ',
    preflight: 'پری فلائٹ',
    undo: 'منسوخ (Undo)',
    redo: 'دوبارہ (Redo)',
    select: 'انتخاب',
    textFrame: 'متن فریم',
    shape: 'شکل',
    imageFrame: 'تصویر فریم',

    fontFamily: 'اردو رسم الخط',
    fontSize: 'سائز',
    kashida: 'کشیدہ',
    alignRight: 'دائیں',
    alignCenter: 'مرکز',
    alignLeft: 'بائیں',
    alignJustify: 'برابر',

    addPage: '+ نیا صفحہ',
    removePage: 'حذف صفحہ',
    masterPage: 'ماسٹر صفحہ',
    addFootnote: '+ ذیلی حاشیہ',
    addEndnote: '+ تعلیق',

    spellcheck: 'املاء تفتیش',
    dictionary: 'اردو لغت',
    proofread: 'نظر ثانی',
    transliteration: 'رومن اردو',
    normalization: 'حروف نفاذ',
    ocr: 'تصویر متن شناسی',

    pageSize: 'صفحہ کا سائز',
    margins: 'حواشی',
    columns: 'کالمز',
    pageNumbering: 'صفحہ نمبرنگ',

    collabRoom: 'تعاون روم',
    shareLink: 'لنک شیئر',
    exportPdf: 'PDF برآمد',
    exportEpub: 'ePUB 3.0 برآمد',

    inspectorProps: 'خواص',
    inspectorType: 'خطاطی',
    inspectorTools: 'آلات',
    inspectorExport: 'برآمد',
    pageCount: 'صفحات',
    themeDark: 'ڈارک تھیم',
    themeLight: 'لائٹ تھیم',
    themeSystem: 'سسٹم تھیم',
    langEnglish: 'English',
    langUrdu: 'اردو',
  },
  en: {
    tabHome: 'Home',
    tabInsert: 'Insert',
    tabUrduTools: 'Urdu Tools',
    tabPageLayout: 'Page Layout',
    tabCollab: 'Collaboration',
    tabExportView: 'Export & View',

    open: 'Open',
    save: 'Save',
    saveAs: 'Save As',
    recent: 'Recent',
    preflight: 'Preflight',
    undo: 'Undo',
    redo: 'Redo',
    select: 'Select',
    textFrame: 'Text Frame',
    shape: 'Shape',
    imageFrame: 'Image Frame',

    fontFamily: 'Font Family',
    fontSize: 'Size',
    kashida: 'Kashida',
    alignRight: 'Right',
    alignCenter: 'Center',
    alignLeft: 'Left',
    alignJustify: 'Justify',

    addPage: '+ Add Page',
    removePage: 'Delete Page',
    masterPage: 'Master Page',
    addFootnote: '+ Footnote',
    addEndnote: '+ Endnote',

    spellcheck: 'Spellcheck',
    dictionary: 'Dictionary',
    proofread: 'Proofreader',
    transliteration: 'Roman Transliteration',
    normalization: 'Normalization',
    ocr: 'Image OCR',

    pageSize: 'Page Size',
    margins: 'Margins',
    columns: 'Columns',
    pageNumbering: 'Page Numbering',

    collabRoom: 'Co-Authoring Room',
    shareLink: 'Share Link',
    exportPdf: 'Export PDF',
    exportEpub: 'Export ePUB 3.0',

    inspectorProps: 'Properties',
    inspectorType: 'Typography',
    inspectorTools: 'Tools',
    inspectorExport: 'Export',
    pageCount: 'Pages',
    themeDark: 'Dark Theme',
    themeLight: 'Light Theme',
    themeSystem: 'System Theme',
    langEnglish: 'English',
    langUrdu: 'Urdu',
  },
};
