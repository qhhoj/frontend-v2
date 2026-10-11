import { computed } from 'vue';
import { updateOrganization } from '@/api/organizations-admin.api';
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
  const nextAdmins = ({ member, makeAdmin }: RoleChange) =>
    makeAdmin
      ? [...adminIds.value, member.id]
      : adminIds.value.filter((adminId) => adminId !== member.id);
  const write = useOrganizationWrite<RoleChange, OrganizationDetail>({
    mutate: (change) => updateOrganization(slug(), { adminIds: nextAdmins(change) }),
    invalidates: () => [
      ['organizations', 'detail', slug()],
      ['organizations', 'members', slug()],
      organizationHistoryKey(slug()),
    ],
  });
  return { adminIds, write };
}
