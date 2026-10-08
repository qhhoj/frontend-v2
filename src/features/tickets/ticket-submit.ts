import { ApiError } from '@/api/client';
import { errorMessageKey } from '@/i18n/error-message';
import type { DraftIssue, TicketDraft } from './ticket-draft';

/** A refused submit either names a field (the problem code the server does not know) or fills the panel. */
export type SubmitFailure =
  { kind: 'field'; issue: DraftIssue } | { kind: 'panel'; titleKey: string; bodyKey: string };

const MUTED_ACCOUNT: SubmitFailure = {
  kind: 'panel',
  titleKey: 'tickets.new.mutedTitle',
  bodyKey: 'tickets.new.mutedBody',
};

/** 403 is a muted account; 404 on a problem ticket is the problem code; anything else shows the error's own message. */
export function submitFailureOf(error: unknown, kind: TicketDraft['kind']): SubmitFailure {
  if (error instanceof ApiError && error.status === 403) return MUTED_ACCOUNT;
  if (error instanceof ApiError && error.status === 404 && kind === 'problem')
    return { kind: 'field', issue: { field: 'problemCode', key: 'tickets.new.problemMissing' } };
  return { kind: 'panel', titleKey: 'tickets.new.failedTitle', bodyKey: errorMessageKey(error) };
}
