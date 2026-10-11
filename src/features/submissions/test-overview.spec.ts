import { describe, expect, it } from 'vitest';
import { submissionCase } from '@/test/fixtures';
import { buildOverviewRows } from './test-overview';

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
});
