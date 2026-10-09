import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromLocalInput, toLocalInput } from './datetime';

beforeEach(() => vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh'));
afterEach(() => vi.unstubAllEnvs());

describe('datetime-local helpers (Asia/Ho_Chi_Minh)', () => {
  it('runs in the pinned zone', () => {
    expect(new Date('2026-10-08T00:00:00Z').getTimezoneOffset()).toBe(-420);
  });

  it("shows an API instant as the viewer's wall clock", () => {
    expect(toLocalInput('2026-10-08T06:00:00.000Z')).toBe('2026-10-08T13:00');
    expect(toLocalInput(null)).toBe('');
  });

  it('sends the wall clock back as a UTC ISO instant, and an empty box as null', () => {
    expect(fromLocalInput('2026-10-08T13:00')).toBe('2026-10-08T06:00:00.000Z');
    expect(fromLocalInput('')).toBeNull();
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

  it('treats a malformed box value as empty instead of throwing', () => {
    expect(fromLocalInput('not a time')).toBeNull();
  });
});
