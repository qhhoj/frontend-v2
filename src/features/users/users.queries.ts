import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { LEADERBOARD_PAGE_SIZE } from '@/api/types/users';
import { viewerTimeZone } from '@/lib/format-date';
import type { LeaderboardSort, RankField } from '@/api/types/users';
import {
  fetchActivity,
  fetchLeaderboard,
  fetchPpBreakdown,
  fetchRank,
  fetchRatingHistory,
  fetchSolved,
  fetchUserComments,
  fetchUserPage,
  fetchUserPosts,
} from '@/api/users.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** Idle while `username` is empty (anonymous viewer). The answer lists organizations by the viewer's rights. */
export const useUserPageQuery = (username: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['users', 'page', toValue(username), viewer.value]),
    queryFn: () => fetchUserPage(toValue(username)),
    enabled: computed(() => Boolean(toValue(username))),
  });
};

/** Hidden or frozen contests read differently per viewer (E4). */
export const useRatingHistoryQuery = (username: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['users', 'ratings', toValue(username), viewer.value]),
    queryFn: () => fetchRatingHistory(toValue(username)),
  });
};

const TOP_USERS = { sort: 'rating', pageSize: 3 } as const;
export const useTopUsersQuery = () =>
  useQuery({
    queryKey: ['users', 'leaderboard', TOP_USERS],
    queryFn: () => fetchLeaderboard(TOP_USERS),
    select: (result) => result.items,
  });

const fetchBoard = (sort: LeaderboardSort, page: number) =>
  fetchLeaderboard({ sort, page, pageSize: LEADERBOARD_PAGE_SIZE });
export const useLeaderboardQuery = (
  sort: MaybeRefOrGetter<LeaderboardSort>,
  page: MaybeRefOrGetter<number>,
) =>
  useQuery({
    queryKey: computed(() => ['users', 'board', toValue(sort), toValue(page)]),
    queryFn: () => fetchBoard(toValue(sort), toValue(page)),
    placeholderData: keepPreviousData,
  });

export const useRankQuery = (
  username: MaybeRefOrGetter<string>,
  field: MaybeRefOrGetter<RankField>,
) =>
  useQuery({
    queryKey: computed(() => ['users', 'rank', toValue(username), toValue(field)]),
    queryFn: () => fetchRank(toValue(username), toValue(field)),
    enabled: computed(() => Boolean(toValue(username))),
  });

export const useSolvedQuery = (username: MaybeRefOrGetter<string>) =>
  useQuery({
    queryKey: computed(() => ['users', 'solved', toValue(username)]),
    queryFn: () => fetchSolved(toValue(username)),
  });

export const usePpQuery = (username: MaybeRefOrGetter<string>, page: MaybeRefOrGetter<number>) =>
  useQuery({
    queryKey: computed(() => ['users', 'pp', toValue(username), toValue(page)]),
    queryFn: () => fetchPpBreakdown(toValue(username), toValue(page)),
    placeholderData: keepPreviousData,
  });

export const useActivityQuery = (username: MaybeRefOrGetter<string>) => {
  const timezone = viewerTimeZone(); // the heatmap's days are the viewer's days
  return useQuery({
    queryKey: computed(() => ['users', 'activity', toValue(username), timezone]),
    queryFn: () => fetchActivity(toValue(username), timezone),
  });
};

export const useUserPostsQuery = (
  username: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['users', 'posts', toValue(username), toValue(page), viewer.value]),
    queryFn: () => fetchUserPosts(toValue(username), toValue(page)),
    placeholderData: keepPreviousData,
  });
};

/** Keyset pages (E9); only staff reach the page that asks (`USER_COMMENTS_PERMISSION`). */
export const useUserCommentsQuery = (username: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useInfiniteQuery({
    queryKey: computed(() => ['users', 'comments', toValue(username), viewer.value]),
    queryFn: ({ pageParam }) => fetchUserComments(toValue(username), pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.meta.nextBefore ?? undefined,
  });
};
