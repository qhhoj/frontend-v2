import { serverNow } from '@/lib/server-clock';
import { computed, onScopeDispose, ref, watch } from 'vue';
import { useSessionStore } from '@/stores/session.store';
import { useCurrentParticipationQuery } from '../contests.queries';
import { activeParticipation } from './current-contest';

/** `setTimeout` cannot wait longer than about 24.8 days; a longer run is re-checked on each answer of the query. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * The contest the signed-in viewer is taking part in right now (live, virtual or spectating), or null. Asks the server
 * only while `isAsked` holds; a timer clears it the moment the participation ends. `isPending` is true while unknown.
 */
export function useCurrentContest(isAsked: () => boolean = () => true) {
  const session = useSessionStore();
  const isEnabled = computed(() => isAsked() && session.status === 'authenticated');
  const { data, isPending, dataUpdatedAt } = useCurrentParticipationQuery(isEnabled);
  /** Re-read when the answer changes and when its end passes; the computed below reads the clock only through it. */
  const checkedAt = ref(serverNow());
  let endTimer: ReturnType<typeof setTimeout> | undefined;
  watch(
    // Every answer re-reads the clock, even one equal to the last (an end past the timer's reach).
    [() => data.value?.participation.endTime, dataUpdatedAt],
    ([endTime]) => {
      clearTimeout(endTimer);
      checkedAt.value = serverNow();
      const msLeft = endTime ? Date.parse(endTime) - checkedAt.value : 0;
      if (msLeft > 0 && msLeft < MAX_TIMEOUT_MS)
        endTimer = setTimeout(() => (checkedAt.value = serverNow()), msLeft + 1);
    },
    { immediate: true },
  );
  onScopeDispose(() => clearTimeout(endTimer));
  const current = computed(() =>
    isEnabled.value ? activeParticipation(data.value, checkedAt.value) : null,
  );
  return { current, isPending: computed(() => isEnabled.value && isPending.value) };
}
