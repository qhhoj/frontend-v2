import { apiPage, apiRequest } from './client';
import type {
  LeaderboardEntry,
  LeaderboardQuery,
  RatingHistoryEntry,
  UserPage,
} from './types/users';

const userPath = (username: string) => `/users/${encodeURIComponent(username)}`;

export const fetchUserPage = (username: string) => apiRequest<UserPage>(userPath(username));
export const fetchRatingHistory = (username: string) =>
  apiRequest<RatingHistoryEntry[]>(`${userPath(username)}/ratings`);
export const fetchLeaderboard = (query: LeaderboardQuery) =>
  apiPage<LeaderboardEntry>('/users', { query: { ...query } });
