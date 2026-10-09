import type { Schemas } from '../schemas';
import type { JsonBodyOf, QueryOf, StreamData } from '../typed';

export type SubmissionStatus = Schemas['SubmissionStatus'];
export type SubmissionResult = Schemas['SubmissionResult'];
/** Statuses of a row that is still being judged. `PD` (final-only contest) emits no events, so it is not here. */
export const IN_PROGRESS_STATUSES: readonly SubmissionStatus[] = ['QU', 'P', 'G'];
/** Statuses after which a submission never changes again on its own. */
export const FINISHED_STATUSES: readonly SubmissionStatus[] = ['D', 'IE', 'CE', 'AB'];

export type SubmissionListItem = Schemas['SubmissionListItemResponse'];
export type SubmissionDetail = Schemas['SubmissionDetailResponse'];
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

/** The result values the list filter accepts; anything else is a 400. */
export const SUBMISSION_RESULT_CODES = [
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
] as const satisfies readonly Schemas['SubmissionResult'][];
