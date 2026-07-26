// Roman-to-Urdu Transliteration Digraph & Character Map
const ROMAN_TO_URDU_DIGRAPHS: Array<[string, string]> = [
  ['khush', 'خوش'],
  ['shukriya', 'شکریہ'],
  ['pakistan', 'پاکستان'],
  ['amdeed', 'آمدید'],
  ['kh', 'خ'],
  ['gh', 'غ'],
  ['sh', 'ش'],
  ['ch', 'چ'],
  ['zh', 'ژ'],
  ['th', 'تھ'],
  ['ph', 'پھ'],
  ['bh', 'بھ'],
  ['dh', 'دھ'],
  ['jh', 'جھ'],
  ['aa', 'آ'],
  ['ee', 'ی'],
  ['oo', 'و'],
];

const ROMAN_TO_URDU_SINGLE: Record<string, string> = {
  a: 'ا',
  b: 'ب',
  p: 'پ',
  t: 'ت',
  j: 'ج',
  h: 'ح',
  d: 'د',
  r: 'ر',
  z: 'ز',
  s: 'س',
  f: 'ف',
  q: 'ق',
  k: 'ک',
  g: 'گ',
  l: 'ل',
  m: 'م',
  n: 'ن',
  v: 'و',
  w: 'و',
  y: 'ی',
  e: 'ے',
  i: 'ی',
  o: 'و',
  u: 'و',
};

// Urdu-to-Roman Transliteration Map
const URDU_TO_ROMAN_MAP: Record<string, string> = {
  آ: 'aa',
  ا: 'a',
  ب: 'b',
  پ: 'p',
  ت: 't',
  ٹ: 't',
  ث: 's',
  ج: 'j',
  چ: 'ch',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ڈ: 'd',
  ذ: 'z',
  ر: 'r',
  ڑ: 'r',
  ز: 'z',
  ژ: 'zh',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'z',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ک: 'k',
  گ: 'g',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ں: 'n',
  و: 'w',
  ہ: 'h',
  ء: '',
  ی: 'y',
  ے: 'e',
};

const LATIN_ABBREVIATIONS = new Set([
  'http', 'https', 'pdf', 'url', 'html', 'css', 'js', 'json', 'api', 'id',
  'e.g.', 'i.e.', 'p.s.', 'etc.', 'vs.', 'mr.', 'mrs.', 'dr.', 'prof.'
]);

const URL_OR_EMAIL_REGEX = /^(https?:\/\/|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
const LATIN_ABBR_REGEX = /^(HTTP|HTTPS|PDF|URL|HTML|CSS|JS|JSON|API|ID|e\.g\.|i\.e\.|p\.s\.|etc\.|vs\.|Mr\.|Mrs\.|Dr\.|Prof\.)$/i;

function transliterateSingleRomanWord(word: string): string {
  if (!word) return '';
  if (URL_OR_EMAIL_REGEX.test(word) || LATIN_ABBR_REGEX.test(word) || LATIN_ABBREVIATIONS.has(word.toLowerCase())) {
    return word; // preserve Latin URL, email, or abbreviation
  }

  let text = word.toLowerCase();

  // Replace digraphs first
  for (const [digraph, urdu] of ROMAN_TO_URDU_DIGRAPHS) {
    const regex = new RegExp(digraph, 'g');
    text = text.replace(regex, urdu);
  }

  // Replace remaining single characters
  let result = '';
  for (const char of text) {
    if (ROMAN_TO_URDU_SINGLE[char]) {
      result += ROMAN_TO_URDU_SINGLE[char];
    } else {
      result += char;
    }
  }

  return result;
}

export function romanToUrdu(romanInput: string): string {
  if (!romanInput) return '';

  // Match URLs, emails, words, whitespace, or punctuation
  const tokenRegex = /(https?:\/\/[^\s،؛؟]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|www\.[^\s،؛؟]+|[a-zA-Z0-9._-]+|\s+|[^\s\w]+)/g;
  const matches = romanInput.match(tokenRegex) || [romanInput];

  return matches
    .map((token) => {
      if (/^\s+$/.test(token) || /^[^\s\w]+$/.test(token)) {
        return token;
      }
      return transliterateSingleRomanWord(token);
    })
    .join('');
}

const URDU_TO_ROMAN_WORDS: Record<string, string> = {
  پاکستان: 'pakistan',
  شکریہ: 'shukriya',
  خوش: 'khush',
  آمدید: 'amdeed',
};

export function urduToRoman(urduInput: string): string {
  if (!urduInput) return '';

  if (URDU_TO_ROMAN_WORDS[urduInput.trim()]) {
    return URDU_TO_ROMAN_WORDS[urduInput.trim()]!;
  }

  let result = '';
  for (const char of urduInput) {
    if (URDU_TO_ROMAN_MAP[char] !== undefined) {
      result += URDU_TO_ROMAN_MAP[char];
    } else {
      result += char;
    }
  }

  return result.trim();
}
