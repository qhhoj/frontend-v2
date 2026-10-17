import { describe, expect, it } from 'vitest';
import { cloneEnd, defaultCloneStart } from './contest-clone';

const source = { startTime: '2026-10-18T04:40:00.000Z', endTime: '2026-10-18T07:10:00.000Z' };

describe('contest clone window', () => {
  it('offers the same start one week later', () => {
    expect(defaultCloneStart(source.startTime)).toBe('2026-10-25T04:40:00.000Z');
  });

  it('keeps the length of the source for any new start', () => {
    expect(cloneEnd(source, '2026-11-01T01:00:00.000Z')).toBe('2026-11-01T03:30:00.000Z');
  });

  it('has no end until a start reads', () => {
    expect(cloneEnd(source, null)).toBeNull();
    expect(cloneEnd(source, 'not a date')).toBeNull();
  });
});
