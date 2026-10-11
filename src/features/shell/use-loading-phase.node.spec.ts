import { effectScope, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOADING_TIMING, useLoadingPhase, type LoadingPhase } from './use-loading-phase';

const { showAfterMs, settleMs, leaveMs, fadeMs } = LOADING_TIMING;

function setup(initiallyWaiting = false) {
  const waiting = ref(initiallyWaiting);
  const scope = effectScope();
  const { phase, gone } = scope.run(() => useLoadingPhase(() => waiting.value))!;
  return { waiting, phase, gone, scope };
}

describe('useLoadingPhase', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

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

  const startLeaving = (waiting: Ref<boolean>) => {
    waiting.value = true;
    vi.advanceTimersByTime(showAfterMs);
    waiting.value = false;
    vi.advanceTimersByTime(settleMs);
  };

  it('leaves once the wait has been over for the settle time, not before', () => {
    const { waiting, phase } = setup();
    waiting.value = true;
    vi.advanceTimersByTime(showAfterMs);
    waiting.value = false;
    vi.advanceTimersByTime(settleMs - 1);
    expect(phase.value).toBe('walking');
    vi.advanceTimersByTime(1);
    expect(phase.value).toBe('leaving');
  });

  it('fades the Bits still on screen at leaveMs, then hides after fadeMs', () => {
    const { waiting, phase } = setup();
    startLeaving(waiting);
    vi.advanceTimersByTime(leaveMs - 1);
    expect(phase.value).toBe('leaving');
    vi.advanceTimersByTime(1);
    expect(phase.value).toBe('fading');
    vi.advanceTimersByTime(fadeMs - 1);
    expect(phase.value).toBe('fading');
    vi.advanceTimersByTime(1);
    expect(phase.value).toBe('hidden');
  });

  it('walks again when a new wait begins while leaving or fading', () => {
    const { waiting, phase } = setup();
    startLeaving(waiting);
    vi.advanceTimersByTime(leaveMs / 2);
    expect(phase.value).toBe('leaving');
    waiting.value = true;
    expect(phase.value).toBe('walking');
    vi.advanceTimersByTime(leaveMs + fadeMs + 1000);
    expect(phase.value).toBe('walking'); // the old leave and fade timers were cancelled
    waiting.value = false;
    vi.advanceTimersByTime(settleMs + leaveMs);
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
      vi.advanceTimersByTime(showAfterMs + settleMs + leaveMs + fadeMs);
      expect(seen).toEqual([]);
      expect(phase.value).toBe('hidden');
    },
  );

  it('shows only after a full threshold of waiting when an earlier short wait ended in a gap', () => {
    const { waiting, phase } = setup();
    waiting.value = true;
    vi.advanceTimersByTime(50);
    waiting.value = false;
    vi.advanceTimersByTime(settleMs + 150); // settled: the first wait is forgotten (t = 300)
    waiting.value = true;
    vi.advanceTimersByTime(showAfterMs - 1);
    expect(phase.value).toBe('hidden');
    vi.advanceTimersByTime(1);
    expect(phase.value).toBe('walking');
  });

  it.each([
    ['show', () => undefined],
    [
      'settle',
      (waiting: Ref<boolean>) => {
        vi.advanceTimersByTime(showAfterMs);
        waiting.value = false;
      },
    ],
    [
      'leave',
      (waiting: Ref<boolean>) => {
        vi.advanceTimersByTime(showAfterMs);
        waiting.value = false;
        vi.advanceTimersByTime(settleMs);
      },
    ],
    [
      'fade',
      (waiting: Ref<boolean>) => {
        vi.advanceTimersByTime(showAfterMs);
        waiting.value = false;
        vi.advanceTimersByTime(settleMs + leaveMs);
      },
    ],
  ])(
    'leaves no timer running when its scope stops while the %s timer is pending',
    (_name, advance) => {
      const { waiting, scope } = setup();
      waiting.value = true;
      advance(waiting);
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      scope.stop();
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it('leaves no timer running after its scope stops', () => {
    const { waiting, scope } = setup();
    waiting.value = true;
    scope.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
