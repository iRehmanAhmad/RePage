export type UiLanguage = 'en' | 'ur';

export interface Translations {
  // Tabs
  tabFile: string;
  tabHome: string;
  tabInsert: string;
  tabUrduTools: string;
  tabPageLayout: string;
  tabCollab: string;
  tabExportView: string;

  // Ribbon Group Captions
  grpClipboard: string;
  grpFont: string;
  grpParagraph: string;
  grpTools: string;
  grpPages: string;
  grpIllustrations: string;
  grpFootnotes: string;
  grpProofing: string;
  grpConversion: string;
  grpPageSetup: string;
  grpBreaks: string;
  grpColumns: string;
  grpLayoutAids: string;
  grpPrintSafety: string;

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

  // Clipboard Actions
  cut: string;
  copy: string;
  paste: string;
  pasteSpecial: string;
  formatPainter: string;
  keepSourceFormatting: string;
  mergeFormatting: string;
  keepTextOnly: string;

  // Home Ribbon
  fontFamily: string;
  fontSize: string;
  bold: string;
  italic: string;
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
  browserPrint: string;
  pdfExportDisabled: string;
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
    tabFile: 'فائل (File)',
    tabHome: 'ہوم',
    tabInsert: 'درج کریں',
    tabUrduTools: 'اردو آلات',
    tabPageLayout: 'صفحہ بندی',
    tabCollab: 'باہمی تعاون',
    tabExportView: 'برآمد و منظر',

    grpClipboard: 'کلپ بورڈ',
    grpFont: 'فونٹ و خطاطی',
    grpParagraph: 'پیراگراف و الائنمنٹ',
    grpTools: 'کینوس آلات',
    grpPages: 'صفحات',
    grpIllustrations: 'اشکال و فریم',
    grpFootnotes: 'حواشی و تعلیقات',
    grpProofing: 'املاء تفتیش',
    grpConversion: 'تبدیلی',
    grpPageSetup: 'صفحہ کی ترتیبات',
    grpBreaks: 'سیکشن بریکس',
    grpColumns: 'کالمز نگاری',
    grpLayoutAids: 'منظر نامہ و سائز',
    grpPrintSafety: 'پرنٹ حفاظت',

    open: 'کھولیں',
    save: 'محفوظ',
    saveAs: 'محفوظ کریں',
    recent: 'حالیہ',
    preflight: 'پری فلائٹ',
    undo: 'منسوخ',
    redo: 'دوبارہ',
    select: 'انتخاب',
    textFrame: 'ٹیکسٹ باکس',
    shape: 'شکل',
    imageFrame: 'تصویر فریم',

    cut: 'کٹ (Cut)',
    copy: 'کاپی (Copy)',
    paste: 'پیسٹ (Paste)',
    pasteSpecial: 'خاص پیسٹ (Paste Special)',
    formatPainter: 'فارمیٹ پینٹر (Format Painter)',
    keepSourceFormatting: 'سورس فارمیٹ رکھیں',
    mergeFormatting: 'فارمیٹ ضم کریں',
    keepTextOnly: 'صرف متن رکھیں',

    fontFamily: 'اردو رسم الخط',
    fontSize: 'سائز',
    bold: 'جلی',
    italic: 'ترچھا',
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
    browserPrint: 'پرنٹ… (براؤزر)',
    pdfExportDisabled: 'PDF برآمد (عنقریب)',
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
    tabFile: 'File',
    tabHome: 'Home',
    tabInsert: 'Insert',
    tabUrduTools: 'Urdu Tools',
    tabPageLayout: 'Page Layout',
    tabCollab: 'Collaboration',
    tabExportView: 'Export & View',

    grpClipboard: 'Clipboard',
    grpFont: 'Font',
    grpParagraph: 'Paragraph',
    grpTools: 'Tools',
    grpPages: 'Pages',
    grpIllustrations: 'Illustrations',
    grpFootnotes: 'Footnotes',
    grpProofing: 'Proofing',
    grpConversion: 'Conversion',
    grpPageSetup: 'Page Setup',
    grpBreaks: 'Breaks',
    grpColumns: 'Columns',
    grpLayoutAids: 'Layout Aids',
    grpPrintSafety: 'Print Safety',

    open: 'Open',
    save: 'Save',
    saveAs: 'Save As',
    recent: 'Recent',
    preflight: 'Preflight',
    undo: 'Undo',
    redo: 'Redo',
    select: 'Select',
    textFrame: 'Text Box',
    shape: 'Shape',
    imageFrame: 'Image Frame',

    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    pasteSpecial: 'Paste Special',
    formatPainter: 'Format Painter',
    keepSourceFormatting: 'Keep Source Formatting',
    mergeFormatting: 'Merge Formatting',
    keepTextOnly: 'Keep Text Only',

    fontFamily: 'Font Family',
    fontSize: 'Size',
    bold: 'Bold',
    italic: 'Italic',
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
    browserPrint: 'Browser Print…',
    pdfExportDisabled: 'PDF Export (Coming Soon)',
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
