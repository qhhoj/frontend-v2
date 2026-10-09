import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchContestExport, fetchFeedKey } from '@/api/contest-ops.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** While an export is being prepared its status is re-read on this interval, so the link appears without a reload. */
export const EXPORT_POLL_MS = 5000;

/** Account-owned staff reads: the viewer id keeps one account's answer from another's. */
export const contestActionsKey = (key: string, viewer: string) =>
  ['admin', 'contest-actions', key, viewer] as const;
export const feedKeyStatusKey = (key: string, viewer: string) =>
  ['admin', 'contest-feed-key', key, viewer] as const;
export const contestExportKey = (key: string, viewer: string) =>
  ['admin', 'contest-export', key, viewer] as const;

export const useFeedKeyStatusQuery = (key: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => feedKeyStatusKey(toValue(key), viewer.value)),
    queryFn: () => fetchFeedKey(toValue(key)),
  });
};

/** The backend refuses before the end, so the status is asked only for an ended contest. */
export const useContestExportQuery = (
  key: MaybeRefOrGetter<string>,
  isEnded: MaybeRefOrGetter<boolean>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => contestExportKey(toValue(key), viewer.value)),
    queryFn: () => fetchContestExport(toValue(key)),
    enabled: computed(() => toValue(isEnded)),
    refetchInterval: (query) => (query.state.data?.state === 'preparing' ? EXPORT_POLL_MS : false),
  });
};
