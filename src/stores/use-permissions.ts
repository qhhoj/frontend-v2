import { computed } from 'vue';
import { allowsAny, hasPermission } from '@/lib/permissions';
import type { PermissionRule } from '@/lib/permissions';
import { useSessionStore } from './session.store';

/** Permission checks against the signed-in user; reactive when called from a template or a computed. */
export function usePermissions() {
  const session = useSessionStore();
  return {
    can: (permission: string) => hasPermission(session.user, permission),
    canAny: (rule: PermissionRule | null) => allowsAny(session.user, rule),
    isSuperuser: computed(() => session.user?.isSuperuser ?? false),
  };
}
