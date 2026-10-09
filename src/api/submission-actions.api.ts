import { apiSend } from './typed';
import type { RejudgeBody } from './types/submission-actions';

/** `dryRun: true` only counts and answers `allowed`; otherwise the answer is how many were queued (403 when over the limit without the lot permission). */
export const rejudgeSubmissions = (body: RejudgeBody) =>
  apiSend('post', '/submissions/rejudge', { body });

export const abortSubmission = (id: string) =>
  apiSend('post', '/submissions/{id}/abort', { path: { id } });
export const rejudgeSubmission = (id: string) =>
  apiSend('post', '/submissions/{id}/rejudge', { path: { id } });
export const rejectSubmission = (id: string) =>
  apiSend('post', '/submissions/{id}/reject', { path: { id } });
