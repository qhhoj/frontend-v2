import { computed } from 'vue';
import { updateOrganization } from '@/api/organizations-admin.api';
import { fetchOrganization } from '@/api/organizations.api';
import type { OrganizationDetail, OrganizationMember } from '@/api/types/organizations';
import { useOrganizationQuery } from '@/features/organizations/organizations.queries';
import { organizationHistoryKey } from './organization-history.queries';
import { useOrganizationWrite } from './organization-write';

export interface RoleChange {
  member: OrganizationMember;
  makeAdmin: boolean;
}

/**
 * Legacy `OrganizationForm.admins` edited one member at a time: the PATCH sends the whole new admin list (the backend admits
 * a new admin, grants the Org Admin role and applies the three-organization cap, issue `admin_cap`).
 */
export function useAdminRole(slug: () => string) {
  const detail = useOrganizationQuery(slug);
  const adminIds = computed(() => detail.data.value?.admins.map((admin) => admin.id) ?? []);
  /** Built from a fresh read, so a change made meanwhile in another tab is never undone by a stale list. */
  async function changeRole({ member, makeAdmin }: RoleChange): Promise<OrganizationDetail> {
    const current = (await fetchOrganization(slug())).admins.map((admin) => admin.id);
    const next = makeAdmin
      ? [...new Set([...current, member.id])]
      : current.filter((adminId) => adminId !== member.id);
    return updateOrganization(slug(), { adminIds: next });
  }
  const write = useOrganizationWrite<RoleChange, OrganizationDetail>({
    mutate: changeRole,
    invalidates: () => [
      ['organizations', 'detail', slug()],
      ['organizations', 'members', slug()],
      organizationHistoryKey(slug()),
    ],
  });
  return { adminIds, write };
}
