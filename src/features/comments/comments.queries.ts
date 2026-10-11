import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { QueryClient } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  deleteComment,
  editComment,
  fetchComment,
  fetchCommentPage,
  fetchCommentVotes,
  fetchRevisions,
  lockCommentPage,
  postComment,
  setCommentHidden,
  unlockCommentPage,
} from '@/api/comments.api';
import type { CommentDraft } from '@/api/comments.api';
import type { CommentPageType } from '@/api/types/comments';
import { useViewerId } from '@/stores/use-viewer-id';

/** Every cached page number (and viewer) of one comment page. */
export const commentPageKey = (type: CommentPageType, key: string) =>
  ['comments', 'page', type, key] as const;

/**
 * After a write on a page: its comment pages, and what counts its comments (a blog post's `commentCount`, the home and
 * profile lists of recent comments). `editedId` also drops that comment's cached history.
 */
export function invalidateCommentPage(
  queryClient: QueryClient,
  type: CommentPageType,
  key: string,
  editedId?: string,
) {
  const keys: (readonly unknown[])[] = [commentPageKey(type, key), ['home']];
  if (type === 'blog') keys.push(['posts']);
  if (editedId) keys.push(['comments', 'revisions', editedId], ['comments', 'detail', editedId]);
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export const useCommentPageQuery = (
  type: MaybeRefOrGetter<CommentPageType>,
  key: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      ...commentPageKey(toValue(type), toValue(key)),
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

/** The writes of one comment page; each refreshes the page once it lands (and on a refusal, which may mean the page changed). */
export function useCommentWrites(
  type: MaybeRefOrGetter<CommentPageType>,
  key: MaybeRefOrGetter<string>,
) {
  const queryClient = useQueryClient();
  const refresh = (editedId?: string) =>
    invalidateCommentPage(queryClient, toValue(type), toValue(key), editedId);
  return {
    post: useMutation({
      mutationFn: (draft: CommentDraft) => postComment(toValue(type), toValue(key), draft),
      onSuccess: () => refresh(),
    }),
    edit: useMutation({
      mutationFn: ({ id, body }: { id: string; body: string }) => editComment(id, body),
      onSuccess: (_answer, { id }) => refresh(id),
    }),
    hide: useMutation({
      mutationFn: (id: string) => setCommentHidden(id, true),
      onSettled: () => refresh(),
    }),
    unhide: useMutation({
      mutationFn: (id: string) => setCommentHidden(id, false),
      onSettled: () => refresh(),
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteComment(id),
      onSettled: (_answer, _error, id) => refresh(id),
    }),
    setLocked: useMutation({
      mutationFn: (locked: boolean) =>
        locked
          ? lockCommentPage(toValue(type), toValue(key))
          : unlockCommentPage(toValue(type), toValue(key)),
      onSettled: () => refresh(),
    }),
    refresh,
  };
}
