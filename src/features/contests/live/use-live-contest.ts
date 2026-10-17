import { computed, onScopeDispose, ref, watch } from 'vue';
import type { CurrentParticipation } from '@/api/types/contests';
import { useCurrentParticipationQuery } from '@/features/contests/contests.queries';
import { useSessionStore } from '@/stores/session.store';

/**
 * The contest the signed-in viewer is inside right now (live, virtual or spectating; not merely registered), or null. Asks
 * the server only while `isAsked` holds; a timer turns it null when the participation ends. `isPending` holds until known.
 */
export function useLiveContest(isAsked: () => boolean = () => true) {
  const session = useSessionStore();
  const isEnabled = computed(() => isAsked() && session.status === 'authenticated');
  const { data, isPending } = useCurrentParticipationQuery(isEnabled);
  const participation = computed(() => data.value?.participation);
  const hasEnded = ref(false);
  let endTimer: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => participation.value?.endTime,
    (endTime) => {
      clearTimeout(endTimer);
      const msLeft = endTime ? Date.parse(endTime) - Date.now() : 0;
      hasEnded.value = msLeft <= 0;
      // setTimeout cannot wait longer than about 24.8 days; a longer run is re-read on the next refetch.
      if (msLeft > 0 && msLeft < 2 ** 31)
        endTimer = setTimeout(() => (hasEnded.value = true), msLeft);
    },
    { immediate: true },
  );
  onScopeDispose(() => clearTimeout(endTimer));
  const contest = computed<CurrentParticipation['contest'] | null>(() => {
    if (!isEnabled.value || !data.value || !participation.value) return null;
    return participation.value.isRegistered || hasEnded.value ? null : data.value.contest;
  });
  return {
    contest,
    /** Asked and not answered yet. */
    isPending: computed(() => isEnabled.value && isPending.value),
  };
}
