import type { Page } from './client';
import type { Schemas } from './schemas';
import { apiGet, apiGetPage, apiSend } from './typed';
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

export const fetchUserPage = (username: string): Promise<UserPage> =>
  apiGet('/users/{username}', { path: { username } });
export const fetchRatingHistory = (username: string): Promise<RatingHistoryEntry[]> =>
  apiGet('/users/{username}/ratings', { path: { username } });
export const fetchLeaderboard = (query: LeaderboardQuery): Promise<Page<LeaderboardEntry>> =>
  apiGetPage('/users', { query });
export const fetchRank = (username: string, field: RankField): Promise<RankResponse> =>
  apiGet('/users/{username}/rank', { path: { username }, query: { sort: field } });
export const fetchSolved = (username: string): Promise<SolvedResponse> =>
  apiGet('/users/{username}/solved', { path: { username } });
export const fetchPpBreakdown = (
  username: string,
  page: number,
): Promise<Page<PpEntry, Schemas['HasMorePageMetaResponse']>> =>
  apiGetPage('/users/{username}/pp-breakdown', { path: { username }, query: { page } });
export const fetchActivity = (username: string, timezone: string): Promise<ActivityResponse> =>
  apiGet('/users/{username}/activity', { path: { username }, query: { timezone } });
export const fetchUserPosts = (username: string, page: number): Promise<Page<PostListItem>> =>
  apiGetPage('/users/{username}/blog', { path: { username }, query: { page } });
/** Keyset: `before` is the last comment id of the previous page. */
export const fetchUserComments = (
  username: string,
  before?: string,
): Promise<Page<RecentComment, Schemas['CursorPageMetaResponse']>> =>
  apiGetPage('/users/{username}/comments', { path: { username }, query: { before } });
export const banUser = (username: string, reason: string): Promise<void> =>
  apiSend('post', '/users/{username}/ban', { path: { username }, body: { reason } });
