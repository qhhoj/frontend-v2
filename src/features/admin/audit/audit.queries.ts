import { useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchAuditFeed } from '@/api/audit-admin.api';
import type { AuditRequest } from '@/api/audit-admin.api';
import { useViewerId } from '@/stores/use-viewer-id';

const AUDIT_KEY = ['admin', 'audit'] as const;

/** The change log, newest first; each "older" page continues from the last entry's id. */
export function useAuditFeedQuery(request: MaybeRefOrGetter<AuditRequest>) {
  const viewer = useViewerId();
  return useInfiniteQuery({
    queryKey: computed(() => [...AUDIT_KEY, 'feed', toValue(request), viewer.value]),
    queryFn: ({ pageParam }) =>
      fetchAuditFeed({ ...toValue(request), ...(pageParam && { before: pageParam }) }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextBefore ?? undefined,
  });
}

/** The dashboard's few newest changes, for viewers who may open the change log. */
export function useRecentChangesQuery(limit: number, isEnabled: MaybeRefOrGetter<boolean>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...AUDIT_KEY, 'recent', limit, viewer.value]),
    queryFn: () => fetchAuditFeed({ limit }),
    enabled: computed(() => toValue(isEnabled)),
  });
}
