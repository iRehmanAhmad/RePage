/**
 * Random Text Generator Engine (=rand(), =متن(), =اردو(), =lorem())
 * Supports:
 * - English: =rand(), =rand(p,s), =lorem(), =lorem(p,s)
 * - Urdu: =متن(), =متن(p,s), =متن(p،s), =اردو(), =اردو(p,s), =لورم(), =نص()
 */

export const ENGLISH_RAND_SENTENCES = [
  'Video provides a powerful way to help you prove your point.',
  'When you click Online Video, you can paste the embed code for the video you want to add.',
  'You can also type a keyword to search online for the video that best fits your document.',
  'To make your document look professionally produced, Word provides header, footer, cover page, and text box designs that complement each other.',
  'For example, you can add a matching cover page, header, and sidebar.',
  'Click Insert and then choose the elements you want from the different galleries.',
  'Themes and styles also help keep your document coordinated.',
  'When you click Design and choose a new Theme, the pictures, charts, and SmartArt graphics change to match your new theme.',
  'When you apply styles, your headings change to match the new theme.',
  'Save time in Word with new buttons that show up where you need them.',
  'To change the way a picture fits in your document, click it and a button for layout options appears next to it.',
  'When you work on a table, click where you want to add a row or a column, and then click the plus sign.',
];

export const URDU_RAND_SENTENCES = [
  'اردو ایک انتہائی شیریں، خوبصورت اور فصیح زبان ہے جس کا رسم الخط خوبصورت نستعلیق میں لکھا جاتا ہے۔',
  'پاکستان اور برصغیر کی ثقافت میں اردو ادب کو ایک منفرد اور ممتاز مقام حاصل ہے۔',
  'علم اور حکمت کا حصول ہر انسان کے لیے باعث فخر اور ذریعہ نجات ہوتا ہے۔',
  'کتابیں انسان کی بہترین دوست ہیں جو اسے علم، تربیت اور شعور کی نئی راہیں دکھاتی ہیں۔',
  'جدید دور میں ڈیجیٹل ٹیکنالوجی نے زبان و ادب کی اشاعت کو بے حد آسان اور پرکشش بنا دیا ہے۔',
  'محنت اور لگن سے کام کرنے والے انسان ہمیشہ زندگی کے ہر میدان میں کامران ہوتے ہیں۔',
  'فطرت کا حسن اور خوبصورتی انسانی روح کو شاداب اور پرسکون بناتی ہے۔',
  'تاریخ شاہد ہے کہ وہی قومیں ترقی کرتی ہیں جو اپنے اسلاف کی قدروں اور علم کی پاسداری کرتی ہیں۔',
  'صداقت، امانت اور حسن اخلاق انسان کی شخصیت کو نکھارتے ہیں اور معاشرے میں عزت کا باعث بنتے ہیں۔',
  'اردو شعر و ادب کی محفلیں ذہن و دل کو تازگی اور نئی بصیرت عطا کرتی ہیں۔',
  'تعلیم کا بنیادی مقصد انسان میں احساس ذمہ داری اور انسانیت کی خدمت کا جذبہ پیدا کرنا ہے۔',
  'وقت کی پابندی اور منظم زندگی انسان کو اعلیٰ مقاصد کے حصول میں مدد فراہم کرتی ہے۔',
];

export interface RandParseResult {
  fullMatch: string;
  lang: 'en' | 'ur';
  paragraphsCount: number;
  sentencesCount: number;
}

/**
 * Checks if a given line text ends with a valid rand command.
 * Supported commands:
 * - English: =rand() or =rand(p,s) or =lorem() or =lorem(p,s)
 * - Urdu: =متن() or =متن(p,s) or =متن(p،s) or =اردو() or =اردو(p,s) or =لورم() or =نص()
 */
export function parseRandCommand(lineText: string): RandParseResult | null {
  const regex = /=(rand|lorem|متن|اردو|لورم|نص)(?:\((\d+)?(?:[,،]\s*(\d+))?\))?\s*$/i;
  const match = lineText.match(regex);
  if (!match) return null;

  const fullMatch = match[0].trim();
  const cmdName = (match[1] || '').toLowerCase();
  const pArg = match[2] ? parseInt(match[2], 10) : 3;
  const sArg = match[3] ? parseInt(match[3], 10) : 4;

  const paragraphsCount = Math.min(Math.max(pArg || 3, 1), 25);
  const sentencesCount = Math.min(Math.max(sArg || 4, 1), 20);

  // English commands: =rand, =lorem
  // Urdu commands: =متن, =اردو, =لورم, =نص
  const isUrdu = ['متن', 'اردو', 'لورم', 'نص'].includes(cmdName);
  const lang: 'en' | 'ur' = isUrdu ? 'ur' : 'en';

  return {
    fullMatch,
    lang,
    paragraphsCount,
    sentencesCount,
  };
}

/**
 * Generates an array of paragraph strings in English or Urdu.
 */
export function generateParagraphs(lang: 'en' | 'ur', pCount: number, sCount: number): string[] {
  const sentencesPool = lang === 'ur' ? URDU_RAND_SENTENCES : ENGLISH_RAND_SENTENCES;
  const paragraphs: string[] = [];
  let sentenceIdx = 0;

  for (let p = 0; p < pCount; p++) {
    const sentences: string[] = [];
    for (let s = 0; s < sCount; s++) {
      const sentence = sentencesPool[sentenceIdx % sentencesPool.length] || '';
      sentences.push(sentence);
      sentenceIdx++;
    }
    paragraphs.push(sentences.join(' '));
  }

  return paragraphs;
}
