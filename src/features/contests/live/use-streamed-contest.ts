import { computed, onScopeDispose, ref, watch } from 'vue';
import { useCurrentContest } from '../bar/use-current-contest';

/** `setTimeout` cannot wait longer than about 24.8 days; a longer wait is re-read when the time changes. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * The contest whose announcements the app shell streams: the viewer's current contest (`useCurrentContest`) until the
 * contest's own end, when pushes stop (a virtual run goes on after it). A timer turns it null at that end. Contest pages
 * read it to leave that contest's stream to the shell; `isPending` holds while the current contest is unknown.
 */
export function useStreamedContest() {
  const { current, isPending } = useCurrentContest();
  const hasEnded = ref(false);
  let endTimer: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => current.value?.contest.endTime,
    (endTime) => {
      clearTimeout(endTimer);
      const msLeft = endTime ? Date.parse(endTime) - Date.now() : 0;
      hasEnded.value = msLeft <= 0;
      if (msLeft > 0 && msLeft < MAX_TIMEOUT_MS)
        endTimer = setTimeout(() => (hasEnded.value = true), msLeft);
    },
    { immediate: true },
  );
  onScopeDispose(() => clearTimeout(endTimer));
  const contest = computed(() => (current.value && !hasEnded.value ? current.value.contest : null));
  return { contest, isPending };
}
