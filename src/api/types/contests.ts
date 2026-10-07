/** backend: libs/contests/src/contest-time.ts */
export type ContestPhase = 'upcoming' | 'running' | 'ended';
/** backend: libs/database contest.schema.ts CONTEST_FORMAT_NAMES */
export type ContestFormatName =
  'default' | 'ioi' | 'ioi16' | 'icpc' | 'vnoj' | 'ultimate' | 'final_submission';

/** backend: apps/api/src/modules/contests/core/dto/contest-list.response.ts */
export interface ContestListItem {
  key: string;
  name: string;
  summary: string;
  startTime: string;
  endTime: string;
  /** Seconds. */
  timeLimit: number | null;
  phase: ContestPhase;
  formatName: ContestFormatName;
  isRated: boolean;
  tags: string[];
  userCount: number;
  virtualCount: number;
  isPrivate: boolean;
  isOrganizationPrivate: boolean;
}

/** backend: contests/core/dto/contest-detail.response.ts (ContestProblemResponse) */
export interface ContestProblem {
  problemId: string;
  code: string;
  name: string;
  label: string;
  points: number;
  partial: boolean;
}

/** backend: contest-detail.response.ts (ContestDetailResponse, fields the SPA reads in 8a) */
export interface ContestDetail extends ContestListItem {
  frozenLastMinutes: number;
  pointsPrecision: number;
  /** Null until the viewer may see them. */
  problems: ContestProblem[] | null;
}

/** backend: contests/core/dto/contest-list.dto.ts */
export interface ContestListQuery {
  phase?: ContestPhase;
  page?: number;
  pageSize?: number;
}

/**
 * backend: libs/contests/src/formats/format.ts ProblemCell; the keys depend on the contest's `formatName`.
 * - default, ioi, ioi16, ultimate, final_submission: `time`, `points`.
 * - icpc: `time` (s from start), `points`, `tries`, `pending` (boolean, frozen boards only).
 * - vnoj: `time` (s from start), `points`, `penalty` (wrong tries), `pending` (number of pending submissions).
 */
export type ProblemCell = Record<string, number | boolean | null>;

/** backend: contests/ranking/dto/ranking.response.ts */
export interface RankingProblem {
  problemId: string;
  code: string;
  label: string;
  points: number;
  /** Participation id credited with the first solve. */
  firstSolve: string | null;
  acceptedCount: number;
}

export interface RankingRow {
  /** Null on a board that shows only the viewer's row. */
  rank: number | null;
  participationId: string;
  user: { id: string; username: string };
  virtual: number;
  isDisqualified: boolean;
  score: number;
  /** icpc: minutes incl. penalty; vnoj and other formats: seconds. */
  cumtime: number;
  tiebreaker: number;
  /** Keyed by problem id. */
  cells: Record<string, ProblemCell>;
}

export interface Ranking {
  frozen: boolean;
  problems: RankingProblem[];
  rows: RankingRow[];
}
