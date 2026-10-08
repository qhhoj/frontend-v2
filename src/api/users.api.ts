import { apiPage, apiRequest } from './client';
import type { PostListItem } from './types/blog';
import type { RecentComment } from './types/comments';
import type {
  ActivityResponse,
  LeaderboardEntry,
  LeaderboardQuery,
  PpEntry,
  RankField,
  RankResponse,
  RatingHistoryEntry,
  SolvedResponse,
  UserPage,
} from './types/users';

const userPath = (username: string) => `/users/${encodeURIComponent(username)}`;

export const fetchUserPage = (username: string) => apiRequest<UserPage>(userPath(username));
export const fetchRatingHistory = (username: string) =>
  apiRequest<RatingHistoryEntry[]>(`${userPath(username)}/ratings`);
export const fetchLeaderboard = (query: LeaderboardQuery) =>
  apiPage<LeaderboardEntry>('/users', { query: { ...query } });
export const fetchContributors = (page: number) =>
  apiPage<LeaderboardEntry>('/contributors', { query: { page } });
export const fetchRank = (username: string, field: RankField) =>
  apiRequest<RankResponse>(`${userPath(username)}/rank`, { query: { sort: field } });
export const fetchSolved = (username: string) =>
  apiRequest<SolvedResponse>(`${userPath(username)}/solved`);
export const fetchPpBreakdown = (username: string, page: number) =>
  apiPage<PpEntry>(`${userPath(username)}/pp-breakdown`, { query: { page } });
export const fetchActivity = (username: string, timezone: string) =>
  apiRequest<ActivityResponse>(`${userPath(username)}/activity`, { query: { timezone } });
export const fetchUserPosts = (username: string, page: number) =>
  apiPage<PostListItem>(`${userPath(username)}/blog`, { query: { page } });
/** Keyset: `before` is the last comment id of the previous page. */
export const fetchUserComments = (username: string, before?: string) =>
  apiPage<RecentComment>(`${userPath(username)}/comments`, { query: { before } });
export const banUser = (username: string, reason: string) =>
  apiRequest<void>(`${userPath(username)}/ban`, { method: 'POST', body: { reason } });
