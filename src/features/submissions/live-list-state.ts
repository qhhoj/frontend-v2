import { computed, nextTick, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { SubmissionFilters } from './use-submission-filters';

const FIRST_PAGE = 1;

/** Changes when the list itself is another one (page and Live updates do not count). */
export const useListFilterKey = (filters: Ref<SubmissionFilters>) =>
  computed(() => {
    const { problem, user, results, languageIds } = filters.value;
    return JSON.stringify({ problem, user, results, languageIds });
  });

/** The text of the polite status region. */
export function useAnnouncer() {
  const text = ref('');
  return {
    text,
    /** Clears first: the same text twice in a row would not change the region, so a screen reader would stay silent. */
    async announce(message: string) {
      text.value = '';
      await nextTick();
      text.value = message;
    },
  };
}

/** What the viewed list held at its top when it was last seen whole; the pill counts growth from there. */
export function useNewRowBaseline(filters: Ref<SubmissionFilters>, total: Ref<number | undefined>) {
  let baselineTotal: number | undefined;
  /** Without a total the pill can only count `queued` frames. */
  let queuedSinceBaseline = 0;
  const reset = () => {
    baselineTotal = undefined;
    queuedSinceBaseline = 0;
  };
  // Page 1 is the top, so it is always the baseline; a later page keeps the one it was reached with.
  watch([total, () => filters.value.page], ([knownTotal, page]) => {
    if (knownTotal === undefined) return;
    if (page === FIRST_PAGE) queuedSinceBaseline = 0;
    if (page === FIRST_PAGE || baselineTotal === undefined) baselineTotal = knownTotal;
  });
  return {
    reset,
    /** Rows that arrived above the viewed page, given the first page's current total (when the API sends one). */
    rowsAbove(firstPageTotal: number | undefined, queuedFrames: number): number {
      queuedSinceBaseline += queuedFrames;
      if (firstPageTotal === undefined || baselineTotal === undefined) return queuedSinceBaseline;
      return Math.max(0, firstPageTotal - baselineTotal);
    },
  };
}
