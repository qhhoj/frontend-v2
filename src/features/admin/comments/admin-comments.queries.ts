import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchAdminComments, setCommentsHidden } from '@/api/comments.api';
import type { AdminCommentQuery } from '@/api/comments.api';
import { useViewerId } from '@/stores/use-viewer-id';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { keepPreviousForSameViewer } from '@/features/contests/keep-previous-for-viewer';

const COMMENTS_KEY = ['admin', 'comments'] as const;

export const useAdminCommentsQuery = (query: MaybeRefOrGetter<AdminCommentQuery>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...COMMENTS_KEY, toValue(query), viewer.value]),
    queryFn: () => fetchAdminComments(toValue(query)),
    placeholderData: computed(() => keepPreviousForSameViewer(3, viewer.value)),
  });
};

/** Hide or show many comments; the list and the report queue (its hidden chips) are fetched again. */
export const useBulkHide = () =>
  useAdminMutation({
    mutate: ({ ids, hidden }: { ids: string[]; hidden: boolean }) => setCommentsHidden(ids, hidden),
    invalidates: () => [[...COMMENTS_KEY], ['admin', 'comment-reports']],
  });
