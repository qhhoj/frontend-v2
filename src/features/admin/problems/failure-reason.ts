import { ApiError } from '@/api/client';
import { adminIssueText, failureTextOf, isKnownIssue } from '../ui/admin-errors';

/**
 * The line for a failed write. A refusal names what failed by `issues[].code` (file refusals, zip reader, taken codes): the first
 * issue the SPA has a text for shows it. Any other refusal gets the usual text, never the backend's English.
 */
export function failureReasonOf(error: unknown): string {
  if (error instanceof ApiError) {
    const known = error.issues.find(isKnownIssue);
    if (known) return adminIssueText(known);
  }
  return failureTextOf(error);
}
