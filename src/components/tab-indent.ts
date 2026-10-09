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

/** The smallest span of `before` that `after` rewrites: shared head and tail are kept. */
function changedSpan(before: string, after: string) {
  let head = 0;
  while (head < before.length && head < after.length && before[head] === after[head]) head += 1;
  let tail = 0;
  const room = Math.min(before.length, after.length) - head;
  while (tail < room && before.at(-1 - tail) === after.at(-1 - tail)) tail += 1;
  return {
    start: head,
    end: before.length - tail,
    inserted: after.slice(head, after.length - tail),
  };
}

/**
 * Puts `next` into the textarea. Typing through `execCommand` keeps the browser's undo stack, so Ctrl+Z
 * undoes an indent; where it is missing or refuses, the value is set directly (undo then restarts).
 */
export function writeEdit(field: HTMLTextAreaElement, next: TextEdit): void {
  const { start, end, inserted } = changedSpan(field.value, next.text);
  field.setSelectionRange(start, end);
  const isNative =
    typeof document.execCommand === 'function' &&
    (inserted === ''
      ? document.execCommand('delete')
      : document.execCommand('insertText', false, inserted));
  if (!isNative || field.value !== next.text) field.value = next.text;
  field.setSelectionRange(next.selectionStart, next.selectionEnd);
}
