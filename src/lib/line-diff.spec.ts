import { describe, expect, it } from 'vitest';
import {
  diffSummary,
  foldSameRuns,
  isIdentical,
  lineCountOf,
  lineDiff as boundedLineDiff,
  splitSourceLines,
  wordSegments,
} from './line-diff';
import type { DiffRow } from './line-diff';

/** The rows of a pair that is within the edit budget. */
const lineDiff = (left: string, right: string): DiffRow[] => boundedLineDiff(left, right)!;
/** [kind, left line number, right line number] per row: the shape a reader sees. */
const shape = (rows: DiffRow[]) =>
  rows.map((row) => [row.kind, row.left?.number ?? null, row.right?.number ?? null]);
const lines = (count: number, prefix = 'line') =>
  Array.from({ length: count }, (_unused, index) => `${prefix} ${index + 1}`).join('\n');

describe('splitSourceLines', () => {
  it.each([
    ['', []],
    ['\n', []],
    ['a', ['a']],
    ['a\n', ['a']],
    ['a\r\nb\r\n', ['a', 'b']],
    ['a\rb', ['a', 'b']],
    ['a\n\n', ['a', '']],
  ])('splits %j into %j', (source, expected) => {
    expect(splitSourceLines(source)).toEqual(expected);
  });

  it('counts lines after normalising', () => {
    expect(lineCountOf('a\r\nb\r\nc\r\n')).toBe(3);
  });
});

describe('lineDiff', () => {
  it.each([
    [
      'an insert',
      'a\nc\n',
      'a\nb\nc\n',
      [
        ['same', 1, 1],
        ['added', null, 2],
        ['same', 2, 3],
      ],
    ],
    [
      'a delete',
      'a\nb\nc',
      'a\nc',
      [
        ['same', 1, 1],
        ['removed', 2, null],
        ['same', 3, 2],
      ],
    ],
    ['a changed line', 'x = 1;', 'x = 2;', [['changed', 1, 1]]],
    [
      'a longer removal than addition',
      'a\nb\nc\nd',
      'a\nx\nd',
      [
        ['same', 1, 1],
        ['changed', 2, 2],
        ['removed', 3, null],
        ['same', 4, 3],
      ],
    ],
    [
      'an empty left side',
      '',
      'a\nb',
      [
        ['added', null, 1],
        ['added', null, 2],
      ],
    ],
  ])('numbers the rows of %s', (_name, left, right, expected) => {
    expect(shape(lineDiff(left, right))).toEqual(expected);
  });

  it('reports a moved line as one removed and one added row, both flagged as moved', () => {
    const rows = lineDiff('alpha();\nb\nc', 'b\nc\nalpha();');
    expect(shape(rows)).toEqual([
      ['removed', 1, null],
      ['same', 2, 1],
      ['same', 3, 2],
      ['added', null, 3],
    ]);
    expect(rows.filter((row) => row.isMoved).map((row) => row.kind)).toEqual(['removed', 'added']);
  });

  it('matches a moved line by its trimmed text, so a re-indented move is still a move', () => {
    const rows = lineDiff('x\nfoo();\ny', 'x\ny\n    foo();');
    expect(rows.filter((row) => row.isMoved)).toHaveLength(2);
  });

  it('never flags short lines such as a closing brace as moved', () => {
    const rows = lineDiff('x\n}\ny\nelse {', 'x\ny\nelse {\n}');
    expect(rows.some((row) => row.isMoved)).toBe(false);
    const [removed] = lineDiff('abcd();\nx', 'x\nabcd();');
    expect(removed!.isMoved).toBe(true);
  });

  it('gives up with null, and promptly, on two large unrelated sources', () => {
    const left = lines(5000, 'left');
    const right = lines(5000, 'right');
    const started = performance.now();
    expect(boundedLineDiff(left, right)).toBeNull();
    expect(performance.now() - started).toBeLessThan(1500);
  });

  it('still diffs a large source with few edits', () => {
    const base = lines(5000);
    const rows = boundedLineDiff(base, base.replace('line 2500', 'edited 2500'));
    expect(rows).not.toBeNull();
    expect(rows!.filter((row) => row.kind !== 'same')).toHaveLength(1);
  });

  it('never flags blank lines as moved', () => {
    const rows = lineDiff('\na\nb', 'a\nb\n\nc');
    expect(rows.some((row) => row.isMoved)).toBe(false);
  });

  it('flags a change that only differs in whitespace', () => {
    const [spaced] = lineDiff('int x;', 'int  x;');
    expect(spaced).toMatchObject({ kind: 'changed', isWhitespaceOnly: true });
    const [renamed] = lineDiff('int x;', 'int y;');
    expect(renamed).toMatchObject({ kind: 'changed', isWhitespaceOnly: false });
  });

  it('treats CRLF and a missing final newline as no difference', () => {
    const rows = lineDiff('a\r\nb\r\n', 'a\nb');
    expect(isIdentical(rows)).toBe(true);
    expect(diffSummary(rows)).toEqual({ added: 0, removed: 0, same: 2 });
  });

  it('keeps every line of both sides exactly once, in order', () => {
    const left = 'a\nb\nc\nd\ne';
    const right = 'a\nx\nc\ne\nf';
    const rows = lineDiff(left, right);
    expect(rows.flatMap((row) => (row.left ? [row.left.text] : []))).toEqual(left.split('\n'));
    expect(rows.flatMap((row) => (row.right ? [row.right.text] : []))).toEqual(right.split('\n'));
  });
});

describe('diffSummary', () => {
  it('counts a changed row as one added and one removed line', () => {
    expect(diffSummary(lineDiff('a\nb\nc', 'a\nB\nc\nd'))).toEqual({
      added: 2,
      removed: 1,
      same: 2,
    });
  });
});

describe('wordSegments', () => {
  it('marks only the differing whitespace run', () => {
    const { left, right } = wordSegments('int x;', 'int  x;');
    expect(left.filter((part) => part.isChanged).map((part) => part.text)).toEqual([' ']);
    expect(right.filter((part) => part.isChanged).map((part) => part.text)).toEqual(['  ']);
  });

  it.each([
    ['cout << a;', 'cout << b;'],
    ['for (int i = 0; i < n; i++)', 'for (int x : a) {'],
    ['', 'new'],
  ])('rebuilds each side exactly from its segments (%s)', (before, after) => {
    const { left, right } = wordSegments(before, after);
    expect(left.map((part) => part.text).join('')).toBe(before);
    expect(right.map((part) => part.text).join('')).toBe(after);
    expect(right.some((part) => part.isChanged)).toBe(true);
  });

  it('marks a very long pair whole instead of diffing it word by word', () => {
    const before = 'a '.repeat(1500);
    const after = 'b '.repeat(1500);
    expect(wordSegments(before, after)).toEqual({
      left: [{ text: before, isChanged: true }],
      right: [{ text: after, isChanged: true }],
    });
  });
});

describe('foldSameRuns', () => {
  const blockShape = (left: string, right: string) =>
    foldSameRuns(lineDiff(left, right)).map((block) => [block.kind, block.rows.length]);

  it('folds long equal runs and keeps two lines of context around a change', () => {
    const left = `${lines(10, 'top')}\nold\n${lines(10, 'bottom')}`;
    const right = `${lines(10, 'top')}\nnew\n${lines(10, 'bottom')}`;
    expect(blockShape(left, right)).toEqual([
      ['folded', 8],
      ['open', 5],
      ['folded', 8],
    ]);
  });

  it('leaves a short equal run between two changes open', () => {
    const left = `a\n${lines(5)}\nb`;
    const right = `A\n${lines(5)}\nB`;
    expect(blockShape(left, right)).toEqual([['open', 7]]);
  });

  it('never loses a row', () => {
    const rows = lineDiff(
      lines(40),
      `${lines(20)}\nextra\n${lines(40).split('\n').slice(20).join('\n')}`,
    );
    expect(foldSameRuns(rows).flatMap((block) => block.rows)).toEqual(rows);
  });
});
