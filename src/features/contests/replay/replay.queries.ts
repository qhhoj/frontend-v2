import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { ApiError } from '@/api/client';
import { loadReplay } from '@/api/replay.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** While the server builds the replay (202) the page asks again on this interval. */
export const REPLAY_POLL_MS = 5000;
/** The server sends `Cache-Control: private, max-age=60` for a ready replay. */
const REPLAY_STALE_MS = 60_000;
const MAX_NETWORK_RETRIES = 2;

/** 403, 404 and 409 are answers (frozen, not ready, not ended), not failures: asking again repeats them. */
const isRefusal = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

/** The whole replay of one contest for this viewer (the freeze gate depends on who asks). */
export const useReplayQuery = (key: Ref<string>, isEnabled: Ref<boolean>) => {
  const viewerId = useViewerId();
  return useQuery({
    enabled: isEnabled,
    queryKey: computed(() => ['contests', 'replay', viewerId.value, key.value]),
    queryFn: () => loadReplay(key.value),
    staleTime: REPLAY_STALE_MS,
    retry: (failures, error) => !isRefusal(error) && failures < MAX_NETWORK_RETRIES,
    refetchInterval: (query) => (query.state.data?.state === 'building' ? REPLAY_POLL_MS : false),
    refetchIntervalInBackground: false,
  });
};
