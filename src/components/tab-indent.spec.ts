import { afterEach, describe, expect, it, vi } from 'vitest';
import { indentAt, outdentLineAt, writeEdit } from './tab-indent';

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

describe('writeEdit', () => {
  const fieldWith = (value: string) => {
    const field = document.createElement('textarea');
    field.value = value;
    return field;
  };
  afterEach(() => Reflect.deleteProperty(document, 'execCommand'));

  it('types only the changed span through execCommand so the browser keeps undo', () => {
    const typed: unknown[][] = [];
    document.execCommand = vi.fn((...args: unknown[]) => {
      typed.push(args);
      return false;
    });
    const field = fieldWith('aa');
    writeEdit(field, indentAt(at('aa', 1)));
    expect(typed).toEqual([['insertText', false, '    ']]);
    expect(field.value).toBe('a    a');
    expect([field.selectionStart, field.selectionEnd]).toEqual([5, 5]);
  });

  it('deletes through execCommand when the edit only removes text', () => {
    const commands: unknown[][] = [];
    document.execCommand = vi.fn((...args: unknown[]) => {
      commands.push(args);
      return true;
    });
    const field = fieldWith('x\n    y');
    writeEdit(field, outdentLineAt(at('x\n    y', 7)));
    expect(commands).toEqual([['delete']]);
  });

  it('falls back to setting the value where execCommand is missing', () => {
    const field = fieldWith('ab');
    writeEdit(field, indentAt(at('ab', 1)));
    expect(field.value).toBe('a    b');
    expect([field.selectionStart, field.selectionEnd]).toEqual([5, 5]);
  });
});
