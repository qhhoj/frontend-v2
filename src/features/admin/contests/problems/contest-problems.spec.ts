import { describe, expect, it } from 'vitest';
import { contestSettings, editableContest } from '@/test/admin-fixtures/contests';
import { labelFor, moveRow, toProblemRows, toProblemsBody } from './contest-problems';

describe('contest problems', () => {
  it('labels by style, past Z too', () => {
    expect([0, 1, 25, 26, 27].map((index) => labelFor(index, 'alpha'))).toEqual([
      'A',
      'B',
      'Z',
      'AA',
      'AB',
    ]);
    expect(labelFor(2, 'numeric')).toBe('3');
  });

  it('moves a row and keeps the others in order; a move past either end changes nothing', () => {
    const rows = toProblemRows(editableContest());
    expect(moveRow(rows, 2, -1).map((row) => row.code)).toEqual([
      'hcmus41a',
      'hcmus41c',
      'hcmus41b',
    ]);
    expect(moveRow(rows, 0, -1)).toEqual(rows);
  });

  it('reads the stored output prefixes by problem id, so a save from untouched rows sends them back', () => {
    const contest = editableContest();
    const [, , third] = contest.problems!;
    const withPrefix = editableContest({
      settings: contestSettings({
        problemOutputPrefixes: [{ problemId: third!.problemId, outputPrefixOverride: 4096 }],
      }),
    });
    const rows = toProblemRows(withPrefix);
    expect(rows.map((row) => row.outputPrefix)).toEqual([null, null, 4096]);
    expect(toProblemsBody(rows).map((entry) => entry.outputPrefixOverride)).toEqual([
      undefined,
      undefined,
      4096,
    ]);
  });

  it('sends ids, points and flags, the cap only when set, the prefix only when typed', () => {
    const rows = toProblemRows(editableContest());
    rows[1]!.outputPrefix = 1024;
    expect(toProblemsBody(rows)).toEqual([
      {
        problem: rows[0]!.problemId,
        points: 100,
        partial: true,
        isPretested: false,
        maxSubmissions: null,
      },
      {
        problem: rows[1]!.problemId,
        points: 100,
        partial: true,
        isPretested: false,
        maxSubmissions: null,
        outputPrefixOverride: 1024,
      },
      {
        problem: rows[2]!.problemId,
        points: 100,
        partial: true,
        isPretested: false,
        maxSubmissions: 20,
      },
    ]);
  });
});
