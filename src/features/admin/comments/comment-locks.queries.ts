import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchCommentLocks, unlockCommentPage } from '@/api/comments.api';
import type { CommentPageLink } from '@/api/types/comments';
import { useViewerId } from '@/stores/use-viewer-id';
import { useAdminMutation } from '../ui/use-admin-mutation';

const LOCKS_KEY = ['admin', 'comment-locks'] as const;

export const useCommentLocksQuery = (page: MaybeRefOrGetter<number>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...LOCKS_KEY, toValue(page), viewer.value]),
    queryFn: () => fetchCommentLocks(toValue(page)),
    placeholderData: keepPreviousData,
  });
};

/** Opens a locked page for comments again; the list is fetched again. */
export const useUnlockPage = () =>
  useAdminMutation({
    mutate: (link: CommentPageLink) => unlockCommentPage(link.type, link.key),
    invalidates: () => [[...LOCKS_KEY]],
  });
