import type { QueryClient } from '@tanstack/vue-query';
import { translate } from '@/i18n';
import { failureTextOf, hasIssueCode } from '../ui/admin-errors';
import { allJoinRequestsKey } from './join-requests.queries';

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
  hasIssueCode(error, 'request_already_decided');

/** Only the two known 409 codes have their own text; every other refusal reads as the shared admin text. */
export function decisionFailureText(error: unknown): string {
  if (isAlreadyDecided(error)) return translate('admin.organizations.queue.alreadyDecided');
  if (hasIssueCode(error, 'organization_full')) return translate('admin.organizations.queue.full');
  return failureTextOf(error);
}
