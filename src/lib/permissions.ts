/** A permission name, or a list read as "any of these". Mirrors backend `libs/auth/src/principal/principal.ts`. */
export type PermissionRule = string | readonly string[];

/** What a permission check reads; a `SessionUser` is one. */
export interface PermissionHolder {
  isSuperuser: boolean;
  permissions: readonly string[];
}

/** Superusers hold every permission (Django semantics, which the backend keeps). `/auth/me` sends direct plus group permissions. */
export const hasPermission = (user: PermissionHolder | null, code: string): boolean =>
  Boolean(user && (user.isSuperuser || user.permissions.includes(code)));

const asList = (rule: PermissionRule): readonly string[] =>
  typeof rule === 'string' ? [rule] : rule;

/** `null`: no permission needed beyond being signed in (the router already keeps non-staff out of /admin). */
export function allowsAny(user: PermissionHolder | null, rule: PermissionRule | null): boolean {
  if (rule === null) return user !== null;
  return asList(rule).some((permission) => hasPermission(user, permission));
}
