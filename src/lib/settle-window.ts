/**
 * How a burst of events settles:
 * - `trailing`: once no event arrived for the window (tickets, notifications);
 * - `fixed`: the window starts at the first event and does not stretch (the submission list, which a busy feed never lets go quiet).
 */
export type SettleMode = 'trailing' | 'fixed';

/**
 * Counts events and reports the count once per settled burst (one refetch and one announcement per burst).
 * Events that arrive while `onSettle` is still running join the next window.
 */
export function createSettleWindow(
  windowMs: number,
  onSettle: (count: number) => unknown,
  mode: SettleMode = 'trailing',
) {
  let count = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const settle = () => {
    const settled = count;
    count = 0;
    timer = undefined;
    void onSettle(settled);
  };
  const stopTimer = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  return {
    add() {
      count += 1;
      if (mode === 'trailing') stopTimer();
      timer ??= setTimeout(settle, windowMs);
    },
    cancel() {
      stopTimer();
      count = 0;
    },
  };
}
