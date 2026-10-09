import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchBalloons } from '@/api/balloons.api';
import { ApiError } from '@/api/client';
import { fetchContestTags } from '@/api/contest-tags.api';
import type { BalloonQuery } from '@/api/types/contest-ops';
import { useViewerId } from '@/stores/use-viewer-id';

/** The tag catalogue is public and the same for every viewer, so its key has no viewer id. */
export const CONTEST_TAGS_KEY = ['contests', 'tags'] as const;
/** The catalogue changes rarely (admin edits invalidate it): a read lasts five minutes. */
const CONTEST_TAGS_STALE_MS = 5 * 60_000;
/** Spec 3.2: the balloon queue is re-read every 10 s; vue-query pauses intervals while the tab is in the background. */
export const BALLOON_POLL_MS = 10_000;
const MAX_RETRIES = 2;

/** A 403 or 404 is the server's answer (not a volunteer, balloons off): asking again would only repeat it. */
export const isRefusal = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 403 || error.status === 404);

export const useContestTagsQuery = (isEnabled: MaybeRefOrGetter<boolean> = true) =>
  useQuery({
    queryKey: CONTEST_TAGS_KEY,
    queryFn: fetchContestTags,
    staleTime: CONTEST_TAGS_STALE_MS,
    enabled: computed(() => toValue(isEnabled)),
  });

/** The catalogue as the cache holds it, never fetched from here: chips stay neutral until a page has read it. */
export const useContestTagsCache = () => useContestTagsQuery(false);

/** `['contests', 'balloons', viewerId, contestKey, query]`: the viewer id sits where every contest key keeps it. */
export const balloonsKey = (viewerId: string, contestKey: string, query: BalloonQuery) =>
  ['contests', 'balloons', viewerId, contestKey, query] as const;

export const useBalloonsQuery = (
  contestKey: MaybeRefOrGetter<string>,
  query: MaybeRefOrGetter<BalloonQuery>,
) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => balloonsKey(viewerId.value, toValue(contestKey), toValue(query))),
    queryFn: () => fetchBalloons(toValue(contestKey), toValue(query)),
    refetchInterval: BALLOON_POLL_MS,
    retry: (failures, error) => !isRefusal(error) && failures < MAX_RETRIES,
  });
};
