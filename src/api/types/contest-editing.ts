import type { UserSummary } from './problems';
import type { ContestFormatName, ContestPhase, LabelStyle, ScoreboardVisibility } from './contests';

// The editor reads these names from one place; the public contest types in `./contests` stay untouched.
export type { ContestFormatName, ContestPhase, LabelStyle, ScoreboardVisibility } from './contests';

/** backend: `UserSummaryResponse` (id and username). */
export type UserSummaryView = UserSummary;

/** backend: `ContestProblemResponse` as an editor reads it (the public board's fields minus the viewer's own results). */
export interface EditableContestProblem {
  problemId: string;
  code: string;
  name: string;
  label: string;
  points: number;
  partial: boolean;
  isPretested: boolean;
  maxSubmissions: number | null;
}

/** backend: `ContestProblemOutputPrefixResponse`; null is the judge default. */
export interface ContestOutputPrefix {
  problemId: string;
  outputPrefixOverride: number | null;
}

/**
 * backend: `ContestSettingsResponse` (editors only). The id lists are user, organization or judge ids; `users` names the users.
 * The access codes are hashed and never returned: `hasRankingAccessCode` says one is set.
 */
export interface ContestSettings {
  isVisible: boolean;
  isPrivate: boolean;
  isOrganizationPrivate: boolean;
  organizations: string[];
  privateContestants: string[];
  curators: string[];
  testers: string[];
  bannedUsers: string[];
  bannedJudges: string[];
  viewContestScoreboard: string[];
  lockedAfter: string | null;
  scoreboardCacheTimeout: number;
  rateAll: boolean;
  rateExclude: string[];
  ratingFloor: number | null;
  ratingCeiling: number | null;
  pushAnnouncements: boolean;
  hasRankingAccessCode: boolean;
  problemOutputPrefixes: ContestOutputPrefix[];
  users: UserSummaryView[];
}

export interface EditableContestViewer {
  canEdit: boolean;
  isEditor: boolean;
  isTester: boolean;
  inContest: boolean;
}

/** backend: `ContestDetailResponse` as the editor reads it. `settings` is null for a viewer who may not edit. */
export interface EditableContest {
  key: string;
  name: string;
  summary: string;
  description: string;
  tags: string[];
  startTime: string;
  endTime: string;
  timeLimit: number | null;
  phase: ContestPhase;
  formatName: ContestFormatName;
  formatConfig: Record<string, number | boolean>;
  isRated: boolean;
  userCount: number;
  isPrivate: boolean;
  isOrganizationPrivate: boolean;
  authors: UserSummaryView[];
  registrationStart: string | null;
  registrationEnd: string | null;
  frozenLastMinutes: number;
  scoreboardVisibility: ScoreboardVisibility;
  showSubmissionList: boolean;
  pointsPrecision: number;
  runPretestsOnly: boolean;
  hideProblemTags: boolean;
  hideProblemAuthors: boolean;
  showShortDisplay: boolean;
  labelStyle: LabelStyle;
  disallowVirtual: boolean;
  requiresAccessCode: boolean;
  requiresRankingAccessCode: boolean;
  problems: EditableContestProblem[] | null;
  viewer: EditableContestViewer;
  settings: ContestSettings | null;
}

/** backend: `ContestProblemDto`: one entry of the contest's ordered problem list. */
export interface ContestProblemBody {
  problem: string;
  points: number;
  partial?: boolean;
  isPretested?: boolean;
  outputPrefixOverride?: number | null;
  maxSubmissions?: number | null;
}

/** backend: `CreateContestDto` (the create body; every optional member may be left out). */
export interface ContestBody {
  key: string;
  name: string;
  description?: string;
  summary?: string;
  tags?: string[];
  authors?: string[];
  curators?: string[];
  testers?: string[];
  startTime: string;
  endTime: string;
  timeLimit?: number | null;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  frozenLastMinutes?: number;
  lockedAfter?: string | null;
  disallowVirtual?: boolean;
  isVisible?: boolean;
  isPrivate?: boolean;
  privateContestants?: string[];
  isOrganizationPrivate?: boolean;
  organizations?: string[];
  accessCode?: string;
  rankingAccessCode?: string;
  bannedUsers?: string[];
  bannedJudges?: string[];
  scoreboardVisibility?: ScoreboardVisibility;
  viewContestScoreboard?: string[];
  scoreboardCacheTimeout?: number;
  showSubmissionList?: boolean;
  pointsPrecision?: number;
  runPretestsOnly?: boolean;
  hideProblemTags?: boolean;
  hideProblemAuthors?: boolean;
  showShortDisplay?: boolean;
  pushAnnouncements?: boolean;
  labelStyle?: LabelStyle;
  isRated?: boolean;
  rateAll?: boolean;
  rateExclude?: string[];
  ratingFloor?: number | null;
  ratingCeiling?: number | null;
  formatName?: ContestFormatName;
  formatConfig?: Record<string, number | boolean>;
  problems?: ContestProblemBody[];
}

/** backend: `UpdateContestDto` (PATCH): only the members that changed are sent. */
export type ContestPatch = Partial<ContestBody>;

/** backend: `AnnouncementResponse`. */
export interface Announcement {
  id: string;
  title: string;
  description: string;
  descriptionHtml: string;
  createdAt: string;
}

export interface OfficialRankingRow {
  rank: number;
  username: string;
  fullName: string;
  scores: number[];
  totalScore: number;
}

/** backend: `OfficialRankingResponse`: the stored official table, or 404 when none is stored (read as null). */
export interface OfficialRanking {
  url: string | null;
  problems: string[];
  rows: OfficialRankingRow[];
}

/** backend: `RankingLinkResponse`. The token is the public part of the URL. */
export interface RankingLink {
  token: string;
  status: 'public' | 'private';
  expiryMode: 'U' | 'M' | 'D' | 'A';
  expiryAmount: number | null;
  expiresAt: string | null;
  regeneratedAt: string;
  isValid: boolean;
}

/** backend: `RankingLinkDto`: `expiryAmount` for M (minutes) and D (days), `expiresAt` for A (at a time). */
export interface RankingLinkPatch {
  status: 'public' | 'private';
  expiryMode: 'U' | 'M' | 'D' | 'A';
  expiryAmount?: number;
  expiresAt?: string;
}

/** backend: libs/contests `ContestActionState`: `queued` waits for the worker, `running` is being worked on now. */
export type ContestActionState = 'idle' | 'queued' | 'running';

/** backend: `ContestActionsResponse`. */
export interface ContestActions {
  rescore: ContestActionState;
  judgeFinal: ContestActionState;
  rate: ContestActionState;
}

/** backend: `ContestDataStatusResponse`: the submissions export (a zip) and when it may be prepared again. */
export interface ContestDataStatus {
  state: 'none' | 'preparing' | 'ready';
  preparedAt: string | null;
  readyAt: string | null;
  size: number | null;
  nextPrepareAt: string | null;
}

/** backend: `ParticipationSummaryResponse`: what a disqualify answers (no user, no score). */
export interface ParticipationSummary {
  id: string;
  /** 0 live, -1 spectate, n ≥ 1 virtual. */
  virtual: number;
  isRegistered: boolean;
  isDisqualified: boolean;
  realStart: string;
  endTime: string;
}

/** backend: `ParticipationResponse`: one row of the participations list. */
export interface Participation extends ParticipationSummary {
  user: { id: string; username: string };
  score: number;
  cumtime: number;
  tiebreaker: number;
  cells: Record<string, unknown>;
}
