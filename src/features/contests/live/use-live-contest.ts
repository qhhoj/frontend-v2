import { computed, onScopeDispose, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { CurrentParticipation } from '@/api/types/contests';
import { useCurrentParticipationQuery } from '@/features/contests/contests.queries';
import { useSessionStore } from '@/stores/session.store';

/** True once the ISO time `deadline` returns has passed (or when there is none); one timer, re-armed when the time changes. */
function usePassed(deadline: () => string | undefined): Ref<boolean> {
  const hasPassed = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(
    deadline,
    (time) => {
      clearTimeout(timer);
      const msLeft = time ? Date.parse(time) - Date.now() : 0;
      hasPassed.value = msLeft <= 0;
      // setTimeout cannot wait longer than about 24.8 days; a longer wait is re-read on the next refetch.
      if (msLeft > 0 && msLeft < 2 ** 31)
        timer = setTimeout(() => (hasPassed.value = true), msLeft);
    },
    { immediate: true },
  );
  onScopeDispose(() => clearTimeout(timer));
  return hasPassed;
}

/**
 * The contest the signed-in viewer is inside right now (live, virtual or spectating; not merely registered), or null. Asks
 * the server only while `isAsked` holds; timers turn it null when the participation ends and `isContestRunning` false when
 * the contest itself ends (a virtual run goes on after that). `isPending` holds until the answer is known.
 */
export function useLiveContest(isAsked: () => boolean = () => true) {
  const session = useSessionStore();
  const isEnabled = computed(() => isAsked() && session.status === 'authenticated');
  const { data, isPending } = useCurrentParticipationQuery(isEnabled);
  const participation = computed(() => data.value?.participation);
  const participationEnded = usePassed(() => participation.value?.endTime);
  const contestEnded = usePassed(() => data.value?.contest.endTime);
  const contest = computed<CurrentParticipation['contest'] | null>(() => {
    if (!isEnabled.value || !data.value || !participation.value) return null;
    return participation.value.isRegistered || participationEnded.value ? null : data.value.contest;
  });
  return {
    contest,
    isContestRunning: computed(() => contest.value !== null && !contestEnded.value),
    /** Asked and not answered yet. */
    isPending: computed(() => isEnabled.value && isPending.value),
  };
}
