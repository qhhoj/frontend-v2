import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromLocalInput, toLocalInput } from './datetime';

beforeEach(() => vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh'));
afterEach(() => vi.unstubAllEnvs());

describe('datetime-local helpers (Asia/Ho_Chi_Minh)', () => {
  it('maps instant to wall clock and back, empty to null, malformed to null', () => {
    expect(toLocalInput('2026-10-08T06:00:00.000Z')).toBe('2026-10-08T13:00');
    expect(toLocalInput(null)).toBe('');
    expect(fromLocalInput('2026-10-08T13:00')).toBe('2026-10-08T06:00:00.000Z');
    expect(fromLocalInput('')).toBeNull();
    expect(fromLocalInput('not a time')).toBeNull();
  });

  it('round-trips whole minutes across a day boundary and a year end', () => {
    for (const iso of [
      '2026-12-31T17:30:00.000Z',
      '2026-10-08T16:59:00.000Z',
      '2027-01-01T00:00:00.000Z',
    ]) {
      expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
    }
  });
});
