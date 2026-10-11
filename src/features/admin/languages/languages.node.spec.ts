import { describe, expect, it } from 'vitest';
import { JUDGE_FLEET } from '@/test/admin-fixtures/judges';
import { LANGUAGES } from '@/test/admin-fixtures/languages';
import {
  hasVersionDrift,
  singleJudgeLanguages,
  unservedLanguages,
  withCoverage,
} from './languages';

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

describe('language outages and drift', () => {
  it('counts a blocked or disabled judge out of the online coverage, even while connected', async () => {
    const { judge } = await import('@/test/admin-fixtures/judges');
    const fleet = [
      judge({ name: 'a', online: true, isDisabled: true }),
      judge({ name: 'b', online: true, isBlocked: true }),
    ];
    const rows = withCoverage(LANGUAGES, fleet);
    const cpp20 = rows.find((row) => row.key === 'CPP20')!;
    expect(cpp20.judges).toEqual(['a', 'b']);
    expect(cpp20.onlineJudges).toEqual([]);
    expect(unservedLanguages(rows).map((row) => row.key)).toContain('CPP20');
  });

  it('flags a language whose judges report different runtimes', async () => {
    const { judge } = await import('@/test/admin-fixtures/judges');
    const runtime = (version: string) => ({
      language: 'PY3',
      name: 'CPython',
      version,
      priority: 1,
    });
    const fleet = [
      judge({ name: 'a', runtimes: [runtime('3.12.3')] }),
      judge({ name: 'b', runtimes: [runtime('3.11.9')] }),
    ];
    const py3 = withCoverage(LANGUAGES, fleet).find((row) => row.key === 'PY3')!;
    expect(hasVersionDrift(py3)).toBe(true);
  });

  it('reads two runtimes on one judge as one set for that judge, not as drift', async () => {
    const { judge } = await import('@/test/admin-fixtures/judges');
    const runtime = (name: string, version: string) => ({
      language: 'PY3',
      name,
      version,
      priority: 1,
    });
    const both = [runtime('PyPy', '3.10'), runtime('CPython', '3.12.3')];
    const fleet = [judge({ name: 'a', runtimes: both }), judge({ name: 'b', runtimes: both })];
    const py3 = withCoverage(LANGUAGES, fleet).find((row) => row.key === 'PY3')!;
    expect(py3.versions?.map((version) => version.judge)).toEqual(['a', 'b']);
    expect(hasVersionDrift(py3)).toBe(false);
  });
});
