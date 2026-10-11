import { describe, expect, it } from 'vitest';
import { contestSettings, editableContest } from '@/test/admin-fixtures/contests';
import { labelFor, toProblemRows, toProblemsBody } from './contest-problems';

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
});
