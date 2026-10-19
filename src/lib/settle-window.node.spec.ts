import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSettleWindow } from './settle-window';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createSettleWindow in trailing mode', () => {
  it('reports one count after a burst settles', () => {
    const onSettle = vi.fn();
    const window = createSettleWindow(1000, onSettle);
    for (let event = 0; event < 5; event += 1) {
      window.add();
      vi.advanceTimersByTime(300);
    }
    expect(onSettle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onSettle.mock.calls).toEqual([[5]]);
  });
  it('starts counting again after a report and reports nothing once cancelled', () => {
    const onSettle = vi.fn();
    const window = createSettleWindow(1000, onSettle);
    window.add();
    vi.advanceTimersByTime(1000);
    window.add();
    window.cancel();
    vi.advanceTimersByTime(5000);
    expect(onSettle.mock.calls).toEqual([[1]]);
  });
});

describe('createSettleWindow in fixed mode', () => {
  it('reports at the end of the window the first event started, however busy the burst', () => {
    const onSettle = vi.fn();
    const window = createSettleWindow(1000, onSettle, 'fixed');
    for (let event = 0; event < 4; event += 1) {
      window.add();
      vi.advanceTimersByTime(300);
    }
    expect(onSettle.mock.calls).toEqual([[4]]);
  });
  it('starts a new window for an event that arrives while the report still runs', async () => {
    let finishPass!: () => void;
    const onSettle = vi.fn(() => new Promise<void>((resolve) => (finishPass = resolve)));
    const window = createSettleWindow(1000, onSettle, 'fixed');
    window.add();
    vi.advanceTimersByTime(1000);
    window.add();
    vi.advanceTimersByTime(1000);
    finishPass();
    await Promise.resolve();
    expect(onSettle.mock.calls).toEqual([[1], [1]]);
  });
});
