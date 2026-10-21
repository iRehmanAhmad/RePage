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
  vectorPdfExport: string;
  exportDocx: string;
  wordDocxExport: string;
  exportDocxTooltip: string;
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

  // List, style & selection tools
  bulletLibrary: string;
  numberingLibrary: string;
  changeListLevel: string;
  lineSpacingOptions: string;
  modifyStyle: string;
  renameStyle: string;
  removeFromStyleGallery: string;
  addGalleryToQat: string;
  selectAll: string;
  selectAllMatching: string;
  selectObjects: string;
  standardJustify: string;
  straightLine: string;
  stopPlayback: string;
  nativeOsPassthrough: string;
  nativeOsKeyboardHelp: string;

  // Image crop (Picture Format + inspector)
  cropImage: string;
  inspImageCrop: string;
  cropInsetLeft: string;
  cropInsetTop: string;
  cropInsetRight: string;
  cropInsetBottom: string;
  cropReset: string;

  // Print page range (Export dialog + backstage)
  printRangeAll: string;
  printRangeCurrent: string;
  printRangeCustom: string;
  printRangeFrom: string;
  printRangeTo: string;
  printCopiesNote: string;

  // Per-document spellcheck ignores
  spellIgnoreAllInDoc: string;
  ltDocIgnoredTitle: string;
  ltDocIgnoredEmpty: string;
  ltClearDocIgnored: string;

  // Header chrome
  tipMenuLanguage: string;
  tipThemeMode: string;
  phDocumentName: string;
  tipCustomizeQat: string;

  // Save state (rendered from the SaveState union in App)
  saveStateSaved: string;
  saveStateUnsaved: string;
  saveStateSaving: string;
  saveStateFailed: string;

  // Inspector dock
  tipResizeInspector: string;
  tipCloseInspector: string;
  lblCoordX: string;
  lblCoordY: string;
  inspPosHint: string;
  inspGeometry: string;
  inspWidth: string;
  inspHeight: string;
  inspRotation: string;
  inspShapeFormat: string;
  inspFillColor: string;
  inspOutlineColor: string;
  inspStrokeWidth: string;
  inspCornerRadius: string;
  inspEmpty: string;
  inspPageDims: string;
  inspElementId: string;
  inspSize: string;
  inspMarginTop: string;
  inspMarginRight: string;

  // Font dialog
  dlgFontTitle: string;
  dlgFontTab: string;
  dlgFontAdvancedTab: string;
  dlgFontLabel: string;
  dlgFontStyleLabel: string;
  dlgFontRegular: string;
  dlgFontBoldItalic: string;
  dlgFontSizeLabel: string;
  dlgFontColorLabel: string;
  dlgUnderlineStyleLabel: string;
  dlgUnderlineNone: string;
  dlgUnderlineSingle: string;
  dlgUnderlineDouble: string;
  dlgUnderlineThick: string;
  dlgUnderlineDotted: string;
  dlgUnderlineDashed: string;
  dlgUnderlineWavy: string;
  dlgUnderlineColorLabel: string;
  dlgEffectsLabel: string;
  dlgStrikethrough: string;
  dlgSubscript: string;
  dlgSuperscript: string;
  dlgCharSpacingLabel: string;
  dlgPreviewLabel: string;
  dlgCancel: string;
  dlgOk: string;

  // Paragraph dialog
  dlgParaTitle: string;
  dlgParaSpacingTab: string;
  dlgParaBreaksTab: string;
  dlgParaGeneral: string;
  dlgParaAlignment: string;
  dlgParaAlignStart: string;
  dlgParaAlignLeft: string;
  dlgParaAlignCenter: string;
  dlgParaAlignRight: string;
  dlgParaAlignJustify: string;
  dlgParaDirection: string;
  dlgParaRtl: string;
  dlgParaLtr: string;
  dlgParaIndentation: string;
  dlgParaIndentLevel: string;
  dlgParaFirstLineIndent: string;
  dlgParaSpacing: string;
  dlgParaBefore: string;
  dlgParaAfter: string;
  dlgParaLineSpacing: string;
  dlgParaSingle: string;
  dlgParaLines115: string;
  dlgParaLines15: string;
  dlgParaLines25: string;
  dlgParaLines30: string;
  dlgParaDouble: string;
  dlgParaPagination: string;
  dlgParaWidowOrphan: string;
  dlgParaKeepWithNext: string;

  // Borders menu
  mnuBorderBottom: string;
  mnuBorderTop: string;
  mnuBorderLeft: string;
  mnuBorderRight: string;
  mnuBorderNone: string;
  mnuBorderAll: string;
  mnuBorderOutside: string;
  mnuBordersShading: string;

  // Color palettes
  clrAutomatic: string;
  clrCustom: string;
  clrNoColor: string;
  clrNoFill: string;
  clrThemeColors: string;
  clrStandardColors: string;
  clrHighlightColor: string;
  clrParagraphShading: string;

  // Visual keyboard
  kbExpand: string;
  kbExpandShort: string;
  kbMinimize: string;
  kbMinimizeShort: string;
  kbHeader: string;

  // Language tools panel
  ltTabsLabel: string;
  ltTitle: string;
  panelClose: string;
  ltScope: string;
  ltCurrentStory: string;
  ltWholeDocument: string;
  ltSpelling: string;
  ltPunctuation: string;
  ltCharReplacements: string;
  ltSpaces: string;
  ltTabProofread: string;
  ltTabNormalize: string;
  ltNoTextSelected: string;
  ltNoErrors: string;
  ltFlags: string;
  ltSpellingError: string;
  ltIgnoreOnce: string;
  ltIgnoreInDoc: string;
  ltAddToDict: string;
  ltSuggestion: string;
  ltOriginal: string;
  ltApplyChange: string;
  ltSearchPlaceholder: string;
  ltSearch: string;
  ltAddPersonal: string;
  ltSynonyms: string;
  ltAntonyms: string;
  ltDictHint: string;
  ltPersonalWords: string;
  ltRomanLabel: string;
  ltUrduOutput: string;
  ltReplaceWithConverted: string;
  ltScopeToRoman: string;
  ltCharReview: string;
  ltReplacementsFound: string;
  ltConvert: string;
  ltApplyAll: string;
  ltAlreadyStandard: string;

  // OCR correction panel
  ocrTitle: string;
  ocrFile: string;
  ocrConfidence: string;
  ocrUncertainWords: string;
  ocrAcceptAllTitle: string;
  ocrAcceptAll: string;
  ocrFixBeforeCommit: string;
  ocrCommit: string;
  ocrSourceImage: string;
  ocrSourceSaved: string;
  ocrSourcePreview: string;
  ocrRecognizedTitle: string;
  ocrSuspicious: string;
  ocrLine: string;
  ocrCorrectWord: string;
  ocrConfidenceLbl: string;

  // Preflight panel
  pfTitle: string;
  pfReadiness: string;
  pfPassed: string;
  pfFailed: string;
  pfLoading: string;
  pfNoIssues: string;

  // Collaboration bar
  collabOnline: string;
  collabRelay: string;
  collabReconnecting: string;
  collabOffline: string;
  collabLocalRecovery: string;

  // Comments panel
  cmtResolved: string;
  cmtPostComment: string;
  cmtReply: string;
  cmtWriteComment: string;
  cmtWriteReply: string;
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
    vectorPdfExport: 'ویکٹر PDF برآمد',
    exportDocx: 'DOCX برآمد',
    wordDocxExport: 'ورڈ دستاویز (.docx)',
    exportDocxTooltip: 'اصل .docx فائل بناتا ہے جو مائیکروسافٹ ورڈ، لبری آفس اور گوگل ڈاکس میں کھلتی ہے۔',
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

    bulletLibrary: 'بلیٹ لائبریری',
    numberingLibrary: 'نمبرنگ لائبریری',
    changeListLevel: 'فہرست کی سطح بدلیں',
    lineSpacingOptions: 'لائن اسپیسنگ کے اختیارات...',
    modifyStyle: 'ترمیم...',
    renameStyle: 'نام بدلیں...',
    removeFromStyleGallery: 'اسٹائل گیلری سے ہٹائیں',
    addGalleryToQat: 'گیلری کو کوئیک ایکسس ٹول بار میں شامل کریں',
    selectAll: 'سب منتخب کریں (Ctrl+A)',
    selectAllMatching: 'سب منتخب کریں: (مماثل مثالیں)',
    selectObjects: 'آبجیکٹس منتخب کریں',
    standardJustify: 'معیاری برابر',
    straightLine: 'سیدھی لکیر',
    stopPlayback: 'روکیں',
    nativeOsPassthrough: 'آپریٹنگ سسٹم کی بورڈ',
    nativeOsKeyboardHelp: 'آپریٹنگ سسٹم کی بورڈ موڈ فعال — کی میپنگ گرڈ غیر فعال ہے۔ اپنے آپریٹنگ سسٹم کے کی بورڈ سے براہ راست لکھیں۔',

    cropImage: 'تراشیں',
    inspImageCrop: 'تصویر کی تراش',
    cropInsetLeft: 'بائیں طرف سے',
    cropInsetTop: 'اوپر سے',
    cropInsetRight: 'دائیں طرف سے',
    cropInsetBottom: 'نیچے سے',
    cropReset: 'تراش ختم کریں',

    printRangeAll: 'تمام صفحات',
    printRangeCurrent: 'موجودہ صفحہ',
    printRangeCustom: 'حسب ضرورت دائرہ',
    printRangeFrom: 'صفحہ سے',
    printRangeTo: 'صفحہ تک',
    printCopiesNote: 'نوٹ: صفحات کا انتخاب RePage یہیں کرتا ہے۔ کاپیوں کی تعداد اور پرنٹر کی دیگر ترتیبات سسٹم پرنٹ ڈائیلاگ میں منتخب کریں۔',

    spellIgnoreAllInDoc: 'اس دستاویز میں ہمیشہ نظر انداز کریں',
    ltDocIgnoredTitle: 'اس دستاویز میں نظر انداز الفاظ',
    ltDocIgnoredEmpty: 'اس دستاویز میں ابھی کوئی لفظ نظر انداز نہیں ہے۔',
    ltClearDocIgnored: 'فہرست ختم کریں',

    tipMenuLanguage: 'سافٹ ویئر مینیو کی زبان',
    tipThemeMode: 'رنگوں کی تھیم',
    phDocumentName: 'دستاویز کا نام...',
    tipCustomizeQat: 'فوری رسائی پٹی ترتیب دیں',

    saveStateSaved: 'مقامی طور پر محفوظ',
    saveStateUnsaved: 'غیر محفوظ تبدیلیاں',
    saveStateSaving: 'محفوظ ہو رہا ہے...',
    saveStateFailed: 'محفوظ نہیں ہوا',

    tipResizeInspector: 'پراپرٹیز پینل کی چوڑائی بدلنے کے لیے گھسیٹیں',
    tipCloseInspector: 'پراپرٹیز انسپکٹر بند کریں',
    lblCoordX: 'X (پوائنٹ)',
    lblCoordY: 'Y (پوائنٹ)',

    inspPosHint: 'پوزیشن اور پیمائش درج کریں (pt / mm)',
    inspGeometry: 'مقام اور جسامت',
    inspWidth: 'چوڑائی (pt)',
    inspHeight: 'اونچائی (pt)',
    inspRotation: 'زاویہ',
    inspShapeFormat: 'شکل کی خصوصیات',
    inspFillColor: 'مطلوبہ رنگ:',
    inspOutlineColor: 'آؤٹ لائن رنگ:',
    inspStrokeWidth: 'آؤٹ لائن چوڑائی:',
    inspCornerRadius: 'گولائی:',
    inspEmpty: 'کینوس پر کوئی عنصر منتخب نہیں۔ عنصر کے خواص دیکھنے کے لیے اس پر کلک کریں۔',
    inspPageDims: 'صفحہ کی پیمائش',
    inspElementId: 'عنصر ID:',
    inspSize: 'سائز:',
    inspMarginTop: 'حواشی (اوپر):',
    inspMarginRight: 'حواشی (دائیں):',

    dlgFontTitle: 'فونٹ کی تشکیل',
    dlgFontTab: 'فونٹ',
    dlgFontAdvancedTab: 'حروف کا اضافی فاصلہ',
    dlgFontLabel: 'فونٹ:',
    dlgFontStyleLabel: 'فونٹ کا انداز:',
    dlgFontRegular: 'عام',
    dlgFontBoldItalic: 'جلی ترچھا',
    dlgFontSizeLabel: 'سائز:',
    dlgFontColorLabel: 'فونٹ کا رنگ:',
    dlgUnderlineStyleLabel: 'خطِ کشیدہ کا انداز:',
    dlgUnderlineNone: '(کوئی نہیں)',
    dlgUnderlineSingle: 'اکہری لکیر',
    dlgUnderlineDouble: 'دوہری لکیر',
    dlgUnderlineThick: 'موٹی لکیر',
    dlgUnderlineDotted: 'نقطہ دار',
    dlgUnderlineDashed: 'وقفے دار',
    dlgUnderlineWavy: 'لہر دار',
    dlgUnderlineColorLabel: 'خطِ کشیدہ کا رنگ:',
    dlgEffectsLabel: 'اثرات:',
    dlgStrikethrough: 'خطِ تنسیخ',
    dlgSubscript: 'زیر نویس',
    dlgSuperscript: 'بالا نویس',
    dlgCharSpacingLabel: 'حروف کا باہمی فاصلہ (کشیدہ / ٹریکنگ):',
    dlgPreviewLabel: 'پیش نظارہ:',
    dlgCancel: 'منسوخ کریں',
    dlgOk: 'ٹھیک ہے',

    dlgParaTitle: 'پیراگراف کی تشکیل',
    dlgParaSpacingTab: 'حاشیے اور فاصلے',
    dlgParaBreaksTab: 'سطر اور صفحے کی تقسیم',
    dlgParaGeneral: 'عمومی:',
    dlgParaAlignment: 'ترتیب:',
    dlgParaAlignStart: 'دائیں (اردو) / بائیں (انگریزی)',
    dlgParaAlignLeft: 'بائیں',
    dlgParaAlignCenter: 'درمیان',
    dlgParaAlignRight: 'دائیں',
    dlgParaAlignJustify: 'برابر',
    dlgParaDirection: 'سمت:',
    dlgParaRtl: 'دائیں سے بائیں (اردو)',
    dlgParaLtr: 'بائیں سے دائیں (انگریزی)',
    dlgParaIndentation: 'حاشیہ بندی:',
    dlgParaIndentLevel: 'حاشیے کی سطح:',
    dlgParaFirstLineIndent: 'پہلی سطر کا حاشیہ (پوائنٹ):',
    dlgParaSpacing: 'فاصلے:',
    dlgParaBefore: 'اوپر (پوائنٹ):',
    dlgParaAfter: 'نیچے (پوائنٹ):',
    dlgParaLineSpacing: 'سطور کا فاصلہ:',
    dlgParaSingle: 'اکہرا (1.0)',
    dlgParaLines115: '1.15 سطریں',
    dlgParaLines15: '1.5 سطریں',
    dlgParaLines25: '2.5 سطریں',
    dlgParaLines30: '3.0 سطریں',
    dlgParaDouble: 'دوہرا (2.0)',
    dlgParaPagination: 'صفحہ بندی:',
    dlgParaWidowOrphan: 'اکیلی سطر کا کنٹرول',
    dlgParaKeepWithNext: 'اگلے پیراگراف کے ساتھ رکھیں',

    mnuBorderBottom: 'نچلا کنارہ',
    mnuBorderTop: 'اوپری کنارہ',
    mnuBorderLeft: 'بایاں کنارہ',
    mnuBorderRight: 'دایاں کنارہ',
    mnuBorderNone: 'کنارہ نہیں',
    mnuBorderAll: 'تمام کنارے',
    mnuBorderOutside: 'بیرونی کنارے',
    mnuBordersShading: 'کنارے اور رنگ...',

    clrAutomatic: 'خودکار',
    clrCustom: 'اپنی پسند:',
    clrNoColor: 'کوئی رنگ نہیں',
    clrNoFill: 'کوئی رنگ / خالی',
    clrThemeColors: 'تھیم کے رنگ',
    clrStandardColors: 'معیاری رنگ',
    clrHighlightColor: 'نمایاں رنگ',
    clrParagraphShading: 'پیراگراف کا شیڈنگ رنگ',

    kbExpand: 'بصری کی بورڈ کھولیں',
    kbExpandShort: 'کی بورڈ کھولیں',
    kbMinimize: 'بصری کی بورڈ چھپائیں',
    kbMinimizeShort: 'کی بورڈ چھپائیں',
    kbHeader: 'اردو کی بورڈ:',

    ltTabsLabel: 'زبان کے آلات کے ٹیب',

    ltTitle: 'اردو زبان کے آلات',
    panelClose: 'بند کریں',
    ltScope: 'دائرہ کار:',
    ltCurrentStory: 'موجودہ تحریر',
    ltWholeDocument: 'مکمل دستاویز',
    ltSpelling: 'املاء:',
    ltPunctuation: 'رموزِ اوقاف:',
    ltCharReplacements: 'حروفی متبادلات:',
    ltSpaces: 'سپیس:',
    ltTabProofread: 'املاء و تصحیح',
    ltTabNormalize: 'حروف کی جانچ',
    ltNoTextSelected: 'کوئی متن منتخب نہیں ہے۔',
    ltNoErrors: 'اس دائرہ کار میں املاء اور زبان کی کوئی غلطی نہیں ملی!',
    ltFlags: 'نشاندہیاں:',
    ltSpellingError: 'املاء کی غلطی:',
    ltIgnoreOnce: 'ایک بار نظر انداز کریں',
    ltIgnoreInDoc: 'دستاویز میں نظر انداز کریں',
    ltAddToDict: '+ لغت میں شامل کریں',
    ltSuggestion: 'تجویز:',
    ltOriginal: 'اصل:',
    ltApplyChange: 'تبدیل لاگو کریں',
    ltSearchPlaceholder: 'لفظ تلاش کریں (مثلاً: پاکستان، علم، ترانہ)...',
    ltSearch: 'تلاش',
    ltAddPersonal: '+ ذاتی لغت میں شامل کریں',
    ltSynonyms: 'مترادفات:',
    ltAntonyms: 'متضادات:',
    ltDictHint: 'لغت میں لفظ تلاش کرنے کے لیے اوپر ٹائپ کریں۔',
    ltPersonalWords: 'ذاتی لغت کے الفاظ',
    ltRomanLabel: 'رومن اردو درج کریں:',
    ltUrduOutput: 'اردو نستعلیق پیش نظارہ:',
    ltReplaceWithConverted: 'منتخب متن کو اس تبدیل شدہ اردو سے بدلیں',
    ltScopeToRoman: 'موجودہ دائرہ کار کے اردو متن کو رومن میں لائیں',
    ltCharReview: 'اردو کریکٹر ریویو: عربی کاف (ك) اور یاء (ي) کو معیاری اردو (ک/ی) میں بدلتا ہے۔',
    ltReplacementsFound: 'حروف کی تبدیلی کے امکانات ملے:',
    ltConvert: 'تبدیل کریں',
    ltApplyAll: 'تمام کا اطلاق کریں',
    ltAlreadyStandard: 'اس دائرہ کار کا متن پہلے سے مکمل معیاری اردو پر مشتمل ہے۔',

    ocrTitle: 'اردو تصویر / PDF متن شناسی',
    ocrFile: 'فائل:',
    ocrConfidence: 'مجموعی اعتماد:',
    ocrUncertainWords: 'مشکوک الفاظ:',
    ocrAcceptAllTitle: 'تمام مشکوک الفاظ کو باقاعدہ قبول کریں',
    ocrAcceptAll: 'تمام الفاظ کی تائید کریں',
    ocrFixBeforeCommit: 'صفحے پر شامل کرنے سے پہلے تمام مشکوک الفاظ کی تصحیح کریں',
    ocrCommit: 'صفحے پر شامل کریں',
    ocrSourceImage: 'اصل تصویر:',
    ocrSourceSaved: 'باقاعدہ محفوظ شدہ اصل اثاثہ',
    ocrSourcePreview: '[محفوظ شدہ اصل تصویر کا منظر]',
    ocrRecognizedTitle: 'شناخت شدہ اردو متن اور تصحیح:',
    ocrSuspicious: 'مشکوک',
    ocrLine: 'سطر',
    ocrCorrectWord: 'منتخب لفظ کی تصحیح:',
    ocrConfidenceLbl: 'اعتماد:',
    pfTitle: 'پری فلائٹ رپورٹ',
    pfReadiness: 'PDF تیاری',
    pfPassed: 'پاس',
    pfFailed: 'نااہل',
    pfLoading: 'دستاویز ڈیٹا لوڈ ہو رہا ہے...',
    pfNoIssues: 'کوئی مسائل نہیں پائے گئے',

    collabOnline: 'آن لائن',
    collabRelay: 'TURN ریلے',
    collabReconnecting: 'دوبارہ رابطہ...',
    collabOffline: 'آف لائن',
    collabLocalRecovery: 'مقامی بحالی فعال',

    // Comments panel
    cmtResolved: 'حل شدہ دکھائیں',
    cmtPostComment: 'تبصرہ بھیجیں',
    cmtReply: 'جواب دیں',
    cmtWriteComment: 'نیا تبصرہ لکھیں...',
    cmtWriteReply: 'جواب لکھیں...',
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
    vectorPdfExport: 'Vector PDF Export',
    exportDocx: 'Export DOCX',
    wordDocxExport: 'Word Document (.docx)',
    exportDocxTooltip: 'Generates a real .docx file that opens in Microsoft Word, LibreOffice and Google Docs.',
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

    bulletLibrary: 'BULLET LIBRARY',
    numberingLibrary: 'NUMBERING LIBRARY',
    changeListLevel: 'CHANGE LIST LEVEL',
    lineSpacingOptions: 'Line Spacing Options...',
    modifyStyle: 'Modify...',
    renameStyle: 'Rename...',
    removeFromStyleGallery: 'Remove from Style Gallery',
    addGalleryToQat: 'Add Gallery to Quick Access Toolbar',
    selectAll: 'Select All (Ctrl+A)',
    selectAllMatching: 'Select All: (Matching Instances)',
    selectObjects: 'Select Objects',
    standardJustify: 'Standard Justify',
    straightLine: 'Straight Line',
    stopPlayback: 'Stop',
    nativeOsPassthrough: 'Native OS Pass-through',
    nativeOsKeyboardHelp: 'Native OS Keyboard Mode Active — Key mapping grid is disabled. Type directly using your operating system keyboard.',

    cropImage: 'Crop',
    inspImageCrop: 'Image Crop',
    cropInsetLeft: 'Left Edge',
    cropInsetTop: 'Top Edge',
    cropInsetRight: 'Right Edge',
    cropInsetBottom: 'Bottom Edge',
    cropReset: 'Reset Crop',

    printRangeAll: 'All Pages',
    printRangeCurrent: 'Current Page',
    printRangeCustom: 'Custom Range',
    printRangeFrom: 'From Page',
    printRangeTo: 'To Page',
    printCopiesNote: 'Note: RePage applies the page range here. The number of copies and other printer options are chosen in the system print dialog.',

    spellIgnoreAllInDoc: 'Ignore All in This Document',
    ltDocIgnoredTitle: 'Ignored in This Document',
    ltDocIgnoredEmpty: 'No words are ignored in this document yet.',
    ltClearDocIgnored: 'Clear List',

    tipMenuLanguage: 'Software Menu Language',
    tipThemeMode: 'Color Theme Mode',
    phDocumentName: 'Document Name...',
    tipCustomizeQat: 'Customize Quick Access Toolbar',

    saveStateSaved: 'Saved locally',
    saveStateUnsaved: 'Unsaved changes',
    saveStateSaving: 'Saving…',
    saveStateFailed: 'Save failed',

    tipResizeInspector: 'Drag to resize Properties Panel width',
    tipCloseInspector: 'Close Properties Inspector',
    lblCoordX: 'X (pt)',
    lblCoordY: 'Y (pt)',

    inspPosHint: 'Enter position and measurements (pt / mm)',
    inspGeometry: 'Geometry',
    inspWidth: 'Width (pt)',
    inspHeight: 'Height (pt)',
    inspRotation: 'Rotation',
    inspShapeFormat: 'Shape Format',
    inspFillColor: 'Fill Color:',
    inspOutlineColor: 'Outline Color:',
    inspStrokeWidth: 'Stroke Width:',
    inspCornerRadius: 'Corner Radius:',
    inspEmpty: 'No element selected on canvas. Click an element to see its properties.',
    inspPageDims: 'Page Dimensions',
    inspElementId: 'Element ID:',
    inspSize: 'Size:',
    inspMarginTop: 'Margins (Top):',
    inspMarginRight: 'Margins (Right):',

    dlgFontTitle: 'Font Formatting',
    dlgFontTab: 'Font',
    dlgFontAdvancedTab: 'Advanced Character Spacing',
    dlgFontLabel: 'Font:',
    dlgFontStyleLabel: 'Font style:',
    dlgFontRegular: 'Regular',
    dlgFontBoldItalic: 'Bold Italic',
    dlgFontSizeLabel: 'Size:',
    dlgFontColorLabel: 'Font color:',
    dlgUnderlineStyleLabel: 'Underline style:',
    dlgUnderlineNone: '(None)',
    dlgUnderlineSingle: 'Single Line',
    dlgUnderlineDouble: 'Double Line',
    dlgUnderlineThick: 'Thick Line',
    dlgUnderlineDotted: 'Dotted',
    dlgUnderlineDashed: 'Dashed',
    dlgUnderlineWavy: 'Wave / Wavy',
    dlgUnderlineColorLabel: 'Underline color:',
    dlgEffectsLabel: 'Effects:',
    dlgStrikethrough: 'Strikethrough',
    dlgSubscript: 'Subscript',
    dlgSuperscript: 'Superscript',
    dlgCharSpacingLabel: 'Character Spacing (Kashida / Tracking):',
    dlgPreviewLabel: 'Preview:',
    dlgCancel: 'Cancel',
    dlgOk: 'OK',

    dlgParaTitle: 'Paragraph Formatting',
    dlgParaSpacingTab: 'Indents and Spacing',
    dlgParaBreaksTab: 'Line and Page Breaks',
    dlgParaGeneral: 'General:',
    dlgParaAlignment: 'Alignment:',
    dlgParaAlignStart: 'Right (Urdu) / Left (English)',
    dlgParaAlignLeft: 'Left',
    dlgParaAlignCenter: 'Centered',
    dlgParaAlignRight: 'Right',
    dlgParaAlignJustify: 'Justified',
    dlgParaDirection: 'Direction:',
    dlgParaRtl: 'Right-to-Left (Urdu)',
    dlgParaLtr: 'Left-to-Right (English)',
    dlgParaIndentation: 'Indentation:',
    dlgParaIndentLevel: 'Indent Level:',
    dlgParaFirstLineIndent: 'First Line Indent (pt):',
    dlgParaSpacing: 'Spacing:',
    dlgParaBefore: 'Before (pt):',
    dlgParaAfter: 'After (pt):',
    dlgParaLineSpacing: 'Line Spacing:',
    dlgParaSingle: 'Single (1.0)',
    dlgParaLines115: '1.15 lines',
    dlgParaLines15: '1.5 lines',
    dlgParaLines25: '2.5 lines',
    dlgParaLines30: '3.0 lines',
    dlgParaDouble: 'Double (2.0)',
    dlgParaPagination: 'Pagination:',
    dlgParaWidowOrphan: 'Widow/Orphan control',
    dlgParaKeepWithNext: 'Keep with next paragraph',

    mnuBorderBottom: 'Bottom Border',
    mnuBorderTop: 'Top Border',
    mnuBorderLeft: 'Left Border',
    mnuBorderRight: 'Right Border',
    mnuBorderNone: 'No Border',
    mnuBorderAll: 'All Borders',
    mnuBorderOutside: 'Outside Borders',
    mnuBordersShading: 'Borders and Shading...',

    clrAutomatic: 'Automatic',
    clrCustom: 'Custom:',
    clrNoColor: 'No Color',
    clrNoFill: 'No Color / No Fill',
    clrThemeColors: 'Theme Colors',
    clrStandardColors: 'Standard Colors',
    clrHighlightColor: 'Highlight Color',
    clrParagraphShading: 'Paragraph Shading Color',

    kbExpand: 'Expand Visual Keyboard',
    kbExpandShort: 'Expand Keyboard',
    kbMinimize: 'Minimize Visual Keyboard',
    kbMinimizeShort: 'Minimize Keyboard',
    kbHeader: 'Urdu Keyboard:',

    ltTabsLabel: 'Language Tools Tabs',

    ltTitle: 'Urdu Language Tools',
    panelClose: 'Close',
    ltScope: 'Scope:',
    ltCurrentStory: 'Current Story',
    ltWholeDocument: 'Whole Document',
    ltSpelling: 'Spelling:',
    ltPunctuation: 'Punctuation:',
    ltCharReplacements: 'Character replacements:',
    ltSpaces: 'Spaces:',
    ltTabProofread: 'Spelling & Proofread',
    ltTabNormalize: 'Character Check',
    ltNoTextSelected: 'No text selected.',
    ltNoErrors: 'No spelling or language errors found in this scope!',
    ltFlags: 'Flags:',
    ltSpellingError: 'Spelling error:',
    ltIgnoreOnce: 'Ignore once',
    ltIgnoreInDoc: 'Ignore in document',
    ltAddToDict: '+ Add to dictionary',
    ltSuggestion: 'Suggestion:',
    ltOriginal: 'Original:',
    ltApplyChange: 'Apply',
    ltSearchPlaceholder: 'Search word (e.g. Pakistan, ilm, tarana)...',
    ltSearch: 'Search',
    ltAddPersonal: '+ Add to personal dictionary',
    ltSynonyms: 'Synonyms:',
    ltAntonyms: 'Antonyms:',
    ltDictHint: 'Type above to search the dictionary.',
    ltPersonalWords: 'Personal dictionary words',
    ltRomanLabel: 'Type Roman Urdu:',
    ltUrduOutput: 'Urdu Nastaliq preview:',
    ltReplaceWithConverted: 'Replace selected text with this converted Urdu',
    ltScopeToRoman: "Convert this scope's Urdu text to Roman",
    ltCharReview: 'Urdu character review: converts Arabic Kaaf (ك) and Yaa (ي) to standard Urdu (ک/ی).',
    ltReplacementsFound: 'character replacements available:',
    ltConvert: 'Convert',
    ltApplyAll: 'Apply all',
    ltAlreadyStandard: "This scope's text is already standard Urdu.",

    ocrTitle: 'Urdu Image / PDF OCR',
    ocrFile: 'File:',
    ocrConfidence: 'Overall Confidence:',
    ocrUncertainWords: 'Uncertain words:',
    ocrAcceptAllTitle: 'Accept all uncertain words as correct',
    ocrAcceptAll: 'Accept all words',
    ocrFixBeforeCommit: 'Fix all uncertain words before adding to page',
    ocrCommit: 'Add to page',
    ocrSourceImage: 'Source image:',
    ocrSourceSaved: 'Preserved source asset',
    ocrSourcePreview: '[Preserved source image preview]',
    ocrRecognizedTitle: 'Recognized Urdu text & corrections:',
    ocrSuspicious: 'suspicious',
    ocrLine: 'Line',
    ocrCorrectWord: 'Correct selected word:',
    ocrConfidenceLbl: 'Confidence:',
    pfTitle: 'Preflight Report',
    pfReadiness: 'PDF Readiness',
    pfPassed: 'Passed',
    pfFailed: 'Failed',
    pfLoading: 'Loading document data...',
    pfNoIssues: 'No issues found',

    collabOnline: 'Online',
    collabRelay: 'TURN Relay',
    collabReconnecting: 'Reconnecting...',
    collabOffline: 'Offline',
    collabLocalRecovery: 'Local recovery active',

    // Comments panel
    cmtResolved: 'Resolved',
    cmtPostComment: 'Post Comment',
    cmtReply: 'Reply',
    cmtWriteComment: 'Write a comment...',
    cmtWriteReply: 'Write a reply...',
  },
};

/**
 * Maps the App-level SaveState union ('Saved locally' | 'Unsaved changes' | 'Saving…' | 'Save failed')
 * to the current UI language for display. Keeps the state machine itself language-neutral.
 */
export function translateSaveState(state: string, lang: UiLanguage): string {
  const t = DICTIONARY[lang];
  switch (state) {
    case 'Saved locally':
      return t.saveStateSaved;
    case 'Unsaved changes':
      return t.saveStateUnsaved;
    case 'Saving…':
      return t.saveStateSaving;
    case 'Save failed':
      return t.saveStateFailed;
    default:
      return state;
  }
}
