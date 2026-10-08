import { apiRequest } from './client';
import type { RejudgeBody, RejudgeResult } from './types/submission-actions';

/** R1: `dryRun: true` only counts and answers `allowed`; otherwise the answer is how many were queued (403 when over the limit without the lot permission). */
export const rejudgeSubmissions = (body: RejudgeBody) =>
  apiRequest<RejudgeResult>('/submissions/rejudge', { method: 'POST', body });
