import type { RecentComment } from './comments';
import type { OrganizationSummary } from './organizations';

/** backend: apps/api/src/modules/home/dto/home.response.ts (HomeCountsResponse) */
export interface HomeCounts {
  users: number;
  problems: number;
  submissions: number;
  /** Contests an anonymous visitor can see. */
  contests: number;
  languages: number;
}

/** backend: home.response.ts (HomeProblemResponse) */
export interface HomeProblem {
  code: string;
  name: string;
  points: number;
  date: string;
}
/** backend: home.response.ts (HomeUserResponse) */
export interface HomeUser {
  username: string;
  displayRank: string;
  rating: number | null;
  performancePoints: number;
  contributionPoints: number;
  /** The user's first listed organization, whoever views; null when none is listed. */
  organization: OrganizationSummary | null;
}
/** backend: home.response.ts (HomeResponse) */
export interface HomeResponse {
  recentComments: RecentComment[];
  newProblems: HomeProblem[];
  topPerformers: HomeUser[];
  topContributors: HomeUser[];
  counts: HomeCounts;
}
