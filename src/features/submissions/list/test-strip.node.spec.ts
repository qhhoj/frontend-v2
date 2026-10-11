import { describe, expect, it } from 'vitest';
import { stripCells, stripCounts } from './test-strip';
import type { TestSummary } from './test-strip';

const summary = (extra: Partial<TestSummary> = {}): TestSummary => ({
  unit: 'case',
  statuses: ['AC', 'WA', 'AC', 'TLE', 'WA'],
  batches: [null, null, null, null, null],
  more: 0,
  total: 8,
  ...extra,
});

describe('test strip cells', () => {
  it('draws the judged tests, then the problem tests not judged yet as pending', () => {
    const cells = stripCells(summary());
    expect(cells.map((cell) => cell.status)).toEqual([
      'AC',
      'WA',
      'AC',
      'TLE',
      'WA',
      null,
      null,
      null,
    ]);
    expect(cells.at(-1)?.number).toBe(8);
  });

  it('draws no pending cells past the cap or when results were cut off', () => {
    expect(stripCells(summary({ more: 12 }))).toHaveLength(5);
    expect(stripCells(summary({ total: 500 }))).toHaveLength(100);
  });

  it('numbers batch cells by their batch', () => {
    const cells = stripCells(
      summary({ unit: 'batch', statuses: ['AC', 'WA'], batches: [2, 3], total: null }),
    );
    expect(cells).toEqual([
      { number: 2, status: 'AC' },
      { number: 3, status: 'WA' },
    ]);
  });
});

describe('test strip counts', () => {
  it('counts the accepted tests out of the problem total and the failures by verdict', () => {
    expect(stripCounts(summary())).toEqual({
      passed: 2,
      outOf: 8,
      failures: [
        ['WA', 2],
        ['TLE', 1],
      ],
      more: 0,
    });
  });

  it('counts out of the shown tests when the rest were cut off', () => {
    expect(stripCounts(summary({ more: 20 }))).toMatchObject({ outOf: 5, more: 20 });
  });
});
