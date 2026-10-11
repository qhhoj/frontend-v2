import { apiGet, apiSend } from './typed';
import type { RejudgeBody, RescoreBody } from './types/submission-actions';

/** `dryRun: true` only counts and answers `allowed` and a sample; otherwise the answer is how many were queued (403 when over the limit without the lot permission). */
export const rejudgeSubmissions = (body: RejudgeBody) =>
  apiSend('post', '/submissions/rejudge', { body });
/** Same filter as the bulk rejudge; queues problem (or contest) rescores. */
export const rescoreSubmissions = (body: RescoreBody) =>
  apiSend('post', '/submissions/rescore', { body });
/** The newest bulk rejudges and rescores (everyone's with `judge.edit_all_problem`, else the caller's). */
export const fetchRecentBatches = () => apiGet('/submissions/batches/recent');

export const abortSubmission = (id: string) =>
  apiSend('post', '/submissions/{id}/abort', { path: { id } });
export const rejudgeSubmission = (id: string) =>
  apiSend('post', '/submissions/{id}/rejudge', { path: { id } });
export const rejectSubmission = (id: string) =>
  apiSend('post', '/submissions/{id}/reject', { path: { id } });
export const lockSubmission = (id: string) =>
  apiSend('post', '/submissions/{id}/lock', { path: { id } });
export const unlockSubmission = (id: string) =>
  apiSend('delete', '/submissions/{id}/lock', { path: { id } });
