import { describe, expect, it } from 'vitest';
import { timelineOf } from './contest-timeline';

const BASE = {
  registrationStart: null,
  startTime: '2026-10-08T06:00:00.000Z',
  endTime: '2026-10-08T10:00:00.000Z',
  lockedAfter: null,
  frozenLastMinutes: 0,
};

describe('timelineOf', () => {
  it('is empty until the end comes after the start', () => {
    expect(timelineOf({ ...BASE, endTime: null })).toBeNull();
    expect(timelineOf({ ...BASE, endTime: BASE.startTime })).toBeNull();
  });

  it('spans the earliest to the latest moment and places the freeze before the end', () => {
    const timeline = timelineOf({
      ...BASE,
      registrationStart: '2026-10-08T02:00:00.000Z',
      frozenLastMinutes: 60,
    })!;
    expect(timeline.points.map((point) => [point.key, point.position])).toEqual([
      ['registrationStart', 0],
      ['start', 0.5],
      ['freeze', 0.875],
      ['end', 1],
    ]);
    expect(timeline.run).toEqual({ from: 0.5, to: 1 });
    expect(timeline.freeze).toEqual({ from: 0.875, to: 1 });
  });

  it('clamps a freeze longer than the contest to its start and ignores an unreadable count', () => {
    expect(timelineOf({ ...BASE, frozenLastMinutes: 600 })!.freeze).toEqual({ from: 0, to: 1 });
    expect(timelineOf({ ...BASE, frozenLastMinutes: Number.NaN })!.freeze).toBeNull();
  });
});
