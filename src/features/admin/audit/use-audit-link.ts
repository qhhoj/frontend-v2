import { useRouter } from 'vue-router';
import type { AuditEntry } from '@/api/types/audit-admin';
import { useSessionStore } from '@/stores/session.store';
import { canUseAdmin } from '../admin-access';
import { auditObjectLink } from './audit';

/** Where an entry's object opens, only when the viewer may open that admin screen: otherwise it shows as plain text, never a link to the forbidden page. */
export function useAuditLinkOf() {
  const router = useRouter();
  const session = useSessionStore();
  return (entry: AuditEntry) => {
    const target = auditObjectLink(entry);
    if (!target) return null;
    const { meta } = router.resolve(target);
    const isOpenable = canUseAdmin(session.user, {
      permission: meta.permission ?? null,
      capability: meta.capability,
    });
    return isOpenable ? target : null;
  };
}
