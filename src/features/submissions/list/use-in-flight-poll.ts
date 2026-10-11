import { onScopeDispose, watch } from 'vue';
import type { Ref } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import { POLL_DELAYS_MS, nextDelayIndex, pollableIds, progressKey } from './in-flight-poll';

interface InFlightPollOptions {
  rows: Ref<SubmissionListItem[]>;
  /** Live updates on and a signed-in viewer (a signed-out one gets no strips to refresh). */
  enabled: Ref<boolean>;
  /** Reads the shown page again and resolves to its rows. */
  refetchRows: () => Promise<SubmissionListItem[] | undefined>;
}

/**
 * The public feed carries no per-test frames, so while shown rows with a strip are judged the page is read again: after
 * 3 s, then 5 s and 10 s while nothing moved, only while the tab is visible, and for at most two minutes per row.
 */
export function useInFlightPoll({ rows, enabled, refetchRows }: InFlightPollOptions) {
  const firstSeen = new Map<string, number>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let delayIndex = 0;

  const due = () =>
    enabled.value && document.visibilityState === 'visible'
      ? pollableIds(rows.value, firstSeen, Date.now())
      : [];
  const stop = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  function schedule() {
    if (timer !== null || !due().length) return;
    timer = setTimeout(() => void poll(), POLL_DELAYS_MS[delayIndex]);
  }
  async function poll() {
    timer = null;
    const ids = due();
    if (!ids.length) return;
    const before = progressKey(rows.value, ids);
    const fresh = (await refetchRows()) ?? rows.value;
    delayIndex = nextDelayIndex(delayIndex, progressKey(fresh, ids) !== before);
    schedule();
  }
  function noteRows(list: readonly SubmissionListItem[]) {
    const now = Date.now();
    for (const row of list)
      if (IN_PROGRESS_STATUSES.includes(row.status) && !firstSeen.has(row.id))
        firstSeen.set(row.id, now);
  }
  const onVisibility = () => (document.visibilityState === 'visible' ? schedule() : stop());

  watch(
    rows,
    (list) => {
      noteRows(list);
      schedule();
    },
    { immediate: true },
  );
  watch(enabled, (isOn) => {
    delayIndex = 0;
    if (isOn) schedule();
    else stop();
  });
  document.addEventListener('visibilitychange', onVisibility);
  onScopeDispose(() => {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
  });
}
