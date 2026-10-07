import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchLeaderboard, fetchRatingHistory, fetchUserPage } from '@/api/users.api';

/** Idle while `username` is empty (anonymous viewer). */
export const useUserPageQuery = (username: MaybeRefOrGetter<string>) =>
  useQuery({
    queryKey: computed(() => ['users', 'page', toValue(username)]),
    queryFn: () => fetchUserPage(toValue(username)),
    enabled: computed(() => Boolean(toValue(username))),
  });

export const useRatingHistoryQuery = (username: MaybeRefOrGetter<string>) =>
  useQuery({
    queryKey: computed(() => ['users', 'ratings', toValue(username)]),
    queryFn: () => fetchRatingHistory(toValue(username)),
  });

const TOP_USERS = { sort: 'rating', pageSize: 3 } as const;
export const useTopUsersQuery = () =>
  useQuery({
    queryKey: ['users', 'leaderboard', TOP_USERS],
    queryFn: () => fetchLeaderboard(TOP_USERS),
    select: (result) => result.items,
  });
