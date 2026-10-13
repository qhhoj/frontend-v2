import { describe, expect, it } from 'vitest';
import { DEFAULT_BIT_ROAM, parseBitRoam } from './bit-roam.store';

describe('parseBitRoam', () => {
  it('keeps a valid choice', () => {
    expect(parseBitRoam({ on: true, count: 4 })).toEqual({ on: true, count: 4 });
  });

  it('pulls a count into 1-5 and rounds it', () => {
    expect(parseBitRoam({ on: true, count: 9 })).toEqual({ on: true, count: 5 });
    expect(parseBitRoam({ on: false, count: 0 })).toEqual({ on: false, count: 1 });
    expect(parseBitRoam({ on: true, count: 2.6 })).toEqual({ on: true, count: 3 });
  });

  it.each([
    null,
    undefined,
    'on',
    3,
    { on: 'yes', count: 2 },
    { on: true },
    { on: true, count: NaN },
  ])('falls back to off with one Bit for %j', (value) => {
    expect(parseBitRoam(value)).toEqual(DEFAULT_BIT_ROAM);
  });
});
