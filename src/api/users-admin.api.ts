import { apiGet, apiGetPage, apiSend } from './typed';
import type {
  CreateUsersBody,
  RoleBody,
  RoleChange,
  SetUserPasswordBody,
  StaffUserQuery,
  UserAccessChange,
  UserEditBody,
} from './types/users-admin';

export const STAFF_USERS_PAGE_SIZE = 50;

/** backend `UserAdminController` (`judge.ban_user`): `search` is a username prefix, `banned` true/false/unset; `page` above 500 is a 400. */
export const fetchStaffUsers = (query: StaffUserQuery) =>
  apiGetPage('/admin/users', { query: { ...query, pageSize: STAFF_USERS_PAGE_SIZE } });
/** backend `UserModerationController` (`judge.ban_user`): restores rank `user`, lists and activates the account. */
export const unbanUser = (username: string) =>
  apiSend('post', '/users/{username}/unban', { path: { username } });
/** backend `UserEditingController` (`judge.change_profile`): the fields staff edit; a superuser target is 403 unless the viewer is one. */
export const fetchUserForEdit = (username: string) =>
  apiGet('/admin/users/{username}/profile', { path: { username } });
/** Absent fields stay unchanged; the e-mail also needs `auth.change_user`; `organizations` replaces the whole list. */
export const updateUserByStaff = (username: string, body: UserEditBody) =>
  apiSend('patch', '/admin/users/{username}/profile', { path: { username }, body });
/** `auth.change_user`: `currentPassword` is the admin's own; the user's sessions and API token are revoked. */
export const setUserPassword = (username: string, body: SetUserPasswordBody) =>
  apiSend('post', '/admin/users/{username}/password', { path: { username }, body });
/** `auth.change_user`: mails the user the public reset link. */
export const sendUserResetLink = (username: string) =>
  apiSend('post', '/admin/users/{username}/password-reset', { path: { username } });
/** `auth.change_user`: a new login name; the old one keeps opening the profile. */
export const renameUser = (username: string, newName: string) =>
  apiSend('post', '/admin/users/{username}/rename', {
    path: { username },
    body: { username: newName },
  });
/** backend `UserModerationController` (`judge.ban_user`): removes TOTP and security keys and signs the user out. */
export const resetUserTwoFactor = (username: string) =>
  apiSend('post', '/users/{username}/reset-two-factor', { path: { username } });
/** `auth.add_user`: up to `USER_CREATE_BATCH` rows; each row is created or refused on its own. */
export const createUsers = (body: CreateUsersBody) => apiSend('post', '/admin/users', { body });
export const USER_CREATE_BATCH = 100;
/** backend `AccessController` (`judge.change_profile`): every permission the site checks, with a category. */
export const fetchPermissionCatalog = () => apiGet('/admin/permissions');
/** Roles (legacy groups) by name with their permissions and member counts. */
export const fetchRoles = () => apiGet('/admin/groups');
/** Superuser only: a new role. */
export const createRole = (body: RoleBody) => apiSend('post', '/admin/groups', { body });
/** Superuser only: rename a role, add and remove permissions. */
export const updateRole = (id: string, body: RoleChange) =>
  apiSend('patch', '/admin/groups/{id}', { path: { id }, body });
/** A user's flags, roles, direct and effective permissions; `canEdit` is false unless the viewer is a superuser and not the user. */
export const fetchUserAccess = (username: string) =>
  apiGet('/admin/users/{username}/access', { path: { username } });
/** Superuser only: adds and removes roles and direct permissions, sets the flags; applies on the user's next request. */
export const changeUserAccess = (username: string, body: UserAccessChange) =>
  apiSend('patch', '/admin/users/{username}/access', { path: { username }, body });
