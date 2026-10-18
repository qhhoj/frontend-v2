// The Vietnamese copy convention (docs/decisions.md), checked by scripts/check-vi-copy.mjs over every src/i18n/**/vi.json:
// - In an open oa/oe/uy syllable the tone mark sits on the main vowel: hóa, hòa, xóa, khỏe, hủy, tùy, thủy (never hoá, hoà, xoá, khoẻ, huỷ, tuỳ, thuỷ).
//   The pattern needs the pair at the end of the word, so a syllable with a final consonant (hoàn, toán, thuyền) keeps its mark on the second
//   vowel, and it never matches after q, so qu- syllables (quý, quỳ, quả) keep theirs too.
// - A quotation uses “ ”, never the ASCII double quote.

/** A word-final oa/oe/uy whose tone mark sits on the second vowel, not after q. Run it on NFC text. */
export const SECOND_VOWEL_MARK = /(?<!q)(?:o[áàảãạéèẻẽẹ]|u[ýỳỷỹỵ])(?!\p{L})/giu;

/** "oá" → "óa", "uỷ" → "ủy": the tone mark moves from the second vowel to the first. */
export function moveMarkToMainVowel(pair) {
  const [first, second, ...marks] = pair.normalize('NFD');
  return (first + marks.join('') + second).normalize('NFC');
}

/** What is wrong with one message, as short sentences; empty when it follows the convention. */
export function valueProblems(value) {
  const text = value.normalize('NFC');
  const marks = [...text.matchAll(SECOND_VOWEL_MARK)].map(
    ([pair]) => `tone mark on the second vowel: ${pair} (write ${moveMarkToMainVowel(pair)})`,
  );
  return text.includes('"') ? [...marks, 'ASCII double quote (write “ ”)'] : marks;
}

/** "path.to.key: problem" for every string in a parsed vi.json that breaks the convention. */
export function viCopyOffences(messages, path = []) {
  if (typeof messages === 'string') {
    return valueProblems(messages).map((problem) => `${path.join('.')}: ${problem}`);
  }
  if (messages === null || typeof messages !== 'object') return [];
  return Object.entries(messages).flatMap(([key, child]) => viCopyOffences(child, [...path, key]));
}
