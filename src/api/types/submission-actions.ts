import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';

export type RejudgeBody = JsonBodyOf<'/submissions/rejudge', 'post'>;
export type RescoreBody = JsonBodyOf<'/submissions/rescore', 'post'>;

/** `allowed`: within the limit of 10 or the caller holds `judge.rejudge_submission_lot`; `sample`: the newest matches of a dry run. */
export type RejudgeResult = Schemas['BulkRejudgeResponse'];
export type RescoreResult = Schemas['BulkRescoreResponse'];
/** One logged bulk rejudge or rescore. */
export type SubmissionBatchLog = Schemas['SubmissionBatchLogResponse'];
