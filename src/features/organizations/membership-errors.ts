import { ApiError } from '@/api/client';
import { hasIssueCode } from '@/features/admin/ui/admin-errors';
import { errorMessageKey } from '@/i18n/error-message';

export type MembershipAction = 'join' | 'leave' | 'request' | 'approve' | 'reject';

export interface MembershipErrorCopy {
  title: string;
  body: string;
}

/** Every membership refusal is a 409 `conflict` (E18), except the `busy` lock, which only asks to retry; the action that failed tells which board card it is. */
const CONFLICT_COPY: Partial<Record<MembershipAction, MembershipErrorCopy>> = {
  join: { title: 'orgMembership.joinFailedTitle', body: 'orgMembership.joinFailedBody' },
  approve: { title: 'orgMembership.fullTitle', body: 'orgMembership.fullBody' },
  reject: { title: 'orgMembership.decidedTitle', body: 'orgMembership.decidedBody' },
};

/** Official contest: the `/site` record can lag up to a minute, so the server's refusal gets the same words as the lock. */
const LOCKED_COPY: MembershipErrorCopy = {
  title: 'officialMode.lockedTitle',
  body: 'officialMode.lockedBody',
};

/** Translation keys for the card that explains a failed membership action. */
export function membershipErrorCopy(action: MembershipAction, error: unknown): MembershipErrorCopy {
  if (error instanceof ApiError && error.code === 'locked_in_official_contest') return LOCKED_COPY;
  if (hasIssueCode(error, 'busy')) {
    return { title: 'orgMembership.failedTitle', body: 'admin.ui.issues.busy' };
  }
  const isConflict = error instanceof ApiError && error.code === 'conflict';
  const known = isConflict ? CONFLICT_COPY[action] : undefined;
  return known ?? { title: 'orgMembership.failedTitle', body: errorMessageKey(error) };
}
