import { describe, expect, it } from 'vitest';
import { casesFromPairs } from './test-cases';
import {
  markFile,
  newPairsOnly,
  pairArchiveFiles,
  splitPoints,
  totalPointsOf,
} from './zip-autofill';

const inputsOf = (files: string[]) => pairArchiveFiles(files).pairs.map((pair) => pair.input);

describe('pairArchiveFiles', () => {
  it('pairs flat numbered files by stem', () => {
    expect(pairArchiveFiles(['1.out', '1.in', '2.in', '2.out']).pairs).toEqual([
      { key: '1', input: '1.in', output: '1.out' },
      { key: '2', input: '2.in', output: '2.out' },
    ]);
  });

  it('pairs files inside one folder per test (Themis layout), any case', () => {
    const { pairs, unpaired } = pairArchiveFiles([
      'Test01/BAI.INP',
      'Test01/BAI.OUT',
      'Test02/bai.inp',
      'Test02/bai.out',
      'Test03/bai.inp',
    ]);
    expect(pairs.map((pair) => [pair.input, pair.output])).toEqual([
      ['Test01/BAI.INP', 'Test01/BAI.OUT'],
      ['Test02/bai.inp', 'Test02/bai.out'],
    ]);
    expect(unpaired).toEqual(['Test03/bai.inp']);
  });

  it('never pairs across folders', () => {
    const { pairs, unpaired } = pairArchiveFiles(['a/1.in', 'b/1.out']);
    expect(pairs).toEqual([]);
    expect(unpaired).toEqual(['a/1.in', 'b/1.out']);
  });

  it('pairs the input/output prefix style, with or without a listed extension', () => {
    const files = ['input1.txt', 'output1.txt', 'input2.in', 'output2.out', 't/input', 't/output'];
    expect(pairArchiveFiles(files).pairs.map((pair) => [pair.input, pair.output])).toEqual([
      ['input1.txt', 'output1.txt'],
      ['input2.in', 'output2.out'],
      ['t/input', 't/output'],
    ]);
  });

  it('accepts .ans and .ok outputs and prefers .out on a shared stem', () => {
    expect(pairArchiveFiles(['1.in', '1.ans', '2.in', '2.ok']).pairs).toHaveLength(2);
    const { pairs, unpaired } = pairArchiveFiles(['1.in', '1.ok', '1.ans', '1.out']);
    expect(pairs).toEqual([{ key: '1', input: '1.in', output: '1.out' }]);
    expect(unpaired).toEqual(['1.ans', '1.ok']);
  });

  it('lets the extension decide before the prefix', () => {
    expect(markFile('output.in')?.side).toBe('input');
    expect(markFile('input.ans')?.side).toBe('output');
    expect(markFile('Input3.txt')).toEqual({ side: 'input', key: '3', rank: 2 });
    expect(markFile('readme.txt')).toBeNull();
  });

  it('sorts naturally: 2 before 10, test2 before test10', () => {
    expect(inputsOf(['10.in', '10.out', '2.in', '2.out', '1.in', '1.out'])).toEqual([
      '1.in',
      '2.in',
      '10.in',
    ]);
    expect(inputsOf(['test10/a.in', 'test10/a.out', 'test2/a.in', 'test2/a.out'])).toEqual([
      'test2/a.in',
      'test10/a.in',
    ]);
  });

  it('lists lone inputs and outputs as unpaired and the rest as others, ignoring macOS debris', () => {
    const result = pairArchiveFiles([
      '1.in',
      '1.out',
      '2.in',
      '3.out',
      'init.yml',
      'checker.cpp',
      '__MACOSX/._1.in',
      '.DS_Store',
      'docs/',
    ]);
    expect(result.pairs).toHaveLength(1);
    expect(result.unpaired).toEqual(['2.in', '3.out']);
    expect(result.others).toEqual(['checker.cpp', 'init.yml']);
  });

  it('finds nothing in an empty archive', () => {
    expect(pairArchiveFiles([])).toEqual({ pairs: [], unpaired: [], others: [] });
  });
});

describe('splitPoints', () => {
  it('adds up to the total with the remainder on the last tests', () => {
    expect(splitPoints(100, 3)).toEqual([33, 33, 34]);
    expect(splitPoints(100, 7)).toEqual([14, 14, 14, 14, 14, 15, 15]);
    expect(splitPoints(100, 4)).toEqual([25, 25, 25, 25]);
  });

  it('keeps the sum when there are more tests than points', () => {
    const shares = splitPoints(3, 5);
    expect(shares).toEqual([0, 0, 1, 1, 1]);
  });

  it('sums to the total for any count', () => {
    for (let count = 1; count <= 60; count += 1)
      expect(splitPoints(1200, count).reduce((sum, share) => sum + share, 0)).toBe(1200);
  });

  it('gives nothing for no tests', () => {
    expect(splitPoints(100, 0)).toEqual([]);
  });
});

describe('totalPointsOf', () => {
  it("uses the problem's whole positive points, else 100", () => {
    expect(totalPointsOf(1200)).toBe(1200);
    expect(totalPointsOf(0)).toBe(100);
    expect(totalPointsOf(null)).toBe(100);
    expect(totalPointsOf(2.5)).toBe(100);
  });
});

describe('newPairsOnly and casesFromPairs', () => {
  it('drops pairs already in the list', () => {
    const { pairs } = pairArchiveFiles(['1.in', '1.out', '2.in', '2.out']);
    expect(newPairsOnly(pairs, [{ input: '1.in', output: '1.out' }])).toEqual([pairs[1]]);
  });

  it('makes one single test per pair with its points', () => {
    const { pairs } = pairArchiveFiles(['1.in', '1.out', '2.in', '2.out']);
    const rows = casesFromPairs(pairs, [40, 60]);
    expect(
      rows.map(({ type, input, output, points }) => ({ type, input, output, points })),
    ).toEqual([
      { type: 'C', input: '1.in', output: '1.out', points: 40 },
      { type: 'C', input: '2.in', output: '2.out', points: 60 },
    ]);
    expect(new Set(rows.map((row) => row.key)).size).toBe(2);
  });
});
