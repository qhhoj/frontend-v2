import { describe, expect, it } from 'vitest';
import { contestWindowOf } from './contest-window';

const NOW = Date.parse('2026-10-11T00:00:00Z');

describe('contestWindowOf', () => {
  it('shows only the end clock when the contest ends on its start day in the site zone', () => {
    expect(contestWindowOf('2026-10-08T08:00:00Z', '2026-10-08T11:24:00Z', NOW)).toEqual({
      start: '08/10 15:00',
      end: '18:24',
      seconds: 3 * 3600 + 24 * 60,
    });
  });

  it('keeps the end date when the site-zone day changes, even inside one UTC day', () => {
    const window = contestWindowOf('2026-10-08T15:00:00Z', '2026-10-08T18:00:00Z', NOW);
    expect(window.start).toBe('08/10 22:00');
    expect(window.end).toBe('09/10 01:00');
  });

  it('adds the year to a date outside the current year', () => {
    const window = contestWindowOf('2025-12-31T10:00:00Z', '2026-01-01T10:00:00Z', NOW);
    expect(window.start).toBe('31/12/2025 17:00');
    expect(window.end).toBe('01/01 17:00');
  });
});
