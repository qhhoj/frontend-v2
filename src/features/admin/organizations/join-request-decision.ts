import type { QueryClient } from '@tanstack/vue-query';
import { ApiError } from '@/api/client';
import { translate } from '@/i18n';
import { failureTextOf } from '../ui/admin-errors';
import { allJoinRequestsKey } from './join-requests.queries';

const CONFLICT_STATUS = 409;
/** backend: organization-requests.service.ts `DECIDED_MESSAGE`; the only other 409 of a decision is a full organization. */
const DECIDED_MESSAGE = 'This request has already been decided';

/** A decision moves one request out of the pending queue and may add a member, so both the cross-organization queue and that organization's own lists go stale. */
export const invalidateAfterDecision = (queryClient: QueryClient, slug: string) =>
  Promise.all(
    [
      allJoinRequestsKey,
      ['organizations', 'requests', slug],
      ['organizations', 'members', slug],
      ['organizations', 'detail', slug],
      ['organizations', 'list'],
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );

/** Another staff member got to the request first: the lists are stale and the decision cannot be retried. */
export const isAlreadyDecided = (error: unknown): boolean =>
  error instanceof ApiError &&
  error.status === CONFLICT_STATUS &&
  error.message === DECIDED_MESSAGE;

/** A 409 is either an already decided request or a full organization; every other refusal reads as the shared admin text. */
export function decisionFailureText(error: unknown): string {
  if (isAlreadyDecided(error)) return translate('admin.organizations.queue.alreadyDecided');
  if (error instanceof ApiError && error.status === CONFLICT_STATUS)
    return translate('admin.organizations.queue.full');
  return failureTextOf(error);
}
