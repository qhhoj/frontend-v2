import type { JsonBodyOf, QueryOf } from '../typed';
import type { Schemas } from '../schemas';

export type StaffUser = Schemas['StaffUserResponse'];

/** `banned` true is banned only, false is not banned only, unset is everyone; `sort` unset is the server's order. */
export type StaffUserQuery = Omit<QueryOf<'/admin/users'>, 'pageSize'>;

export type UserEdit = Schemas['UserEditResponse'];
export type UserEditBody = JsonBodyOf<'/admin/users/{username}/profile', 'patch'>;
export type SetUserPasswordBody = JsonBodyOf<'/admin/users/{username}/password', 'post'>;
export type CreateUsersBody = JsonBodyOf<'/admin/users', 'post'>;
export type NewUserRow = CreateUsersBody['users'][number];
export type CreatedUser = Schemas['CreatedUserResponse'];

export type PermissionEntry = Schemas['PermissionResponse'];
export type PermissionCategory = PermissionEntry['category'];
export type Role = Schemas['GroupResponse'];
export type RoleBody = JsonBodyOf<'/admin/groups', 'post'>;
export type UserAccess = Schemas['UserAccessResponse'];
export type RoleChange = JsonBodyOf<'/admin/groups/{id}', 'patch'>;
export type UserAccessChange = JsonBodyOf<'/admin/users/{username}/access', 'patch'>;
