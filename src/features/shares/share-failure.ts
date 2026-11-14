import { ApiError } from '@/api/client';
import { errorMessageKey } from '@/i18n/error-message';

/** Refusals of a create that the dialog names itself (`share.error.<issue>`); the backend sends them as the first issue. */
const NAMED_ISSUES = [
  'share_limit',
  'submission_not_shareable',
  'source_too_large',
  'source_empty',
  'source_invalid',
  'language_unknown',
  'language_takes_file',
  'muted',
] as const;

export type ShareFailure =
  /** A contest lists the problem and is not over: the backend does not say which. */
  | { kind: 'contest' }
  /** The setter now shows sources to owners and testers only. */
  | { kind: 'hidden' }
  | { kind: 'other'; key: string };

/** What a failed create or read means to the person: the two blocks get their own state, the rest a message key. */
export function shareFailureOf(error: unknown): ShareFailure {
  if (error instanceof ApiError) {
    if (error.code === 'contest_running') return { kind: 'contest' };
    if (error.code === 'hidden') return { kind: 'hidden' };
    const issue = NAMED_ISSUES.find((code) => error.issues.some((entry) => entry.code === code));
    if (issue) return { kind: 'other', key: `share.error.${issue}` };
  }
  return { kind: 'other', key: errorMessageKey(error) };
}
