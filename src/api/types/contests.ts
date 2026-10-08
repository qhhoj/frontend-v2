/** backend: libs/contests/src/contest-time.ts */
export type ContestPhase = 'upcoming' | 'running' | 'ended';
/** backend: libs/database contest.schema.ts CONTEST_FORMAT_NAMES */
export type ContestFormatName =
  'default' | 'ioi' | 'ioi16' | 'icpc' | 'vnoj' | 'ultimate' | 'final_submission';
/** backend: contest.schema.ts SCOREBOARD_VISIBILITIES: Visible, Hidden, hidden during the Contest, hidden during the Participation. */
export type ScoreboardVisibility = 'V' | 'H' | 'C' | 'P';
export type LabelStyle = 'numeric' | 'alpha';

/** backend: libs/contests LIVE_STATUSES; the viewer's own live participation in the contest. */
export type LiveStatus = 'registered' | 'participating' | 'finished';

/** backend: contest-list.response.ts ContestSummaryResponse (fields of every contest view). */
export interface ContestSummary {
  key: string;
  name: string;
  summary: string;
  startTime: string;
  endTime: string;
  /** Seconds per participation. */
  timeLimit: number | null;
  phase: ContestPhase;
  formatName: ContestFormatName;
  isRated: boolean;
  tags: string[];
  userCount: number;
  virtualCount: number;
  isPrivate: boolean;
  isOrganizationPrivate: boolean;
  /** Registering and joining (live or virtual) ask for the access code; editors skip it. */
  requiresAccessCode: boolean;
  /** The public ranking links ask for a ranking access code. */
  requiresRankingAccessCode: boolean;
  disallowVirtual: boolean;
  /** Both null: the contest takes no registration. */
  registrationStart: string | null;
  registrationEnd: string | null;
}

/** backend: contest-list.response.ts ContestListViewerResponse: the signed-in viewer's own state in one contest. */
export interface ContestListViewer {
  /** Their live participation; null when they have none. */
  liveStatus: LiveStatus | null;
  /** Their current contest is this one, and that participation has not ended. */
  isCurrent: boolean;
}

/** backend: contest-list.response.ts ContestListItemResponse */
export interface ContestListItem extends ContestSummary {
  /** Null for a signed-out visitor. */
  viewer: ContestListViewer | null;
}

/** backend: contest-detail.response.ts ContestProblemViewerResultResponse */
export interface ProblemViewerResult {
  /** The format's cell; null before a scored submission. */
  cell: ProblemCell | null;
  /** The cell is worth the problem's full points. */
  isSolved: boolean;
  /** Submissions counted against `maxSubmissions`. */
  attempts: number;
  /** A submission waits for a verdict. */
  hasPendingSubmission: boolean;
}

/** backend: contest-detail.response.ts ContestProblemResponse */
export interface ContestProblem {
  problemId: string;
  code: string;
  name: string;
  label: string;
  points: number;
  partial: boolean;
  isPretested: boolean;
  /** Null: no cap. */
  maxSubmissions: number | null;
  /** Live participants whose cell is worth the full points; null unless the viewer may see the full ranking. Up to 30 s old. */
  solverCount: number | null;
  /** Null when signed out, without a scoring participation, or when the board is hidden from the viewer. */
  viewerResult: ProblemViewerResult | null;
}

/** backend: contest-detail.response.ts ParticipationSummaryResponse */
export interface ParticipationSummary {
  id: string;
  /** 0 live, -1 spectate, n ≥ 1 the n-th virtual run. */
  virtual: number;
  isRegistered: boolean;
  isDisqualified: boolean;
  realStart: string;
  endTime: string;
}

/** backend: contest-detail.response.ts ContestViewerResponse; non-null for a visitor too (then all false and null). */
export interface ContestViewer extends ContestListViewer {
  canEdit: boolean;
  isEditor: boolean;
  isTester: boolean;
  /** This contest is the viewer's current one. */
  inContest: boolean;
  liveParticipation: ParticipationSummary | null;
}

/** backend: contest-detail.response.ts ContestDetailResponse (settings are editor-only and unused here). */
export interface ContestDetail extends ContestSummary {
  description: string;
  /** Sanitized by the backend; render only through UserContent. */
  descriptionHtml: string;
  authors: Array<{ id: string; username: string }>;
  frozenLastMinutes: number;
  scoreboardVisibility: ScoreboardVisibility;
  showSubmissionList: boolean;
  pointsPrecision: number;
  runPretestsOnly: boolean;
  hideProblemTags: boolean;
  hideProblemAuthors: boolean;
  showShortDisplay: boolean;
  labelStyle: LabelStyle;
  /** The stored config: keys the contest never set are missing (the format's default applies). */
  formatConfig: Record<string, number | boolean>;
  /** Null until the viewer may see them. */
  problems: ContestProblem[] | null;
  viewer: ContestViewer;
}

/** backend: participation.response.ts CurrentParticipationResponse */
export interface CurrentParticipation {
  contest: { key: string; name: string; startTime: string; endTime: string };
  participation: ParticipationSummary;
}

/** backend: announcements/dto/announcement.response.ts */
export interface Announcement {
  /** UUID v7: later announcements sort after earlier ones as strings. */
  id: string;
  title: string;
  description: string;
  descriptionHtml: string;
  createdAt: string;
}

/** backend: stats/dto/contest-stats.response.ts */
export interface ContestProblemResults {
  AC: number;
  WA: number;
  CE: number;
  TLE: number;
  /** MLE, OLE, IR, RTE, AB and IE together. */
  ERR: number;
  RJ: number;
}
export interface ContestProblemStats {
  problemId: string;
  code: string;
  name: string;
  label: string;
  results: ContestProblemResults;
  /** Every submission, pending ones included. */
  total: number;
  /** Percent of `total`. */
  acRate: number;
}
export interface ContestLanguageStats {
  languageId: string;
  name: string;
  count: number;
  /** Percent of `count`. */
  acRate: number;
}
export interface ContestStats {
  problems: ContestProblemStats[];
  /** Most used first. */
  languages: ContestLanguageStats[];
}

/** backend: contests/core/dto/contest-list.dto.ts (the filters the SPA uses). */
export interface ContestListQuery {
  phase?: ContestPhase;
  rated?: boolean;
  search?: string;
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
