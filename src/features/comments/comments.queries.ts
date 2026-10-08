import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  fetchComment,
  fetchCommentPage,
  fetchCommentVotes,
  fetchRevisions,
} from '@/api/comments.api';
import type { CommentPageType } from '@/api/types/comments';
import { useViewerId } from '@/stores/use-viewer-id';

export const useCommentPageQuery = (
  type: MaybeRefOrGetter<CommentPageType>,
  key: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      'comments',
      'page',
      toValue(type),
      toValue(key),
      toValue(page),
      viewer.value,
    ]),
    queryFn: () => fetchCommentPage(toValue(type), toValue(key), toValue(page)),
    placeholderData: keepPreviousData,
  });
};

/** One comment (a deep link); idle for an empty id. */
export const useCommentQuery = (id: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['comments', 'detail', toValue(id), viewer.value]),
    queryFn: () => fetchComment(toValue(id)),
    enabled: computed(() => Boolean(toValue(id))),
  });
};

export const useRevisionsQuery = (
  id: MaybeRefOrGetter<string>,
  isEnabled: MaybeRefOrGetter<boolean>,
) =>
  useQuery({
    queryKey: computed(() => ['comments', 'revisions', toValue(id)]),
    queryFn: () => fetchRevisions(toValue(id)),
    enabled: computed(() => toValue(isEnabled)),
  });

export const useCommentVotesQuery = (
  id: MaybeRefOrGetter<string>,
  isEnabled: MaybeRefOrGetter<boolean>,
) =>
  useQuery({
    queryKey: computed(() => ['comments', 'votes', toValue(id)]),
    queryFn: () => fetchCommentVotes(toValue(id)),
    enabled: computed(() => toValue(isEnabled)),
  });
