import type { Schemas } from '../schemas';
import type { QueryOf } from '../typed';

/** backend: apps/api/src/modules/users/pages/dto/user-page.response.ts (UserPageResponse) */
export type UserPage = Schemas['UserPageResponse'];

/** backend: apps/api/src/modules/users/moderation/dto/ban.dto.ts (BAN_REASON_MAX_LENGTH) */
export const BAN_REASON_MAX_LENGTH = 4096;

/** backend: user-page.response.ts (UserPageStaffResponse) */
export type UserPageStaff = Schemas['UserPageStaffResponse'];

export type LeaderboardSort = NonNullable<QueryOf<'/users'>['sort']>;
/** The board's columns: backend USER_SORTS (users/leaderboards/dto/leaderboard.dto.ts), the same list: every sort is a board column. */
export const LEADERBOARD_SORTS = [
  'rating',
  'performancePoints',
  'points',
  'problemCount',
  'contributionPoints',
] as const satisfies readonly LeaderboardSort[];
/** Rows per board page; the backend's default and maximum. The board query and its skeleton both read it. */
export const LEADERBOARD_PAGE_SIZE = 100;
/** backend: libs/database LEADERBOARD_FIELDS (the `sort` of `/users/:username/rank`). */
export type RankField = NonNullable<QueryOf<'/users/{username}/rank'>['sort']>;
/** backend: leaderboard.response.ts (RankResponse); `page` counts pages of `pageSize` (100). */
export type RankResponse = Schemas['RankResponse'];
/** backend: users/pages/dto/user-page.response.ts (RatingSummaryResponse) */
export type RatingSummary = Schemas['RatingSummaryResponse'];

/** backend: user-page.response.ts (RatingHistoryEntryResponse) */
export type RatingHistoryEntry = Schemas['RatingHistoryEntryResponse'];

/** backend: users/leaderboards/dto/leaderboard.response.ts (LeaderboardEntryResponse) */
export type LeaderboardEntry = Schemas['LeaderboardEntryResponse'];

/** backend: users/leaderboards/dto/leaderboard.dto.ts */
export type LeaderboardQuery = QueryOf<'/users'>;

/** backend: user-page.response.ts (SolvedProblemResponse): `points` earned of `total`. */
export type SolvedProblem = Schemas['SolvedProblemResponse'];
export type SolvedGroup = Schemas['SolvedGroupResponse'];
export type SolvedResponse = Schemas['SolvedResponse'];
/** backend: user-page.response.ts (PpSubmissionResponse) */
export type PpSubmission = Schemas['PpSubmissionResponse'];
/** backend: user-page.response.ts (PpEntryResponse) */
export type PpEntry = Schemas['PpEntryResponse'];
/** backend: user-page.response.ts (ActivityResponse) */
export type ActivityResponse = Schemas['ActivityResponse'];
