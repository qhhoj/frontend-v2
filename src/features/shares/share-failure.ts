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
  'busy',
] as const;

/** The three rules that refuse to show or make a copy of a submission. */
export type CopyRefusal = 'contest_running' | 'problem_hidden' | 'source_hidden';

export type ShareFailure =
  { kind: 'blocked'; reason: CopyRefusal } | { kind: 'other'; key: string };

/** The backend sends `hidden` for two rules and tells them apart only in its message (backend `copyRefusalError`). */
const PROBLEM_HIDDEN_MESSAGE = /public problems/i;

/** What a failed create or read means to the person: a refusal gets its own state, the rest a message key. */
export function shareFailureOf(error: unknown): ShareFailure {
  if (error instanceof ApiError) {
    if (error.code === 'contest_running') return { kind: 'blocked', reason: 'contest_running' };
    if (error.code === 'hidden')
      return {
        kind: 'blocked',
        reason: PROBLEM_HIDDEN_MESSAGE.test(error.message) ? 'problem_hidden' : 'source_hidden',
      };
    const issue = NAMED_ISSUES.find((code) => error.issues.some((entry) => entry.code === code));
    if (issue) return { kind: 'other', key: `share.error.${issue}` };
  }
  return { kind: 'other', key: errorMessageKey(error) };
}
