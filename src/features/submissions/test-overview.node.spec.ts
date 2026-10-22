import { describe, expect, it } from 'vitest';
import { submissionCase } from '@/test/fixtures';
import {
  buildOverviewRows,
  caseTitle,
  formatCasePoints,
  pendingPositions,
  reasonParts,
  scoreConversion,
} from './test-overview';

const testCase = (position: number, status: 'AC' | 'WA' | 'TLE' | 'SC', batch: number | null) =>
  submissionCase({ position, status, batch, points: status === 'AC' ? 10 : 0, total: 10 });

describe('buildOverviewRows', () => {
  it('groups by subtask and takes the first failing status as the verdict', () => {
    const rows = buildOverviewRows(
      [
        testCase(1, 'AC', 1),
        testCase(2, 'AC', 1),
        testCase(3, 'AC', 2),
        testCase(4, 'WA', 2),
        testCase(5, 'TLE', 3),
        testCase(6, 'SC', 3),
        testCase(7, 'SC', 3),
      ],
      null,
    );
    expect(rows.map((row) => [row.batch, row.verdict, row.failedPosition])).toEqual([
      [1, 'AC', null],
      [2, 'WA', 4],
      [3, 'TLE', 5],
    ]);
    expect(rows[2]).toMatchObject({ passedCount: 0, skippedCount: 2 });
  });

  it('scores a subtask by its weakest case out of its largest total, unless the API gives the batch summary', () => {
    const cases = [testCase(1, 'AC', 1), testCase(2, 'WA', 1)];
    expect(buildOverviewRows(cases, null)[0]).toMatchObject({ earned: 0, max: 10 });
    const partial = [
      submissionCase({ position: 1, status: 'AC', batch: 1, points: 30, total: 30 }),
      submissionCase({ position: 2, status: 'WA', batch: 1, points: 12, total: 30 }),
    ];
    expect(buildOverviewRows(partial, null)[0]).toMatchObject({ earned: 12, max: 30 });
    const summary = [{ batch: 1, points: 5, total: 40, status: 'WA' as const }];
    expect(buildOverviewRows(cases, summary)[0]).toMatchObject({ earned: 5, max: 40 });
  });

  it('makes one row of all tests, summing their points, when there are no subtasks', () => {
    const rows = buildOverviewRows(
      [testCase(1, 'AC', null), testCase(2, 'AC', null), testCase(3, 'WA', null)],
      null,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ batch: null, earned: 20, max: 30, verdict: 'WA' });
  });

  it('keeps the tests outside any subtask in a summed row beside the subtasks, so the rows add up to the case points', () => {
    const cases = [testCase(1, 'WA', null), testCase(2, 'AC', 1), testCase(3, 'AC', 1)];
    const rows = buildOverviewRows(cases, null);
    const plain = rows.find((row) => row.batch === null);
    expect(plain).toMatchObject({ rule: 'sum', earned: 0, max: 10, verdict: 'WA' });
    expect(plain?.cases.map((row) => row.position)).toEqual([1]);
    expect(rows.flatMap((row) => row.cases)).toHaveLength(cases.length);
    expect(rows.reduce((sum, row) => sum + row.max, 0)).toBe(20);
  });
});

const scored = (position: number, points: number, batch: number | null = null, total = 5) =>
  submissionCase({ position, status: 'AC', batch, points, total });

describe('partial tests in the overview', () => {
  it('counts full and partial tests apart and reads "15 correct · 5 partially correct"', () => {
    const cases = [
      ...Array.from({ length: 15 }, (_unused, index) => scored(index + 1, 5)),
      ...[3.86, 2.89, 2.54, 2.89, 2.73].map((points, index) => scored(16 + index, points)),
    ];
    const [row] = buildOverviewRows(cases, null);
    expect(row).toMatchObject({ verdict: 'PC', rule: 'sum', passedCount: 15, partialCount: 5 });
    expect(reasonParts(row!)).toEqual([
      { key: 'passed', values: { count: 15 } },
      { key: 'partial', values: { count: 5 } },
    ]);
  });

  it('names the lowest test of a subtask that took part of its points', () => {
    const cases = [scored(1, 30, 1, 30), scored(2, 17.3, 1, 30), scored(3, 23, 1, 30)];
    const [row] = buildOverviewRows(cases, null);
    expect(row).toMatchObject({ verdict: 'PC', rule: 'min', earned: 17.3, lowestPosition: 2 });
    expect(reasonParts(row!).map((part) => part.key)).toEqual(['passed', 'partial', 'lowest']);
  });

  it('keeps the failing verdict first and still counts the partial tests', () => {
    const cases = [
      scored(1, 2.5),
      submissionCase({ position: 2, status: 'WA', batch: null, points: 0, total: 5 }),
    ];
    const [row] = buildOverviewRows(cases, null);
    expect(row).toMatchObject({ verdict: 'WA', passedCount: 0, partialCount: 1 });
    expect(reasonParts(row!).map((part) => part.key)).toEqual(['failed', 'partial']);
  });

  it('says "n/n passed" only when every test has full points', () => {
    const [row] = buildOverviewRows([scored(1, 5), scored(2, 5)], null);
    expect(row).toMatchObject({ verdict: 'AC', partialCount: 0, lowestPosition: null });
    expect(reasonParts(row!)).toEqual([{ key: 'allPassed', values: { passed: 2, total: 2 } }]);
  });
});

describe('scoreConversion', () => {
  it('explains a partial score from the test points', () => {
    expect(scoreConversion(89.9, 100, 719.2, 800)?.share).toBeCloseTo(0.899);
  });

  it('has nothing to explain at full marks, while grading, or without tests', () => {
    expect(scoreConversion(100, 100, 800, 800)).toBeNull();
    expect(scoreConversion(50, 100, null, 800)).toBeNull();
    expect(scoreConversion(0, 0, 0, 800)).toBeNull();
  });

  it('stays quiet when the formula does not give the stored points (no partial scoring)', () => {
    expect(scoreConversion(50, 100, 0, 800)).toBeNull();
  });
});

describe('pendingPositions', () => {
  const graded = [1, 2, 3].map((position) => submissionCase({ position }));

  it('numbers the tests after the graded ones while the grading goes on', () => {
    expect(pendingPositions(graded, 6, true)).toEqual([4, 5, 6]);
  });

  it('has none when the grading is over, the test count is unknown or the results are hidden', () => {
    expect(pendingPositions(graded, 6, false)).toEqual([]);
    expect(pendingPositions(graded, null, true)).toEqual([]);
    expect(pendingPositions(null, 6, true)).toEqual([]);
    expect(pendingPositions(graded, 2, true)).toEqual([]);
  });
});

describe('formatCasePoints and caseTitle', () => {
  it('writes points in the locale with up to two decimals', () => {
    expect(formatCasePoints(0.5, 1, 'vi')).toBe('0,5/1');
    expect(formatCasePoints(1 / 3, 1, 'en')).toBe('0.33/1');
    expect(formatCasePoints(1500, 2000, 'vi')).toBe('1500/2000');
  });

  it('names the test, its verdict and its points', () => {
    const wrong = submissionCase({ position: 3, status: 'WA', points: 0, total: 1 });
    expect(caseTitle(wrong, 'vi')).toBe('Test 3: Sai kết quả, 0/1');
  });
});
