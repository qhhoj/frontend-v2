import { computed } from 'vue';
import { useLiveContest } from '@/features/contests/live/use-live-contest';

/**
 * True while the signed-in viewer is inside a contest that is running for them (live, virtual or spectating; not merely
 * registered), and while that is not known yet. Shares the app shell's `/contests/current` query (the shell asks it for
 * every signed-in viewer, for the contest announcements).
 */
export function useInLiveContest(isAsked: () => boolean) {
  const { contest, isPending } = useLiveContest(isAsked);
  return computed(() => isPending.value || contest.value !== null);
}
