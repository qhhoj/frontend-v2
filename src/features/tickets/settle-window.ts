/** Counts events and reports the count once no event arrived for `windowMs` (one refetch and one announcement per burst). */
export function createSettleWindow(windowMs: number, onSettle: (count: number) => void) {
  let count = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const settle = () => {
    const settled = count;
    count = 0;
    timer = undefined;
    onSettle(settled);
  };
  return {
    add() {
      count += 1;
      clearTimeout(timer);
      timer = setTimeout(settle, windowMs);
    },
    cancel() {
      clearTimeout(timer);
      count = 0;
    },
  };
}
