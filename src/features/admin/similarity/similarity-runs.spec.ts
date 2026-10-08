import { describe, expect, it } from 'vitest';
import { similarityRun } from '@/test/admin-fixtures/similarity';
import {
  activeRunOf,
  runDurationSeconds,
  scopeFromQuery,
  scopeQuery,
  totalPairs,
  truncatedGroups,
  waitParts,
} from './similarity-runs';

describe('similarity runs', () => {
  it('reads one scope from the URL and ignores an empty or double one', () => {
    expect(scopeFromQuery({ contest: 'hcmus-w41' })).toEqual({ contest: 'hcmus-w41' });
    expect(scopeFromQuery({ problem: 'hcmus41c' })).toEqual({ problem: 'hcmus41c' });
    expect(scopeFromQuery({ contest: '' })).toBeNull();
    expect(scopeFromQuery({ contest: 'a', problem: 'b' })).toBeNull();
    expect(scopeQuery({ problem: 'x' })).toEqual({ problem: 'x' });
  });

  it('measures a finished run and counts pairs only for done runs', () => {
    const done = similarityRun();
    expect(runDurationSeconds(done)).toBe(138);
    expect(totalPairs(done)).toBe(1204);
    expect(
      runDurationSeconds(similarityRun({ status: 'queued', startedAt: null, finishedAt: null })),
    ).toBeNull();
    expect(totalPairs(similarityRun({ status: 'running' }))).toBeNull();
  });

  it('finds the run that blocks a new one and the groups that were cut', () => {
    const runs = [
      similarityRun({ id: 'done-1' }),
      similarityRun({ id: 'live-1', status: 'running' }),
    ];
    expect(activeRunOf(runs)?.id).toBe('live-1');
    expect(
      truncatedGroups(similarityRun()).map((group) => `${group.problemCode}:${group.language}`),
    ).toEqual(['hcmus41c:cpp']);
  });

  it('words a Retry-After in the largest whole unit, rounding up', () => {
    expect(waitParts(45)).toEqual({ unit: 'seconds', count: 45 });
    expect(waitParts(90)).toEqual({ unit: 'minutes', count: 2 });
    expect(waitParts(2520)).toEqual({ unit: 'minutes', count: 42 });
    expect(waitParts(3600)).toEqual({ unit: 'hours', count: 1 });
    expect(waitParts(5400)).toEqual({ unit: 'hours', count: 2 });
  });
});
