import { apiGetPage, apiSend } from './typed';
import type { StaffUserQuery } from './types/users-admin';

export const STAFF_USERS_PAGE_SIZE = 50;

/** backend `UserAdminController` (`judge.ban_user`): `search` is a username prefix, `banned` true/false/unset; `page` above 500 is a 400. */
export const fetchStaffUsers = (query: StaffUserQuery) =>
  apiGetPage('/admin/users', { query: { ...query, pageSize: STAFF_USERS_PAGE_SIZE } });
/** backend `UserModerationController` (`judge.ban_user`): restores rank `user`, lists and activates the account. */
export const unbanUser = (username: string) =>
  apiSend('post', '/users/{username}/unban', { path: { username } });
