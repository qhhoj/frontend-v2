import { ApiError } from '@/api/client';
import { failureTextOf, fieldErrorsOf } from '../ui/admin-errors';

/**
 * The line for a failed write. A `validation_failed` names the field that failed: its reason is shown (the backend's own
 * message, or the SPA's text for an issue code), never only the generic line. Anything else gets the usual text.
 */
export function failureReasonOf(error: unknown): string {
  if (error instanceof ApiError && error.code === 'validation_failed') {
    const [reason] = Object.values(fieldErrorsOf(error));
    if (reason) return reason;
  }
  return failureTextOf(error);
}
