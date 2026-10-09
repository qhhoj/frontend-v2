import { apiPage, apiRequest } from './client';
import type { StaffUser, StaffUserQuery } from './types/users-admin';

export const STAFF_USERS_PAGE_SIZE = 50;

/** backend `UserAdminController` (`judge.ban_user`): `search` is a username prefix, `banned` true/false/unset; `page` above 500 is a 400. */
export const fetchStaffUsers = (query: StaffUserQuery) =>
  apiPage<StaffUser>('/admin/users', { query: { ...query, pageSize: STAFF_USERS_PAGE_SIZE } });
/** backend `UserModerationController` (`judge.ban_user`): restores rank `user`, lists and activates the account. */
export const unbanUser = (username: string) =>
  apiRequest<void>(`/users/${encodeURIComponent(username)}/unban`, { method: 'POST' });
