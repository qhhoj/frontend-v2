import { describe, expect, it } from 'vitest';
import { similarityRun } from '@/test/admin-fixtures/similarity';
import {
  activeRunOf,
  isActive,
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

describe('similarity runs: edges', () => {
  it('counts a queued run as active, as well as a running one', () => {
    const queued = similarityRun({
      id: 'q-1',
      status: 'queued',
      startedAt: null,
      finishedAt: null,
    });
    expect(isActive(queued)).toBe(true);
    expect(isActive(similarityRun({ status: 'running', finishedAt: null }))).toBe(true);
    expect(isActive(similarityRun({ status: 'done' }))).toBe(false);
    expect(activeRunOf([queued])?.id).toBe('q-1');
  });

  it('trims a scope value and treats a blank one as absent', () => {
    expect(scopeFromQuery({ contest: '  hcmus-w41 ' })).toEqual({ contest: 'hcmus-w41' });
    expect(scopeFromQuery({ problem: '   ' })).toBeNull();
  });

  it('words a wait at the second, minute and hour boundaries', () => {
    expect(waitParts(59)).toEqual({ unit: 'seconds', count: 59 });
    expect(waitParts(60)).toEqual({ unit: 'minutes', count: 1 });
    expect(waitParts(61)).toEqual({ unit: 'minutes', count: 2 });
    expect(waitParts(3540)).toEqual({ unit: 'minutes', count: 59 });
    expect(waitParts(3599)).toEqual({ unit: 'hours', count: 1 });
    expect(waitParts(3600)).toEqual({ unit: 'hours', count: 1 });
    expect(waitParts(3601)).toEqual({ unit: 'hours', count: 2 });
  });

  it('measures a failed run that has both times, and no duration while it still runs', () => {
    const failed = similarityRun({
      status: 'failed',
      error: 'deadline',
      startedAt: '2026-10-08T07:10:00.000Z',
      finishedAt: '2026-10-08T07:10:30.000Z',
    });
    expect(runDurationSeconds(failed)).toBe(30);
    expect(runDurationSeconds(similarityRun({ status: 'running', finishedAt: null }))).toBeNull();
  });
});
