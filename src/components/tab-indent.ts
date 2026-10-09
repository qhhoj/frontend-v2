/** What one Tab inserts in the plain textarea (low-power mode). */
export const INDENT = '    ';
const LEADING_INDENT = /^(?: {1,4}|\t)/;

export interface TextEdit {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

/** Replaces the selection with one indent and puts the caret after it. */
export function indentAt({ text, selectionStart, selectionEnd }: TextEdit): TextEdit {
  const caret = selectionStart + INDENT.length;
  return {
    text: `${text.slice(0, selectionStart)}${INDENT}${text.slice(selectionEnd)}`,
    selectionStart: caret,
    selectionEnd: caret,
  };
}

/** Removes up to four leading spaces (or one tab) from the caret's line; the caret moves with the text. */
export function outdentLineAt({ text, selectionStart, selectionEnd }: TextEdit): TextEdit {
  const lineStart = text.slice(0, selectionStart).lastIndexOf('\n') + 1;
  const removed = LEADING_INDENT.exec(text.slice(lineStart))?.[0].length ?? 0;
  const shift = (position: number) => Math.max(lineStart, position - removed);
  return {
    text: text.slice(0, lineStart) + text.slice(lineStart + removed),
    selectionStart: shift(selectionStart),
    selectionEnd: shift(selectionEnd),
  };
}
