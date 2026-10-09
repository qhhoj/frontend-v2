import { BAN_REASON_MAX_LENGTH } from '@/api/types/users';
import type { UserPage } from '@/api/types/users';
import { STAFF_USERS_PAGE_SIZE } from '@/api/users-admin.api';

export { BAN_REASON_MAX_LENGTH };
/** The backend refuses deeper pages (skipping is linear in the page number). */
export const STAFF_USERS_MAX_PAGE = 500;

export const lastStaffPage = (total: number, pageSize: number = STAFF_USERS_PAGE_SIZE) =>
  Math.min(STAFF_USERS_MAX_PAGE, Math.max(1, Math.ceil(total / pageSize)));

/**
 * Only a superuser may start an impersonation, and never of another superuser or of a banned account. Unknown staff facts
 * (`staff` null) refuse too: the superuser status of the target is then not known, and the backend refuses it anyway.
 */
export const canImpersonate = (viewerIsSuperuser: boolean, page: UserPage) =>
  viewerIsSuperuser &&
  page.staff !== null &&
  !page.staff.isSuperuser &&
  page.staff.banReason === null &&
  page.displayRank !== 'banned';

/** Why a ban reason cannot be sent, or null: the reason is required and at most `BAN_REASON_MAX_LENGTH` characters. */
export const banReasonProblem = (reason: string): 'required' | 'tooLong' | null => {
  const text = reason.trim();
  if (text === '') return 'required';
  return text.length > BAN_REASON_MAX_LENGTH ? 'tooLong' : null;
};
