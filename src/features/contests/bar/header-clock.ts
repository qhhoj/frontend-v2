import { onBeforeUnmount, reactive, watchEffect } from 'vue';

/**
 * The contests whose `ContestHeader` shows a clock right now, one entry per mounted header. The shell's `ContestBar`
 * steps aside only for its own contest's entry, so a header still loading (or whose contest failed to load) leaves the
 * bar and its clock in place.
 */
const shownClocks = reactive(new Map<symbol, string>());

export const isClockShownFor = (contestKey: string) =>
  [...shownClocks.values()].includes(contestKey);

/** Lists this header's contest while `isShown()` holds; a header that unmounts leaves the list. */
export function useShownClock(contestKey: () => string, isShown: () => boolean) {
  const entry = Symbol('contest-header-clock');
  watchEffect(() => {
    if (isShown()) shownClocks.set(entry, contestKey());
    else shownClocks.delete(entry);
  });
  onBeforeUnmount(() => shownClocks.delete(entry));
}
