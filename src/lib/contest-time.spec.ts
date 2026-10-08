import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  contestProgress,
  countdownTarget,
  freezeFraction,
  freezeStart,
  isFrozenAt,
  localDayOffset,
  phaseAt,
  registrationState,
  spanMessage,
} from './contest-time';

const at = (iso: string) => Date.parse(iso);
const times = { startTime: '2026-10-08T06:00:00Z', endTime: '2026-10-08T10:00:00Z' };
const icpc = { ...times, formatName: 'icpc' as const, frozenLastMinutes: 60 };

describe('phaseAt', () => {
  it('is upcoming before the start, running from the start to the end inclusive, ended after', () => {
    expect(phaseAt(times, at('2026-10-08T05:59:59Z'))).toBe('upcoming');
    expect(phaseAt(times, at('2026-10-08T06:00:00Z'))).toBe('running');
    expect(phaseAt(times, at('2026-10-08T10:00:00Z'))).toBe('running');
    expect(phaseAt(times, at('2026-10-08T10:00:00.001Z'))).toBe('ended');
  });
});

describe('contestProgress', () => {
  it('is the elapsed share of the window, clamped to 0..1', () => {
    expect(contestProgress(times, at('2026-10-08T08:00:00Z'))).toBe(0.5);
    expect(contestProgress(times, at('2026-10-08T05:00:00Z'))).toBe(0);
    expect(contestProgress(times, at('2026-10-08T11:00:00Z'))).toBe(1);
  });
  it('treats an empty window as over instead of dividing by zero', () => {
    expect(
      contestProgress(
        { startTime: times.startTime, endTime: times.startTime },
        at(times.startTime),
      ),
    ).toBe(1);
  });
});

describe('freeze', () => {
  it('starts frozenLastMinutes before the end for icpc and vnoj only', () => {
    expect(freezeStart(icpc)).toBe(at('2026-10-08T09:00:00Z'));
    expect(freezeStart({ ...icpc, formatName: 'vnoj' })).toBe(at('2026-10-08T09:00:00Z'));
    expect(freezeStart({ ...icpc, formatName: 'ioi' })).toBeNull();
    expect(freezeStart({ ...icpc, frozenLastMinutes: 0 })).toBeNull();
  });
  it('places the freeze mark on the bar', () => {
    expect(freezeFraction(icpc)).toBe(0.75);
    expect(freezeFraction({ ...icpc, formatName: 'default' })).toBeNull();
  });
  it('stays frozen after the end, like the backend', () => {
    expect(isFrozenAt(icpc, at('2026-10-08T08:59:59Z'))).toBe(false);
    expect(isFrozenAt(icpc, at('2026-10-08T09:00:00Z'))).toBe(true);
    expect(isFrozenAt(icpc, at('2026-10-09T00:00:00Z'))).toBe(true);
  });
});

describe('registrationState', () => {
  const now = at('2026-10-08T05:00:00Z');
  it('is none when neither bound is set', () => {
    expect(registrationState({ registrationStart: null, registrationEnd: null }, now)).toBe('none');
  });
  it('is open inside both bounds, inclusive, and an open-ended bound never closes it', () => {
    expect(
      registrationState({ registrationStart: '2026-10-08T05:00:00Z', registrationEnd: null }, now),
    ).toBe('open');
    expect(
      registrationState({ registrationStart: null, registrationEnd: '2026-10-08T05:00:00Z' }, now),
    ).toBe('open');
  });
  it('is closed before the start and after the end', () => {
    expect(
      registrationState({ registrationStart: '2026-10-08T05:00:01Z', registrationEnd: null }, now),
    ).toBe('closed');
    expect(
      registrationState({ registrationStart: null, registrationEnd: '2026-10-08T04:59:59Z' }, now),
    ).toBe('closed');
  });
});

describe('countdownTarget', () => {
  it('counts to the start, then to the end, then stops', () => {
    expect(countdownTarget(times, at('2026-10-08T05:00:00Z'))).toEqual({
      kind: 'start',
      at: times.startTime,
    });
    expect(countdownTarget(times, at('2026-10-08T06:00:00Z'))).toEqual({
      kind: 'end',
      at: times.endTime,
    });
    expect(countdownTarget(times, at('2026-10-08T10:00:00.001Z'))).toBeNull();
  });
});

describe('spanMessage', () => {
  it('says hours and minutes, hours alone, minutes alone, days', () => {
    expect(spanMessage(9000)).toEqual({
      key: 'contests.span.hoursMinutes',
      params: { hours: 2, minutes: 30 },
    });
    expect(spanMessage(4 * 3600)).toEqual({
      key: 'contests.span.hours',
      params: { count: 4 },
      count: 4,
    });
    expect(spanMessage(47 * 60 + 59)).toEqual({
      key: 'contests.span.minutes',
      params: { count: 47 },
      count: 47,
    });
    expect(spanMessage(14 * 86_400)).toEqual({
      key: 'contests.span.days',
      params: { count: 14 },
      count: 14,
    });
  });
  it('never says zero minutes', () => {
    expect(spanMessage(59)).toEqual({ key: 'contests.span.underMinute', params: {} });
    expect(spanMessage(-5)).toEqual({ key: 'contests.span.underMinute', params: {} });
  });
});

describe('localDayOffset', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('counts the calendar days between two instants in the viewer zone', () => {
    vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh');
    expect(localDayOffset('2026-10-08T01:00:00Z', '2026-10-08T16:59:00Z')).toBe(0);
    expect(localDayOffset('2026-10-08T01:00:00Z', '2026-10-08T17:00:00Z')).toBe(1);
    expect(localDayOffset('2026-10-08T01:00:00Z', '2026-10-11T03:00:00Z')).toBe(3);
  });
});
