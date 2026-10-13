import { computed, onScopeDispose, ref, watch } from 'vue';
import { useCurrentParticipationQuery } from '@/features/contests/contests.queries';
import { useSessionStore } from '@/stores/session.store';

/**
 * True while the signed-in viewer is inside a contest that is running for them (live, virtual or spectating; not merely
 * registered), and while that is not known yet. Asks the server only while `isAsked` holds, so viewers without roaming Bits
 * cost nothing; a timer turns it false when the participation ends.
 */
export function useInLiveContest(isAsked: () => boolean) {
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
  return computed(() => {
    if (!isEnabled.value) return false;
    if (isPending.value) return true;
    return !!participation.value && !participation.value.isRegistered && !hasEnded.value;
  });
}
