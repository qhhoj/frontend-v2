/** backend: libs/database/src/schemas/submission.schema.ts SUBMISSION_STATUSES */
export type SubmissionStatus = 'QU' | 'P' | 'G' | 'D' | 'IE' | 'CE' | 'AB' | 'PD';
/** backend: submission.schema.ts SUBMISSION_RESULTS */
export type SubmissionResult =
  'AC' | 'WA' | 'TLE' | 'MLE' | 'OLE' | 'IR' | 'RTE' | 'CE' | 'IE' | 'SC' | 'AB' | 'RJ';
/** Statuses after which a submission never changes again on its own. */
export const FINISHED_STATUSES: readonly SubmissionStatus[] = ['D', 'IE', 'CE', 'AB'];

/** backend: apps/api/src/modules/submissions/core/dto/submission-list.response.ts */
export interface SubmissionListItem {
  id: string;
  user: { id: string; username: string } | null;
  problem: { code: string; name: string } | null;
  language: { id: string; key: string; name: string } | null;
  date: string;
  status: SubmissionStatus;
  result: SubmissionResult | null;
  points: number | null;
  casePoints: number;
  caseTotal: number;
  /** Seconds, largest case. */
  time: number | null;
  /** KiB, largest case. */
  memory: number | null;
}

/** backend: submissions/core/dto/submission-detail.response.ts (fields the SPA reads in 8a) */
export interface SubmissionDetail extends SubmissionListItem {
  error: string | null;
  currentTestcase: number;
}

/** backend: submissions/core/dto/submission-list.dto.ts */
export interface SubmissionListQuery {
  user?: string;
  problem?: string;
  page?: number;
  pageSize?: number;
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
