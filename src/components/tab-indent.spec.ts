import { describe, expect, it } from 'vitest';
import { indentAt, outdentLineAt } from './tab-indent';

const at = (text: string, selectionStart: number, selectionEnd = selectionStart) => ({
  text,
  selectionStart,
  selectionEnd,
});

describe('indentAt', () => {
  it.each([
    ['inserts four spaces at the caret', at('ab', 1), at('a    b', 5)],
    ['replaces a selection', at('abcd', 1, 3), at('a    d', 5)],
    ['works at the start', at('x', 0), at('    x', 4)],
  ])('%s', (_name, edit, expected) => {
    expect(indentAt(edit)).toEqual(expected);
  });
});

describe('outdentLineAt', () => {
  it.each([
    ['removes four leading spaces of the caret line', at('a\n      b', 9), at('a\n  b', 5)],
    ['removes fewer when fewer are there', at('a\n  b', 5), at('a\nb', 3)],
    ['removes one tab', at('\tx', 2), at('x', 1)],
    ['leaves an unindented line alone', at('x\ny', 3), at('x\ny', 3)],
    ['keeps a caret inside the indent at the line start', at('      b', 2), at('  b', 0)],
    ['reads the first line when the caret is at 0', at('\n    x', 0), at('\n    x', 0)],
  ])('%s', (_name, edit, expected) => {
    expect(outdentLineAt(edit)).toEqual(expected);
  });
});
