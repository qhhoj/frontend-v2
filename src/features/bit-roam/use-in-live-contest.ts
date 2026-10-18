import { computed } from 'vue';
import { useCurrentContest } from '@/features/contests/bar/use-current-contest';

/**
 * True while the signed-in viewer is inside a contest that is running for them (live, virtual or spectating; not merely
 * registered), and while that is not known yet. Asks the server only while `isAsked` holds, so viewers without roaming Bits
 * cost nothing.
 */
export function useInLiveContest(isAsked: () => boolean) {
  const { current, isPending } = useCurrentContest(isAsked);
  return computed(() => isPending.value || current.value !== null);
}
