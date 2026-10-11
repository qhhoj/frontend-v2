import { describe, expect, it } from 'vitest';
import { contestSettings, editableContest } from '@/test/admin-fixtures/contests';
import {
  labelFor,
  mergeRows,
  moveRowTo,
  newProblemRow,
  toProblemRows,
  toProblemsBody,
  withPoints,
} from './contest-problems';

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

  const rowOf = (id: string) => newProblemRow({ id, code: id, name: id });
  const idsOf = (rows: { problemId: string }[]) => rows.map((row) => row.problemId);

  it('moves a row to a position, clamping past either end', () => {
    const rows = ['a', 'b', 'c', 'd'].map(rowOf);
    expect(idsOf(moveRowTo(rows, 3, 1))).toEqual(['a', 'd', 'b', 'c']);
    expect(idsOf(moveRowTo(rows, 0, 99))).toEqual(['b', 'c', 'd', 'a']);
    expect(idsOf(moveRowTo(rows, 2, -5))).toEqual(['c', 'a', 'b', 'd']);
  });

  it('sets points only on the chosen rows', () => {
    const rows = withPoints(['a', 'b'].map(rowOf), ['b'], 7);
    expect(rows.map((row) => row.points)).toEqual([100, 7]);
  });

  it("copies another contest's rows after the listed ones, skipping duplicates and the overflow", () => {
    const merged = mergeRows(['a', 'b'].map(rowOf), ['b', 'c'].map(rowOf));
    expect(idsOf(merged.rows)).toEqual(['a', 'b', 'c']);
    expect(merged).toMatchObject({ added: 1, skipped: 1 });
    const full = Array.from({ length: 99 }, (_unused, index) => rowOf(`p${index}`));
    expect(mergeRows(full, ['x', 'y'].map(rowOf))).toMatchObject({ added: 1, skipped: 1 });
  });
});
