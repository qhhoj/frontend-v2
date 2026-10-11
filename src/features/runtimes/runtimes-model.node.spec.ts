import { describe, expect, it } from 'vitest';
import type { RuntimeJudge, RuntimeLanguage } from '@/api/types/runtimes';
import { commonVersion, mismatchedJudges, runtimeTotals, uptimeSince } from './runtimes-model';

const judge = (name: string, extra: Partial<RuntimeJudge> = {}): RuntimeJudge => ({
  name,
  online: true,
  slots: 4,
  busy: 1,
  pingMs: 10,
  startedAt: null,
  ...extra,
});
const language = (versions: Record<string, string>): RuntimeLanguage => ({
  key: 'CPP17',
  name: 'C++17',
  commonName: 'C++',
  extension: 'cpp',
  fileOnly: false,
  versions: Object.entries(versions).map(([name, version]) => ({
    judge: name,
    compiler: 'g++',
    version,
  })),
});

describe('mismatchedJudges', () => {
  const judges = [judge('a'), judge('b'), judge('c')];

  it('flags the online judges that differ from the version most judges run', () => {
    const cpp = language({ a: '13.2', b: '13.2', c: '12.3' });
    expect(commonVersion(cpp, judges)).toBe('13.2');
    expect(mismatchedJudges(cpp, judges)).toEqual(['c']);
  });

  it('does not flag an offline judge', () => {
    const cpp = language({ a: '13.2', b: '13.2', c: '12.3' });
    const asleep = [judge('a'), judge('b'), judge('c', { online: false })];
    expect(mismatchedJudges(cpp, asleep)).toEqual([]);
  });

  it('lets only online judges vote, so an asleep judge cannot make the online ones the odd ones', () => {
    const cpp = language({ a: '13.2', b: '12.3', c: '12.3' });
    const asleep = [judge('a'), judge('b'), judge('c', { online: false })];
    expect(commonVersion(cpp, asleep)).toBe('13.2');
    expect(mismatchedJudges(cpp, asleep)).toEqual(['b']);
  });

  it('has no common version and no mismatch when no judge has the language', () => {
    expect(commonVersion(language({}), judges)).toBeNull();
    expect(mismatchedJudges(language({}), judges)).toEqual([]);
  });
});

describe('runtimeTotals', () => {
  it('sums load and averages ping over online judges only', () => {
    const totals = runtimeTotals([
      judge('a', { busy: 3, pingMs: 12 }),
      judge('b', { busy: 1, pingMs: 19 }),
      judge('c', { online: false, busy: 0, pingMs: null }),
    ]);
    expect(totals).toEqual({ online: 2, total: 3, busy: 4, slots: 8, pingMs: 16 });
  });

  it('has no mean ping when nothing is online', () => {
    expect(runtimeTotals([judge('a', { online: false, pingMs: null })]).pingMs).toBeNull();
  });
});

describe('uptimeSince', () => {
  const now = Date.parse('2026-10-11T12:00:00Z');
  it.each([
    ['2026-09-29T12:00:00Z', { unit: 'day', count: 12 }],
    ['2026-10-11T09:00:00Z', { unit: 'hour', count: 3 }],
    ['2026-10-11T11:55:00Z', { unit: 'minute', count: 5 }],
    ['2026-10-11T11:59:59Z', { unit: 'minute', count: 1 }],
  ])('%s', (startedAt, expected) => {
    expect(uptimeSince(startedAt, now)).toEqual(expected);
  });
});
