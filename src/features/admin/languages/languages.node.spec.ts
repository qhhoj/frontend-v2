import { describe, expect, it } from 'vitest';
import { JUDGE_FLEET } from '@/test/admin-fixtures/judges';
import { LANGUAGES } from '@/test/admin-fixtures/languages';
import { singleJudgeLanguages, withCoverage } from './languages';

describe('languages with judge coverage', () => {
  it('joins each language to the judges whose runtimes carry its key, and the online ones', () => {
    const rows = withCoverage(LANGUAGES, JUDGE_FLEET);
    const cpp20 = rows.find((row) => row.key === 'CPP20')!;
    expect(cpp20.judges).toHaveLength(5);
    expect(cpp20.onlineJudges).toHaveLength(3);
    expect(rows.find((row) => row.key === 'RUBY')).toMatchObject({ judges: [], onlineJudges: [] });
  });

  it('keeps coverage unknown, not empty, when the viewer cannot read the judges', () => {
    const rows = withCoverage(LANGUAGES, null);
    expect(rows.every((row) => row.judges === null && row.onlineJudges === null)).toBe(true);
    expect(singleJudgeLanguages(rows)).toEqual([]);
  });

  it('flags languages that only one judge runs', () => {
    const single = singleJudgeLanguages(withCoverage(LANGUAGES, JUDGE_FLEET));
    expect(single.map((row) => [row.key, row.judges])).toEqual([['PAS', ['qhh-judge-03']]]);
  });
});
