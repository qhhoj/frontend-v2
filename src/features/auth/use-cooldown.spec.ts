import { effectScope } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESEND_COOLDOWN_SECONDS, useCooldown } from './use-cooldown';

describe('useCooldown', () => {
  beforeEach(() => void vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }));
  afterEach(() => void vi.useRealTimers());

  it('counts down from the start, second by second, as m:ss, and ends at zero', () => {
    const { coolingDown, remainingText, start } = effectScope().run(() => useCooldown(61))!;
    expect(coolingDown.value).toBe(false);
    start();
    expect(remainingText.value).toBe('1:01');
    vi.advanceTimersByTime(19_000);
    expect(remainingText.value).toBe('0:42');
    vi.advanceTimersByTime(42_000);
    expect(coolingDown.value).toBe(false);
    vi.advanceTimersByTime(5_000);
    expect(remainingText.value).toBe('0:00');
  });

  it('restarts from the full time', () => {
    const { remaining, start } = effectScope().run(() => useCooldown())!;
    start();
    vi.advanceTimersByTime(30_000);
    start();
    expect(remaining.value).toBe(RESEND_COOLDOWN_SECONDS);
  });

  it('stops ticking when its scope ends', () => {
    const scope = effectScope();
    const { remaining, start } = scope.run(() => useCooldown())!;
    start();
    scope.stop();
    vi.advanceTimersByTime(10_000);
    expect(remaining.value).toBe(RESEND_COOLDOWN_SECONDS);
  });
});
