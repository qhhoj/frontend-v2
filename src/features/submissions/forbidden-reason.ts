import { ApiError } from '@/api/client';

/** backend B18: why a viewer may not see a submission (403 codes). */
const REASON_CODES: ReadonlySet<string> = new Set(['solve_first', 'contest_running', 'hidden']);

const isForbidden = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.status === 403;

/** The message key of a B18 reason, or null for any other error. The 403 carries no problem code, so there is nothing to link to. */
export const forbiddenReasonKey = (error: unknown): string | null =>
  isForbidden(error) && REASON_CODES.has(error.code) ? `submission.forbidden.${error.code}` : null;

/** Any 403 as a message key: its B18 reason, else the generic one. Null for errors that are not a 403. */
export const forbiddenMessageKey = (error: unknown): string | null =>
  isForbidden(error) ? (forbiddenReasonKey(error) ?? 'errors.forbidden') : null;
