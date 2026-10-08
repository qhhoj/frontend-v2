import { effectScope, ref, watch } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOADING_TIMING, useLoadingPhase, type LoadingPhase } from './use-loading-phase';

const { showAfterMs, settleMs, holdMs, fadeMs } = LOADING_TIMING;

function setup(initiallyWaiting = false) {
  const waiting = ref(initiallyWaiting);
  const scope = effectScope();
  const { phase } = scope.run(() => useLoadingPhase(() => waiting.value))!;
  return { waiting, phase, scope };
}

describe('useLoadingPhase', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('stays hidden when the wait ends before the threshold', () => {
    const { waiting, phase } = setup();
    waiting.value = true;
    vi.advanceTimersByTime(showAfterMs - 100);
    waiting.value = false;
    vi.advanceTimersByTime(5000);
    expect(phase.value).toBe('hidden');
  });

  it('starts walking once the wait passes the threshold', () => {
    const { waiting, phase } = setup();
    waiting.value = true;
    vi.advanceTimersByTime(599);
    expect(phase.value).toBe('hidden');
    vi.advanceTimersByTime(1);
    expect(phase.value).toBe('walking');
  });

  it('counts the threshold from the first moment of waiting, even if it is already waiting at start', () => {
    const { phase } = setup(true);
    vi.advanceTimersByTime(showAfterMs);
    expect(phase.value).toBe('walking');
  });

  it('does not restart the threshold or stop the walk over a gap shorter than the settle time', () => {
    const { waiting, phase } = setup();
    waiting.value = true;
    vi.advanceTimersByTime(400);
    waiting.value = false;
    vi.advanceTimersByTime(settleMs - 50);
    waiting.value = true;
    vi.advanceTimersByTime(showAfterMs - 400);
    expect(phase.value).toBe('walking');
    waiting.value = false;
    vi.advanceTimersByTime(settleMs - 50);
    waiting.value = true;
    vi.advanceTimersByTime(1000);
    expect(phase.value).toBe('walking');
  });

  it('stops, holds, fades, then hides, in that order', () => {
    const { waiting, phase } = setup();
    waiting.value = true;
    vi.advanceTimersByTime(showAfterMs);
    waiting.value = false;
    vi.advanceTimersByTime(settleMs);
    expect(phase.value).toBe('stopped');
    vi.advanceTimersByTime(holdMs - 1);
    expect(phase.value).toBe('stopped');
    vi.advanceTimersByTime(1);
    expect(phase.value).toBe('fading');
    vi.advanceTimersByTime(fadeMs - 1);
    expect(phase.value).toBe('fading');
    vi.advanceTimersByTime(1);
    expect(phase.value).toBe('hidden');
  });

  it('walks again when a new wait begins while stopped or fading', () => {
    const { waiting, phase } = setup();
    waiting.value = true;
    vi.advanceTimersByTime(showAfterMs);
    waiting.value = false;
    vi.advanceTimersByTime(settleMs + holdMs / 2);
    expect(phase.value).toBe('stopped');
    waiting.value = true;
    expect(phase.value).toBe('walking');
    vi.advanceTimersByTime(holdMs + fadeMs + 1000);
    expect(phase.value).toBe('walking'); // the old hold and fade timers were cancelled
    waiting.value = false;
    vi.advanceTimersByTime(settleMs + holdMs);
    expect(phase.value).toBe('fading');
    waiting.value = true;
    expect(phase.value).toBe('walking');
  });

  it.each([450, 500, 550, 599])(
    'never walks for a wait that ends after %i ms, not even for a moment',
    (waitMs) => {
      const { waiting, phase } = setup();
      const seen: LoadingPhase[] = [];
      watch(phase, (next) => seen.push(next), { flush: 'sync' });
      waiting.value = true;
      vi.advanceTimersByTime(waitMs);
      waiting.value = false;
      vi.advanceTimersByTime(showAfterMs + settleMs + holdMs + fadeMs);
      expect(seen).toEqual([]);
      expect(phase.value).toBe('hidden');
    },
  );

  it('leaves no timer running after its scope stops', () => {
    const { waiting, scope } = setup();
    waiting.value = true;
    scope.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
