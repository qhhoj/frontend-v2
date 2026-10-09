import { translate } from '@/i18n';

/** The staff-only problem permission: without it a field is locked up front, never refused after typing. */
export const EDIT_ALL_PROBLEM = 'judge.edit_all_problem';

/** The line naming the permission a locked field needs; nothing while the viewer can write it. */
export const lockNotice = (isLocked: boolean): string | undefined =>
  isLocked ? translate('admin.ui.needsPermission', { permission: EDIT_ALL_PROBLEM }) : undefined;

/** A field's own hint, with the permission it needs appended while the viewer cannot write the field. */
export function hintWhenLocked(hint: string, isLocked: boolean): string {
  return [hint, lockNotice(isLocked)].filter(Boolean).join(' ');
}

/** The `lockedBy` prop of a switch or chip list: the permission named while locked, nothing when writable. */
export const lockedByEditAll = (can: (permission: string) => boolean) =>
  can(EDIT_ALL_PROBLEM) ? undefined : EDIT_ALL_PROBLEM;
