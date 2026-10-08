import { ApiError } from '@/api/client';
import { errorMessageKey } from '@/i18n/error-message';

export type MembershipAction = 'join' | 'leave' | 'request' | 'approve' | 'reject';

export interface MembershipErrorCopy {
  title: string;
  body: string;
}

/** Every membership refusal is a 409 `conflict` (E18); the action that failed tells which board card it is. */
const CONFLICT_COPY: Partial<Record<MembershipAction, MembershipErrorCopy>> = {
  join: { title: 'orgMembership.joinFailedTitle', body: 'orgMembership.joinFailedBody' },
  approve: { title: 'orgMembership.fullTitle', body: 'orgMembership.fullBody' },
  reject: { title: 'orgMembership.decidedTitle', body: 'orgMembership.decidedBody' },
};

/** Translation keys for the card that explains a failed membership action. */
export function membershipErrorCopy(action: MembershipAction, error: unknown): MembershipErrorCopy {
  const isConflict = error instanceof ApiError && error.code === 'conflict';
  const known = isConflict ? CONFLICT_COPY[action] : undefined;
  return known ?? { title: 'orgMembership.failedTitle', body: errorMessageKey(error) };
}
