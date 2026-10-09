import { describe, expect, it } from 'vitest';
import { canPrepareAgain, isBusy, timeLeftText } from './contest-actions';

describe('contest actions helpers', () => {
  it('says how long a running contest has left, and nothing once it ended', () => {
    const now = new Date('2026-10-08T08:12:30.000Z').getTime();
    expect(timeLeftText('2026-10-08T10:00:00.000Z', now)).toBe('01:47:30');
    expect(timeLeftText('2026-10-08T08:00:00.000Z', now)).toBeNull();
  });

  it('allows preparing the export again only after the backend’s next time', () => {
    const now = new Date('2026-10-08T09:00:00.000Z').getTime();
    expect(
      canPrepareAgain(
        {
          state: 'ready',
          preparedAt: null,
          readyAt: null,
          size: 1,
          nextPrepareAt: '2026-10-08T09:40:00.000Z',
        },
        now,
      ),
    ).toBe(false);
    expect(
      canPrepareAgain(
        {
          state: 'ready',
          preparedAt: null,
          readyAt: null,
          size: 1,
          nextPrepareAt: '2026-10-08T08:40:00.000Z',
        },
        now,
      ),
    ).toBe(true);
    expect(
      canPrepareAgain(
        { state: 'preparing', preparedAt: null, readyAt: null, size: null, nextPrepareAt: null },
        now,
      ),
    ).toBe(false);
    expect(
      canPrepareAgain(
        { state: 'none', preparedAt: null, readyAt: null, size: null, nextPrepareAt: null },
        now,
      ),
    ).toBe(true);
  });

  it('counts an action as busy while it is queued or running, and free when idle', () => {
    expect(['idle', 'queued', 'running'].map((state) => isBusy(state as never))).toEqual([
      false,
      true,
      true,
    ]);
  });
});
