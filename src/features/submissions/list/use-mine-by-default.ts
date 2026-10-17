import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCurrentContest } from '@/features/contests/bar/use-current-contest';
import { useSessionStore } from '@/stores/session.store';

/**
 * P-08 (Q-04 C): a signed-in viewer who opens the bare site list lands on their own submissions ("Của tôi"); a visitor, or a
 * viewer taking part in a running contest, keeps the site feed. Decided once per visit, so turning "Của tôi" off stays off,
 * and never over a filter the viewer picked meanwhile. When the session cannot be read the feed is kept. `isDeciding` holds
 * the list until then, so the feed is not fetched only to be replaced.
 */
export function useMineByDefault() {
  const route = useRoute();
  const router = useRouter();
  const session = useSessionStore();
  const isBare = () => Object.keys(route.query).length === 0;
  const isDecided = ref(!isBare());
  const contest = useCurrentContest(() => !isDecided.value);
  let isSettled = isDecided.value;
  /** Ends the wait once; with a username, opens "Của tôi" first. */
  function settle(username: string | null) {
    if (isSettled) return;
    isSettled = true;
    const finish = () => (isDecided.value = true);
    if (username && isBare())
      void router.replace({ query: { user: username } }).then(finish, finish);
    else finish();
  }

  watch(
    [() => session.status, () => contest.isPending.value, isBare],
    ([status, isContestPending, isStillBare]) => {
      if (!isStillBare || status === 'anonymous') settle(null);
      else if (status === 'authenticated' && !isContestPending)
        settle(contest.current.value === null ? (session.user?.username ?? null) : null);
    },
    { immediate: true },
  );
  // A session that cannot be read stays 'unknown': keep the feed rather than hold the list.
  if (!isSettled)
    void session.ensureLoaded().then(
      () => session.status === 'unknown' && settle(null),
      () => settle(null),
    );
  return { isDeciding: computed(() => !isDecided.value) };
}
