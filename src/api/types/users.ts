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

/** backend: users/leaderboards/dto/leaderboard.response.ts */
export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  points: number;
  performancePoints: number;
  problemCount: number;
  rating: number | null;
  contributionPoints: number;
}

/** backend: users/leaderboards/dto/leaderboard.dto.ts */
export interface LeaderboardQuery {
  sort?: 'rating' | 'performancePoints' | 'points' | 'problemCount';
  page?: number;
  pageSize?: number;
}
