import { needsPermissionText } from '../../ui/permission-text';

/** The staff-only problem permission: without it a field is locked up front, never refused after typing. */
export const EDIT_ALL_PROBLEM = 'judge.edit_all_problem';

/** "Cần quyền “Sửa mọi bài”" for a locked staff-only field; nothing while the viewer can write it. */
export const lockNotice = (isLocked: boolean): string | undefined =>
  isLocked ? needsPermissionText(EDIT_ALL_PROBLEM) : undefined;

/** A field's own hint, with the permission it needs appended while the viewer cannot write the field. */
export function hintWhenLocked(hint: string, isLocked: boolean): string {
  return [hint, lockNotice(isLocked)].filter(Boolean).join(' ');
}

/** The `lockedBy` prop of a checkbox or chip list: the permission codename while locked, nothing when writable. */
export const permissionLock = (can: (permission: string) => boolean, permission: string) =>
  can(permission) ? undefined : permission;
