import { computed } from 'vue';
import { useCurrentParticipationQuery } from '@/features/contests/contests.queries';
import { useNow } from '@/lib/use-now';
import { useSessionStore } from '@/stores/session.store';

/**
 * True while the signed-in viewer is inside a contest that is running for them (live, virtual or spectating; not merely
 * registered). Asks the server only while `isAsked` holds, so viewers without roaming Bits cost nothing.
 */
export function useInLiveContest(isAsked: () => boolean) {
  const session = useSessionStore();
  const isEnabled = computed(() => isAsked() && session.status === 'authenticated');
  const { data } = useCurrentParticipationQuery(isEnabled);
  const now = useNow(60_000);
  return computed(() => {
    const participation = data.value?.participation;
    return (
      isEnabled.value &&
      !!participation &&
      !participation.isRegistered &&
      Date.parse(participation.endTime) > now.value
    );
  });
}
