import { describe, expect, it } from 'vitest';
import type { CurrentParticipation } from '@/api/types/contests';
import { activeParticipation, participationKind } from './current-contest';

const NOW = Date.parse('2026-10-17T10:00:00Z');
const current = (
  participation: Partial<CurrentParticipation['participation']> = {},
): CurrentParticipation => ({
  contest: {
    key: 'e2e_live',
    name: 'E2E Live Round',
    startTime: '2026-10-17T08:00:00Z',
    endTime: '2026-10-17T12:00:00Z',
  },
  participation: {
    id: 'p1',
    endTime: '2026-10-17T12:00:00Z',
    isDisqualified: false,
    isRegistered: false,
    realStart: '2026-10-17T08:05:00Z',
    rulesAcceptedAt: null,
    rulesAcceptedRevision: null,
    virtual: 0,
    ...participation,
  },
});

describe('activeParticipation', () => {
  it('keeps a started participation until its end', () => {
    const live = current();
    expect(activeParticipation(live, NOW)).toBe(live);
    expect(activeParticipation(live, Date.parse('2026-10-17T12:00:00Z'))).toBeNull();
  });

  it('ends a virtual run at its own end, not the contest end', () => {
    const run = current({ virtual: 2, endTime: '2026-10-17T09:59:59Z' });
    expect(activeParticipation(run, NOW)).toBeNull();
  });

  it('ignores a registration that has not started and an empty answer', () => {
    expect(activeParticipation(current({ isRegistered: true }), NOW)).toBeNull();
    expect(activeParticipation(null, NOW)).toBeNull();
    expect(activeParticipation(undefined, NOW)).toBeNull();
  });
});

describe('participationKind', () => {
  it('reads the virtual number', () => {
    expect(participationKind(0)).toBe('live');
    expect(participationKind(-1)).toBe('spectate');
    expect(participationKind(3)).toBe('virtual');
  });
});
