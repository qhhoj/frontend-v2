import { describe, expect, it } from 'vitest';
import type { CurrentParticipation } from '@/api/types/contests';
import { participationSummary } from '@/test/fixtures';
import { elapsedSeconds, virtualRunOf } from './virtual-run';

const NOW = Date.parse('2026-10-09T10:25:00Z');
const current = (
  overrides: Partial<CurrentParticipation['participation']> = {},
  key = 'r41',
): CurrentParticipation => ({
  contest: {
    key,
    name: 'QHH Round #41',
    startTime: '2026-10-01T08:00:00Z',
    endTime: '2026-10-01T11:00:00Z',
  },
  participation: participationSummary({
    id: 'part-01v',
    virtual: 1,
    realStart: '2026-10-09T10:00:00Z',
    endTime: '2026-10-09T13:00:00Z',
    ...overrides,
  }),
});

describe('virtualRunOf', () => {
  it.each([
    ['a running virtual run of this contest', current(), 'part-01v'],
    ['nothing current', null, null],
    ['a live participation', current({ virtual: 0 }), null],
    ['spectating', current({ virtual: -1 }), null],
    ['another contest', current({}, 'r42'), null],
    ['a finished run', current({ endTime: '2026-10-09T10:24:59Z' }), null],
  ] as const)('%s gives %s', (_name, given, expected) => {
    expect(virtualRunOf(given, 'r41', NOW)?.id ?? null).toBe(expected);
  });
});

describe('elapsedSeconds', () => {
  it('counts whole seconds since the run started, inside the replay', () => {
    expect(elapsedSeconds('2026-10-09T10:00:00Z', NOW, 10_800)).toBe(1500);
    expect(elapsedSeconds('2026-10-09T10:30:00Z', NOW, 10_800)).toBe(0);
    expect(elapsedSeconds('2026-10-09T06:00:00Z', NOW, 10_800)).toBe(10_800);
  });
});
