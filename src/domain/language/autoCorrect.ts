import { isSpellingCorrect } from './urduSpellchecker';
import { normalizeForDictionary } from './urduDictionary';

/**
 * Auto-correct (Phase 4 batch 12): when the user FINISHES a word by typing a
 * delimiter (space / punctuation) after it, a word that is a KNOWN typo is
 * replaced in place with its correction as one undoable edit.
 *
 * The pairs below are curated, not generated: every key is a common
 * misspelling that is NOT itself a word (the batch-12 test suite verifies
 * each key against the vendored English wordlist + core sets and each value
 * for dictionary membership, so a pair whose key turns out to be a real word
 * fails the build instead of silently "correcting" valid text). Sources for
 * the English list: the 15 known-typo exclusions documented in
 * scripts/build-english-wordlist.mjs (misspellings that leaked into the
 * frequency-derived upstream list precisely because they are so common),
 * extended with the standard most-common-misspellings canon (transposed
 * letters, doubled/missing consonants, -able/-ible and ie/ei swaps).
 *
 * Urdu pairs are deliberately few: only slips whose key is never a valid
 * Urdu word (the checker flags it) and whose correction is unambiguous —
 * mostly ھ/ح, ٹ/ت, ض/ز, ذ/ز and ڑھ/رھ confusions. Pairs that the dictionary
 * normalization already accepts (e.g. Arabic ك/ي forms, aerab variants)
 * can never appear here: the checker judges them correct, so they are
 * never auto-corrected (see the isSpellingCorrect guard in
 * getAutoCorrection, which the tests exercise for every pair).
 */

/** English typo -> correction (keys lowercase; values lowercase dictionary
 * words). 162 pairs: the project's documented known-typo seed plus the
 * documented common-misspellings canon (Wikipedia's "Commonly misspelled
 * English words", sourced from Oxford/Britannica lists), every pair
 * filtered through the invariant enforced by autoCorrect.test.ts (key
 * absent from the vendored wordlist, value present). Pairs whose key the
 * vendored frequency list itself contains (freind, wierd, libary,
 * grammer, thier, seige, publically, ...) are deliberately ABSENT: the
 * app's own dictionary accepts those strings as words, so auto-correct
 * must not fight the dictionary. Archaic/variant forms (garanty, bouy,
 * surprize, heighth) were also removed by hand. */
export const ENGLISH_AUTO_CORRECT: Readonly<Record<string, string>> = {
  teh: 'the',
  recieve: 'receive',
  decieve: 'deceive',
  percieve: 'perceive',
  adress: 'address',
  seperate: 'separate',
  occured: 'occurred',
  goverment: 'government',
  enviroment: 'environment',
  accomodate: 'accommodate',
  acommodate: 'accommodate',
  definately: 'definitely',
  independant: 'independent',
  untill: 'until',
  writen: 'written',
  wich: 'which',
  formating: 'formatting',
  funtion: 'function',
  sieze: 'seize',
  maintanance: 'maintenance',
  maintnance: 'maintenance',
  imediately: 'immediately',
  changable: 'changeable',
  collegue: 'colleague',
  collaegue: 'colleague',
  dissapoint: 'disappoint',
  embarass: 'embarrass',
  fourty: 'forty',
  guidence: 'guidance',
  mountian: 'mountain',
  omision: 'omission',
  ommision: 'omission',
  preferance: 'preference',
  pronounciation: 'pronunciation',
  propoganda: 'propaganda',
  repitition: 'repetition',
  requirment: 'requirement',
  secratary: 'secretary',
  secretery: 'secretary',
  sincerly: 'sincerely',
  vaccuum: 'vacuum',
  vacume: 'vacuum',
  aparent: 'apparent',
  apparant: 'apparent',
  apparrent: 'apparent',
  freindly: 'friendly',
  harrass: 'harass',
  hierachy: 'hierarchy',
  heirarchy: 'hierarchy',
  mispell: 'misspell',
  misspel: 'misspell',
  nineth: 'ninth',
  opinon: 'opinion',
  paralel: 'parallel',
  pregnent: 'pregnant',
  proffesional: 'professional',
  refridgerator: 'refrigerator',
  reguardless: 'regardless',
  swiming: 'swimming',
  threshhold: 'threshold',
  towords: 'towards',
  twelth: 'twelfth',
  visious: 'vicious',
  wensday: 'wednesday',
  withold: 'withhold',
  absense: 'absence',
  absance: 'absence',
  acceptible: 'acceptable',
  accidentaly: 'accidentally',
  acknowlege: 'acknowledge',
  aknowledge: 'acknowledge',
  acquaintence: 'acquaintance',
  aquaintance: 'acquaintance',
  aquire: 'acquire',
  aquit: 'acquit',
  acrage: 'acreage',
  acerage: 'acreage',
  adultary: 'adultery',
  adviseable: 'advisable',
  agression: 'aggression',
  allegaince: 'allegiance',
  alegiance: 'allegiance',
  allmost: 'almost',
  anually: 'annually',
  annualy: 'annually',
  athiest: 'atheist',
  awfull: 'awful',
  becomeing: 'becoming',
  bellweather: 'bellwether',
  bouyant: 'buoyant',
  camoflage: 'camouflage',
  camoflague: 'camouflage',
  cauhgt: 'caught',
  caugt: 'caught',
  cematery: 'cemetery',
  comitted: 'committed',
  comparsion: 'comparison',
  conceed: 'concede',
  congradulate: 'congratulate',
  consciencious: 'conscientious',
  consious: 'conscious',
  contraversy: 'controversy',
  dilema: 'dilemma',
  drunkeness: 'drunkenness',
  equiptment: 'equipment',
  excede: 'exceed',
  extreem: 'extreme',
  facinating: 'fascinating',
  garantee: 'guarantee',
  garentee: 'guarantee',
  heigth: 'height',
  hygene: 'hygiene',
  hygine: 'hygiene',
  hipocrit: 'hypocrite',
  ignorence: 'ignorance',
  immitate: 'imitate',
  innoculate: 'inoculate',
  inteligence: 'intelligence',
  intelligance: 'intelligence',
  liesure: 'leisure',
  liberry: 'library',
  medeval: 'medieval',
  medevil: 'medieval',
  mideval: 'medieval',
  milennium: 'millennium',
  miniture: 'miniature',
  necessery: 'necessary',
  occasionaly: 'occasionally',
  occurrance: 'occurrence',
  outragous: 'outrageous',
  parliment: 'parliament',
  passtime: 'pastime',
  pasttime: 'pastime',
  perseverence: 'perseverance',
  personell: 'personnel',
  personel: 'personnel',
  playright: 'playwright',
  playwrite: 'playwright',
  possesion: 'possession',
  preceed: 'precede',
  presance: 'presence',
  privelege: 'privilege',
  professer: 'professor',
  promiss: 'promise',
  quarentine: 'quarantine',
  questionnair: 'questionnaire',
  readible: 'readable',
  referance: 'reference',
  refrence: 'reference',
  revelant: 'relevant',
  religius: 'religious',
  restarant: 'restaurant',
  restaraunt: 'restaurant',
  rythem: 'rhythm',
  similer: 'similar',
  tomatos: 'tomatoes',
  tyrany: 'tyranny',
  upholstry: 'upholstery',
  usible: 'usable',
  wellfare: 'welfare',
  welfair: 'welfare',
  writeing: 'writing',
};

/**
 * Urdu typo -> correction. Keys are stored in normalizeForDictionary form
 * (the lookup normalizes the typed word the same way); values are the
 * correct surface forms. Every pair is test-verified: the key is flagged
 * by the spellchecker and the value is a dictionary word. Common variant
 * spellings the dictionary accepts (نھی، خاس، کئے، لئے، چاہئے...) are
 * deliberately absent — auto-correct never fights the dictionary.
 */
export const URDU_AUTO_CORRECT: Readonly<Record<string, string>> = {
  'حاسل': 'حاصل',
  'محربانی': 'مہربانی',
  'تھیک': 'ٹھیک',
  'مجے': 'مجھے',
  'غلت': 'غلط',
  'زرور': 'ضرور',
  'زروری': 'ضروری',
  'مسال': 'مثال',
  'حزور': 'حضور',
  'پرھا': 'پڑھا',
  'پرھائی': 'پڑھائی',
  'سحت': 'صحت',
  'وکت': 'وقت',
  'سحیح': 'صحیح',
  'اسل': 'اصل',
};

/**
 * Characters that COMPLETE a word for auto-correct purposes: whitespace
 * and punctuation (Latin + Urdu). Enter is deliberately absent — a
 * paragraph break is a structural edit, not a typed delimiter.
 */
export const WORD_DELIMITERS: ReadonlySet<string> = new Set([
  ' ',
  '\t',
  '.',
  ',',
  '!',
  '?',
  ';',
  ':',
  '،',
  '۔',
  '؟',
  '؛',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
  '"',
  "'",
  '«',
  '»',
  '-',
  '–',
  '—',
  '/',
  '…',
]);

export function isWordDelimiter(ch: string): boolean {
  return ch.length === 1 && WORD_DELIMITERS.has(ch);
}

function matchCapitalization(typed: string, correction: string): string {
  if (typed.length > 1 && typed === typed.toUpperCase() && typed !== typed.toLowerCase()) {
    return correction.toUpperCase();
  }
  const first = typed.charAt(0);
  if (first && first === first.toUpperCase() && first !== first.toLowerCase()) {
    return correction.charAt(0).toUpperCase() + correction.slice(1);
  }
  return correction;
}

export interface AutoCorrectOptions {
  /** The active document's own ignore list (never auto-corrected). */
  documentIgnoredWords?: Iterable<string> | undefined;
}

/**
 * Returns the correction for a just-completed word, or null when the word
 * must be left alone. A word is corrected only when ALL of these hold:
 *  - it appears in the curated typo map for its script;
 *  - the spellchecker judges it incorrect — this single guard covers the
 *    personal dictionary, the session ignore AND the per-document ignore
 *    list, and double-protects against a map key ever being a valid word.
 * The returned correction preserves the typed word's capitalization
 * pattern (English only; Urdu has no case).
 */
export function getAutoCorrection(
  word: string,
  options?: AutoCorrectOptions,
): string | null {
  if (!word || word.length < 2) return null;
  if (isSpellingCorrect(word, { documentIgnoredWords: options?.documentIgnoredWords })) {
    return null;
  }
  // Latin path (keys are lowercase ASCII).
  if (/^[A-Za-z]+$/.test(word)) {
    const hit = ENGLISH_AUTO_CORRECT[word.toLowerCase()];
    return hit ? matchCapitalization(word, hit) : null;
  }
  // Urdu path: lookup on the same normalized key the checker uses.
  const key = normalizeForDictionary(word);
  const hit = key ? URDU_AUTO_CORRECT[key] : undefined;
  return hit ?? null;
}
