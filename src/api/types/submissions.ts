import type { Schemas } from '../schemas';
import type { JsonBodyOf, QueryOf, StreamData } from '../typed';

export type SubmissionStatus = Schemas['SubmissionStatus'];
export type SubmissionResult = Schemas['SubmissionResult'];
/**
 * The phase of every status, so a status the backend adds is a type error until it is placed: `judging` is still being
 * judged; `waiting` (`PD`, a final-only contest) waits for the final judging and emits no events; `finished` never
 * changes again on its own.
 */
const STATUS_PHASE: Record<SubmissionStatus, 'judging' | 'waiting' | 'finished'> = {
  QU: 'judging',
  P: 'judging',
  G: 'judging',
  PD: 'waiting',
  D: 'finished',
  IE: 'finished',
  CE: 'finished',
  AB: 'finished',
};
type StatusPhase = (typeof STATUS_PHASE)[SubmissionStatus];
const statusesWhere = (test: (phase: StatusPhase) => boolean): readonly SubmissionStatus[] =>
  (Object.keys(STATUS_PHASE) as SubmissionStatus[]).filter((status) => test(STATUS_PHASE[status]));
export const IN_PROGRESS_STATUSES = statusesWhere((phase) => phase === 'judging');
export const FINISHED_STATUSES = statusesWhere((phase) => phase === 'finished');
/** Being judged or waiting for the final judging: rejudge and reject answer 409 until it is over. */
export const UNFINISHED_STATUSES = statusesWhere((phase) => phase !== 'finished');

export type SubmissionListItem = Schemas['SubmissionListItemResponse'];
export type SubmissionDetail = Schemas['SubmissionDetailResponse'];
/** Whether the source endpoint answers this viewer: `granted`, else why not. */
export type SourceAccess = SubmissionDetail['sourceAccess'];
/** The action flags for the signed-in viewer. */
export type SubmissionViewer = Schemas['SubmissionViewerResponse'];

/** Contest lists repeat `status` with QU/P/G (being judged) and PD (waiting for the final judging). */
export type SubmissionListQuery = QueryOf<'/submissions'>;

export type SubmitBody = JsonBodyOf<'/problems/{code}/submit', 'post'>;
export type SubmitResponse = Schemas['SubmitResponse'];

/** The first event of a submission stream. */
export type SubmissionStateEvent = StreamData<'/events/submissions/{id}', 'state'>;
/** The event name of a progress frame equals its `type`. */
export type SubmissionProgressEvent = StreamData<'/events/submissions/{id}', 'queued'>;
/** The public feed has no `test-case` frames, no result, language or problem code. */
export type SubmissionFeedEvent = StreamData<'/events/submissions', 'queued'>;

export type SubmissionCase = Schemas['SubmissionCaseResponse'];
export type CaseStatus = SubmissionCase['status'];
export type SubmissionBatch = Schemas['SubmissionBatchResponse'];
export type SubmissionSource = Schemas['SubmissionSourceResponse'];
export type SubmissionStats = Schemas['SubmissionStatsResponse'];

/** Every result in display order, so a result the backend adds is a type error until it is listed. */
const LISTED_RESULTS: Record<SubmissionResult, true> = {
  AC: true,
  WA: true,
  TLE: true,
  MLE: true,
  OLE: true,
  IR: true,
  RTE: true,
  CE: true,
  IE: true,
  SC: true,
  AB: true,
  RJ: true,
};
/** The result values the list filter accepts; anything else is a 400. */
export const SUBMISSION_RESULT_CODES = Object.keys(LISTED_RESULTS) as readonly SubmissionResult[];
