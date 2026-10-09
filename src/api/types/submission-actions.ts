import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';

export type RejudgeBody = JsonBodyOf<'/submissions/rejudge', 'post'>;

/** `allowed`: within the limit of 10 or the caller holds `judge.rejudge_submission_lot`. */
export type RejudgeResult = Schemas['BulkRejudgeResponse'];
