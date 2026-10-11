import { usePermissions } from '@/stores/use-permissions';
import { needsPermissionText } from '../../ui/permission-text';

/** Which controls the account may change: a locked one names the permission it needs (in words), an open one nothing. */
export function usePermissionLocks() {
  const { can } = usePermissions();
  return {
    lockedBy: (permission: string): string | undefined =>
      can(permission) ? undefined : permission,
    /** The lock line replaces the field's own hint while the field is locked. */
    hintOf: (permission: string, hint?: string): string | undefined =>
      can(permission) ? hint : needsPermissionText(permission),
  };
}
