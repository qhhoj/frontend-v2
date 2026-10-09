import type { Schemas } from '../schemas';
/** backend: libs/database/src/schemas/submission.schema.ts SUBMISSION_STATUSES */
export type SubmissionStatus = 'QU' | 'P' | 'G' | 'D' | 'IE' | 'CE' | 'AB' | 'PD';
/** backend: submission.schema.ts SUBMISSION_RESULTS */
export type SubmissionResult =
  'AC' | 'WA' | 'TLE' | 'MLE' | 'OLE' | 'IR' | 'RTE' | 'CE' | 'IE' | 'SC' | 'AB' | 'RJ';
/** Statuses of a row that is still being judged. `PD` (final-only contest) emits no events, so it is not here. */
export const IN_PROGRESS_STATUSES: readonly SubmissionStatus[] = ['QU', 'P', 'G'];
/** Statuses after which a submission never changes again on its own. */
export const FINISHED_STATUSES: readonly SubmissionStatus[] = ['D', 'IE', 'CE', 'AB'];

/** backend: apps/api/src/modules/submissions/core/dto/submission-list.response.ts */
export type SubmissionListItem = Schemas['SubmissionListItemResponse'];

/** backend: submissions/core/dto/submission-detail.response.ts (fields the SPA reads in 8a) */
export interface SubmissionDetail extends SubmissionListItem {
  error: string | null;
  currentTestcase: number;
  isPretested: boolean;
  judgedOn: string | null;
  judgedDate: string | null;
  rejudgedDate: string | null;
  cases: SubmissionCase[] | null;
  batches: SubmissionBatch[] | null;
  /** B21: the problem's test count, null when the viewer may not see case results. */
  totalCases: number | null;
  /** backend: SubmissionViewerResponse. Each flag already holds the permission, edit-rights, lock and status rule of its action. */
  viewer: SubmissionViewer;
  /** Editors only: rejudging is refused after this instant; null for everyone else and when the submission never locks. */
  lockedAfter: string | null;
}

/** backend: SubmissionViewerResponse (the action flags for the signed-in viewer). */
export interface SubmissionViewer {
  canAbort: boolean;
  canRejudge: boolean;
  canReject: boolean;
}

/** backend: submissions/core/dto/submission-list.dto.ts */
export interface SubmissionListQuery {
  user?: string;
  problem?: string;
  page?: number;
  pageSize?: number;
  language?: string[];
  result?: SubmissionResult[];
  /** Repeat the parameter; contest lists use QU/P/G (being judged) and PD (waiting for the final judging). */
  status?: SubmissionStatus[];
}

/** backend: submissions/create/dto/submit.dto.ts and submit.response.ts */
export interface SubmitBody {
  language: string;
  source: string;
}
export interface SubmitResponse {
  id: string;
}

/** backend: submissions/streams/submission-streams.service.ts `stateOf`; the first event of a stream. */
export interface SubmissionStateEvent {
  submissionId: string;
  status: SubmissionStatus;
  result: SubmissionResult | null;
  points: number | null;
  casePoints: number;
  caseTotal: number;
  currentTestcase: number | null;
}

/** backend: libs/judging/src/submission-events.ts SubmissionEvent; event names = `type`. */
export interface SubmissionProgressEvent {
  submissionId: string;
  type: 'queued' | 'processing' | 'grading-begin' | 'test-case' | 'done';
  status: SubmissionStatus;
  /** 0 except on `test-case`. */
  currentTestcase: number;
}

/** backend: libs/database CASE_STATUSES, a subset of the results. */
export type CaseStatus = Extract<
  SubmissionResult,
  'AC' | 'WA' | 'TLE' | 'MLE' | 'OLE' | 'IR' | 'RTE' | 'SC'
>;
/** backend: submissions/core/dto/submission-detail.response.ts SubmissionCaseResponse (`feedback`, `extendedFeedback`, `output` only when the problem allows them) */
export interface SubmissionCase {
  position: number;
  status: CaseStatus;
  /** Seconds. */ time: number;
  /** KiB. */ memory: number;
  points: number;
  total: number;
  batch: number | null;
  feedback?: string;
  extendedFeedback?: string;
  output?: string;
}
/** backend: SubmissionBatchResponse */
export interface SubmissionBatch {
  batch: number;
  status: CaseStatus;
  points: number;
  total: number;
}
/** backend: SubmissionSourceResponse */
export interface SubmissionSource {
  id: string;
  source: string;
}
/** backend: submissions/core/dto/submission-stats.response.ts (B24) */
export interface SubmissionStats {
  judgedToday: number;
  acceptedToday: number;
  queueLength: number;
  judgesOnline: number;
  judgesTotal: number;
}
/** backend: streams/submission-streams.service.ts `deliverToFeed`; the public feed has no `test-case` frames, no result, language or problem code. */
export interface SubmissionFeedEvent {
  submissionId: string;
  userId: string;
  problemId: string;
  type: 'queued' | 'processing' | 'grading-begin' | 'done';
  status: SubmissionStatus;
}
/** The result values the list filter accepts (backend `SUBMISSION_RESULTS`); anything else is a 400. */
export const SUBMISSION_RESULT_CODES: readonly SubmissionResult[] = [
  'AC',
  'WA',
  'TLE',
  'MLE',
  'OLE',
  'IR',
  'RTE',
  'CE',
  'IE',
  'SC',
  'AB',
  'RJ',
];
