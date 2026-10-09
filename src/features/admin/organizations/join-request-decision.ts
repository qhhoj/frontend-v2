import type { QueryClient } from '@tanstack/vue-query';
import { ApiError } from '@/api/client';
import { translate } from '@/i18n';
import { failureTextOf } from '../ui/admin-errors';
import { allJoinRequestsKey } from './join-requests.queries';

const FULL_STATUS = 409;

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

/** Accepting into a full organization is a 409; every other refusal reads as the shared admin text. */
export const decisionFailureText = (error: unknown): string =>
  error instanceof ApiError && error.status === FULL_STATUS
    ? translate('admin.organizations.queue.full')
    : failureTextOf(error);
