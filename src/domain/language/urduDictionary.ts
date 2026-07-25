export interface DictionaryEntry {
  word: string;
  normalizedWord: string;
  definition?: string | undefined;
  grammaticalCategory?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'conjunction' | 'preposition' | undefined;
  root?: string | undefined;
}

// Built-in core Urdu dictionary lexicon dataset
const URDU_LEXICON_RAW: Array<[string, string, DictionaryEntry['grammaticalCategory']?]> = [
  ['پاکستان', 'اسلامی جمہوریہ پاکستان، جنوبی ایشیا کا ایک ملک', 'noun'],
  ['اردو', 'پاکستان کی قومی اور رابطے کی زبان', 'noun'],
  ['سلام', 'دعا، سلامتی، تحیہ', 'noun'],
  ['شکریہ', 'اظہارِ تشکر، احسان مندی', 'noun'],
  ['خوش', 'مسرور، شادمان', 'adjective'],
  ['آمدید', 'خیر مقدم، استقبال', 'noun'],
  ['کتاب', 'تحریر شدہ اور جلد شدہ اوراق کا مجموعہ', 'noun'],
  ['قلم', 'لکھنے کا آلہ، روشنی و علم کا ذریعہ', 'noun'],
  ['علم', 'جاننا، دانش، واقفیت', 'noun'],
  ['محبت', 'الفت، پیار، چاہت', 'noun'],
  ['دوست', 'رفیق، حبیب، ساتھی', 'noun'],
  ['وطن', 'دیس، جنم بھومی، ملکی سر زمین', 'noun'],
  ['شعر', 'منظوم کلام، نظم کی ایک بیت', 'noun'],
  ['ادب', 'شائستگی، تمدن، تخلیقی تحریر', 'noun'],
  ['شاعری', 'منظوم نگاری، سخن وری', 'noun'],
  ['صفحہ', 'ورق کا ایک رخ، پنہ', 'noun'],
  ['تحریر', 'لکھائی، متن، مضمون', 'noun'],
  ['عنوان', 'سرخی، مطلع، نام', 'noun'],
  ['مضمون', 'مقالہ، تحریر، انشائیہ', 'noun'],
  ['قومی', 'ملکی، ریاست سے متعلق', 'adjective'],
  ['زبان', 'گوئی، بول چال، تکلم', 'noun'],
  ['خوبصورت', 'حسین، جمیل، دلکش', 'adjective'],
  ['بہت', 'زیادہ، فراوان', 'adverb'],
  ['اچھا', 'عمدہ، نیک، بہترین', 'adjective'],
  ['کیا', 'سوالیہ کلمہ', 'noun'],
  ['حال', 'کیفیت، موجودہ وقت', 'noun'],
  ['ہے', 'فعلِ معاون (واحد)', 'verb'],
  ['ہیں', 'فعلِ معاون (جمع)', 'verb'],
  ['تھا', 'فعلِ ماضی (واحد)', 'verb'],
  ['تھے', 'فعلِ ماضی (جمع)', 'verb'],
  ['کا', 'حرفِ اضافت', 'preposition'],
  ['کی', 'حرفِ اضافت (مونث)', 'preposition'],
  ['کے', 'حرفِ اضافت (جمع/احترام)', 'preposition'],
  ['میں', 'حرفِ جار، اندر', 'preposition'],
  ['پر', 'حرفِ جار، اوپر', 'preposition'],
  ['اور', 'حرفِ عطف، مزید', 'conjunction'],
  ['سے', 'حرفِ جار، کی جانب سے', 'preposition'],
  ['کو', 'حرفِ مفعول', 'preposition'],
  ['یہ', 'اسم اشارہ قریب', 'noun'],
  ['وہ', 'اسم اشارہ بعید', 'noun'],
];

const customDictionaryWords: Set<string> = new Set();

export function normalizeForDictionary(word: string): string {
  if (!word) return '';
  return word
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Strip Aerab
    .replace(/\u0643/g, '\u06A9') // Arabic Kaf -> Urdu Kaf
    .replace(/[\u064A\u0649]/g, '\u06CC'); // Arabic/Farsi Yeh -> Urdu Yeh
}

const DICTIONARY_MAP: Map<string, DictionaryEntry> = new Map();

URDU_LEXICON_RAW.forEach(([word, definition, cat]) => {
  const norm = normalizeForDictionary(word);
  DICTIONARY_MAP.set(norm, {
    word,
    normalizedWord: norm,
    definition,
    grammaticalCategory: cat,
  });
});

export function isWordInDictionary(word: string): boolean {
  if (!word || word.trim().length === 0) return true;
  const norm = normalizeForDictionary(word);
  return DICTIONARY_MAP.has(norm) || customDictionaryWords.has(norm);
}

export function lookupUrduWord(word: string): DictionaryEntry | null {
  if (!word) return null;
  const norm = normalizeForDictionary(word);
  const entry = DICTIONARY_MAP.get(norm);
  if (entry) return entry;

  if (customDictionaryWords.has(norm)) {
    return {
      word,
      normalizedWord: norm,
      definition: 'صارف کی ذاتی لغت میں شامل لفظ',
    };
  }

  return null;
}

export function addCustomWord(word: string): void {
  if (word && word.trim()) {
    customDictionaryWords.add(normalizeForDictionary(word));
  }
}
