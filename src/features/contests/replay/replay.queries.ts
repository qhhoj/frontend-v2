import { useQuery } from '@tanstack/vue-query';
import { computed, watch } from 'vue';
import type { Ref } from 'vue';
import { ApiError } from '@/api/client';
import { loadReplay } from '@/api/replay.api';
import type { ReplayLoad } from '@/api/types/replay';
import { useViewerId } from '@/stores/use-viewer-id';
import { isReplayRefusal } from './replay-state';

/** While the server builds the replay (202) the page asks again on this interval. */
export const REPLAY_POLL_MS = 5000;
/** `replay_not_ready` (the build could not be queued) is asked again after 5 s, 10 s, 20 s… up to this. */
export const NOT_READY_MAX_POLL_MS = 60_000;
/** 4xx answers are not retried at once (asking again repeats them), except a rebuild during the read; polling decides the rest. */
const isRepeatedAnswer = (error: unknown) =>
  error instanceof ApiError &&
  error.status >= 400 &&
  error.status < 500 &&
  error.code !== 'replay_changed';
/** The server sends `Cache-Control: private, max-age=60` for a ready replay. */
const REPLAY_STALE_MS = 60_000;
const MAX_NETWORK_RETRIES = 2;

const isNotReady = (error: unknown) =>
  error instanceof ApiError && error.code === 'replay_not_ready';

/** The wait before the next read after `streak` `replay_not_ready` answers in a row (1, 2, 3…). */
export const notReadyPollMs = (streak: number) =>
  Math.min(REPLAY_POLL_MS * 2 ** Math.max(streak - 1, 0), NOT_READY_MAX_POLL_MS);

/**
 * When to ask again: a replay the server could not queue yet with backoff; a build in progress every 5 s, through a
 * passing network or server failure too; never after any other refusal (asking again repeats it) or once it is ready.
 */
function nextPollMs(error: unknown, load: ReplayLoad | undefined, notReadyStreak: number) {
  if (isNotReady(error)) return notReadyPollMs(notReadyStreak);
  if (isReplayRefusal(error)) return false;
  return load?.state === 'building' ? REPLAY_POLL_MS : false;
}

/** The whole replay of one contest for this viewer (the freeze gate depends on who asks). */
export const useReplayQuery = (key: Ref<string>, isEnabled: Ref<boolean>) => {
  const viewerId = useViewerId();
  const queryKey = computed(() => ['contests', 'replay', viewerId.value, key.value]);
  let notReadyStreak = 0;
  watch(queryKey, () => (notReadyStreak = 0));
  async function read() {
    try {
      const load = await loadReplay(key.value);
      notReadyStreak = 0;
      return load;
    } catch (error) {
      notReadyStreak = isNotReady(error) ? notReadyStreak + 1 : 0;
      throw error;
    }
  }
  return useQuery({
    enabled: isEnabled,
    queryKey,
    queryFn: read,
    staleTime: REPLAY_STALE_MS,
    retry: (failures, error) => !isRepeatedAnswer(error) && failures < MAX_NETWORK_RETRIES,
    refetchInterval: (query) => nextPollMs(query.state.error, query.state.data, notReadyStreak),
    refetchIntervalInBackground: false,
    /** Thousands of event tuples are read on every tick: plain objects, not deep reactive proxies. */
    shallow: true,
  });
};
