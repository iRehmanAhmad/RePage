export interface ProofreadIssue {
  type: 'missing-space' | 'character-confusion' | 'diacritic-misuse' | 'punctuation-spacing';
  description: string;
  index: number;
  length: number;
  originalSnippet: string;
  replacementSuggestion: string;
}

export function proofreadUrduText(text: string): ProofreadIssue[] {
  if (!text) return [];

  const issues: ProofreadIssue[] = [];

  // 1. Missing space before auxiliary verbs/words (e.g. "کیاحال ہے" -> "کیا حال ہے", "پاکستانہے" -> "پاکستان ہے")
  const auxVerbRegex = /([\u0600-\u06FF]{2,})(ہے|ہیں|تھا|تھے|گا|گی|گے|حال)\b/g;
  let match: RegExpExecArray | null;

  while ((match = auxVerbRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const prefix = match[1];
    const aux = match[2];

    // Exception check: ignore words that legitimately end with these characters (e.g., "جگہ", "گناہ")
    if (prefix && aux && !['یہ', 'وہ', 'کہ', 'نہ', 'گہ'].includes(fullMatch)) {
      issues.push({
        type: 'missing-space',
        description: `فعلِ معاون "${aux}" اور سابقہ لفظ "${prefix}" کے درمیان فاصلہ (اسپیس) کی کمی`,
        index: match.index,
        length: fullMatch.length,
        originalSnippet: fullMatch,
        replacementSuggestion: `${prefix} ${aux}`,
      });
    }
  }

  // 2. Character confusion: Arabic Kaf 'ك' (U+0643) vs Urdu Kaf 'ک' (U+06A9)
  const arabicKafRegex = /\u0643+/g;
  while ((match = arabicKafRegex.exec(text)) !== null) {
    issues.push({
      type: 'character-confusion',
      description: 'عربی کاف "ك" کی جگہ اردو کاف "ک" استعمال کریں',
      index: match.index,
      length: match[0].length,
      originalSnippet: match[0],
      replacementSuggestion: match[0].replace(/\u0643/g, '\u06A9'),
    });
  }

  // 3. Character confusion: Arabic/Farsi Yeh 'ي'/'ى' vs Urdu Yeh 'ی'
  const farsiYehRegex = /[\u064A\u0649]+/g;
  while ((match = farsiYehRegex.exec(text)) !== null) {
    issues.push({
      type: 'character-confusion',
      description: 'عربی/فارسی یاء "ي/ى" کی جگہ اردو چھوٹی ی "ی" استعمال کریں',
      index: match.index,
      length: match[0].length,
      originalSnippet: match[0],
      replacementSuggestion: match[0].replace(/[\u064A\u0649]/g, '\u06CC'),
    });
  }

  // 4. Punctuation spacing anomalies: Space before Urdu comma/fullstop (e.g. "لفظ ،" -> "لفظ،")
  const punctSpacingRegex = /\s+([،؛؟۔])/g;
  while ((match = punctSpacingRegex.exec(text)) !== null) {
    issues.push({
      type: 'punctuation-spacing',
      description: `علامتِ وقف "${match[1]}" سے پہلے زائد اسپیس موجود ہے`,
      index: match.index,
      length: match[0].length,
      originalSnippet: match[0],
      replacementSuggestion: match[1],
    });
  }

  return issues;
}
