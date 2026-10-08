import type { OrganizationSummary } from './organizations';

/** backend: apps/api/src/modules/users/pages/dto/user-page.response.ts (UserPageResponse, fields the SPA reads) */
export interface UserPage {
  id: string;
  username: string;
  displayName: string;
  points: number;
  performancePoints: number;
  problemCount: number;
  rating: number | null;
  /** Among listed, active users by performance points. */
  rank: number;
  ratingRank: number | null;
  displayRank: string;
  aboutHtml: string;
  contributionPoints: number;
  ratingSummary: RatingSummary | null;
  organizations: OrganizationSummary[];
  dateJoined: string;
  /** Only for viewers who hold `judge.ban_user`; null for everyone else. */
  staff: UserPageStaff | null;
}

/** backend: user-page.response.ts (UserPageStaffResponse) */
export interface UserPageStaff {
  isSuperuser: boolean;
  banReason: string | null;
}

/** backend: users/leaderboards/dto/leaderboard.dto.ts USER_SORTS */
export const LEADERBOARD_SORTS = ['rating', 'performancePoints', 'points', 'problemCount'] as const;
export type LeaderboardSort = (typeof LEADERBOARD_SORTS)[number];
/** The leaderboard tabs: the four `/users` sorts and `/contributors`. */
export const BOARD_SORTS = [...LEADERBOARD_SORTS, 'contributors'] as const;
export type BoardSort = (typeof BOARD_SORTS)[number];
/** backend: libs/database LEADERBOARD_FIELDS (the `sort` of `/users/:username/rank`). */
export type RankField = LeaderboardSort | 'contributionPoints';
/** backend: leaderboard.response.ts (RankResponse); `page` counts pages of `pageSize` (100). */
export interface RankResponse {
  rank: number;
  page: number;
  pageSize: number;
}
/** backend: users/pages/dto/user-page.response.ts (RatingSummaryResponse) */
export interface RatingSummary {
  min: number;
  max: number;
  contests: number;
}

/** backend: user-page.response.ts (RatingHistoryEntryResponse) */
export interface RatingHistoryEntry {
  contestKey: string | null;
  contestName: string | null;
  endTime: string;
  rating: number | null;
  rank: number | null;
  performance: number | null;
}

/** backend: users/leaderboards/dto/leaderboard.response.ts (LeaderboardEntryResponse, fields the SPA reads) */
export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  displayRank: string;
  points: number;
  performancePoints: number;
  problemCount: number;
  rating: number | null;
  contributionPoints: number;
  /** The user's first listed organization. */
  organization: OrganizationSummary | null;
}

/** backend: users/leaderboards/dto/leaderboard.dto.ts */
export interface LeaderboardQuery {
  sort?: LeaderboardSort;
  page?: number;
  pageSize?: number;
}

/** backend: user-page.response.ts (SolvedProblemResponse): `points` earned of `total`. */
export interface SolvedProblem {
  code: string;
  name: string;
  points: number;
  total: number;
}
export interface SolvedGroup {
  name: string;
  points: number;
  problems: SolvedProblem[];
}
export interface SolvedResponse {
  groups: SolvedGroup[];
}
/** backend: user-page.response.ts (PpSubmissionResponse) */
export interface PpSubmission {
  id: string;
  date: string;
  casePoints: number;
  caseTotal: number;
  result: string | null;
  language: string;
}
/** backend: user-page.response.ts (PpEntryResponse) */
export interface PpEntry {
  rank: number;
  /** Percent of the points counted, 100 for the best problem. */
  weight: number;
  points: number;
  scaledPoints: number;
  problem: { code: string; name: string };
  submission: PpSubmission;
}
/** backend: user-page.response.ts (ActivityResponse) */
export interface ActivityResponse {
  timezone: string;
  since: string;
  /** `YYYY-MM-DD` in `timezone` → submissions that day. */
  days: Record<string, number>;
}
